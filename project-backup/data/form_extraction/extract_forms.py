#!/usr/bin/env python3
"""
Oxyderm client-info form extractor.

Pulls all "Treatment Records", "Skin Chart Form", and "Medical History Form"
emails from Gmail via IMAP, extracts NON-MEDICAL personal-info fields only
(name, treatment area, membership, skin type/ethnicity, dates), and writes
progress to a local JSONL file so the run is resumable/inspectable.

Deliberately excludes: medical conditions, medications, pregnancy status,
physician details, allergies — anything from the Medical History Form's
health-history section. Only name + date are kept from that form type.
"""
import imaplib
import email
import subprocess
import json
import re
import sys
import time
from email.header import decode_header

GMAIL_USER = "info@oxydermlaserclinic.ca"
KEYCHAIN_SERVICE = "oxyderm-gmail-app-password"

OUT_DIR = "/Users/genesis/Desktop/Oxyderm-Build/data/form_extraction"
PROGRESS_OUT = f"{OUT_DIR}/progress.json"

SUBJECTS = {
    "treatment": "Treatment Records",
    "skin_chart": "Skin Chart Form",
    "medical": "Medical History Form",
}


def get_app_password():
    r = subprocess.run(
        ["security", "find-generic-password", "-a", GMAIL_USER, "-s", KEYCHAIN_SERVICE, "-w"],
        capture_output=True, text=True
    )
    return r.stdout.strip()


def decode_str(s):
    if not s:
        return ""
    parts = decode_header(s)
    out = []
    for text, enc in parts:
        if isinstance(text, bytes):
            out.append(text.decode(enc or "utf-8", errors="replace"))
        else:
            out.append(text)
    return "".join(out)


def get_body_text(msg):
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition") or "")
            if ctype == "text/plain" and "attachment" not in disp:
                try:
                    return part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace")
                except Exception:
                    continue
        return ""
    else:
        try:
            return msg.get_payload(decode=True).decode(msg.get_content_charset() or "utf-8", errors="replace")
        except Exception:
            return ""


def parse_treatment_record(body):
    """Extract non-medical fields from a Treatment Records email body."""
    data = {}
    m = re.search(r"Patient Name:\s*(.+)", body)
    if m: data["name"] = m.group(1).strip()
    m = re.search(r"^No\.\s*:\s*(.+)$", body, re.MULTILINE)
    if m: data["record_no"] = m.group(1).strip()
    m = re.search(r"^Date:\s*(.+)$", body, re.MULTILINE)
    if m: data["treatment_date"] = m.group(1).strip()
    m = re.search(r"Treatment Area:\s*(.+)", body)
    if m: data["treatment_area"] = m.group(1).strip()
    m = re.search(r"Comments:\s*(.+?)(?:\n\n|\nHetisha|\nSignature|$)", body, re.DOTALL)
    if m:
        comment = m.group(1).strip()
        data["comments"] = comment
        # Extract membership info if present
        mm = re.search(r"[Mm]embership.*?(?:started|type)[^\n]*", comment)
        if mm: data["membership_note"] = mm.group(0).strip()
    return data


def parse_skin_chart(body):
    """Extract non-medical fields from a Skin Chart Form email body."""
    data = {}
    m = re.search(r"Customer Name:\s*(.+)", body)
    if m: data["name"] = m.group(1).strip()
    m = re.search(r"^Date:\s*(.+)$", body, re.MULTILINE)
    if m: data["form_date"] = m.group(1).strip()
    m = re.search(r"Ethnicity:\s*(.+)", body)
    if m: data["ethnicity"] = m.group(1).strip()
    m = re.search(r"Natural skin colour:\s*(.+)", body)
    if m: data["skin_colour_score"] = m.group(1).strip()
    m = re.search(r"Skin chart number:\s*(.+)", body)
    if m: data["skin_type_number"] = m.group(1).strip()
    return data


def parse_medical_history(body):
    """Extract ONLY name + date from Medical History Form — no health fields."""
    data = {}
    # Name appears in the DPC Consent Form section, not the medical section
    m = re.search(r"DPC Consent Form:\s*\nName:\s*(.+)", body)
    if not m:
        m = re.search(r"^Name:\s*(.+)$", body, re.MULTILINE)
    if m: data["name"] = m.group(1).strip()
    m = re.search(r"^Date:\s*(\d{4}-\d{2}-\d{2})", body, re.MULTILINE)
    if m: data["form_date"] = m.group(1).strip()
    return data


PARSERS = {
    "treatment": parse_treatment_record,
    "skin_chart": parse_skin_chart,
    "medical": parse_medical_history,
}


def main():
    form_type = sys.argv[1] if len(sys.argv) > 1 else None
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    start_offset = int(sys.argv[3]) if len(sys.argv) > 3 else 0

    if form_type not in SUBJECTS:
        print(f"Usage: python3 {sys.argv[0]} <treatment|skin_chart|medical> [limit] [start_offset]")
        sys.exit(1)

    raw_out = f"{OUT_DIR}/raw_{form_type}.jsonl"

    pw = get_app_password()
    if not pw:
        print("ERROR: could not retrieve app password from Keychain")
        sys.exit(1)

    print(f"Connecting to Gmail IMAP as {GMAIL_USER}...")
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(GMAIL_USER, pw)
    imap.select("INBOX", readonly=True)

    subject = SUBJECTS[form_type]
    print(f"Searching for subject: {subject}")
    status, data = imap.search(None, f'(SUBJECT "{subject}")')
    if status != "OK":
        print(f"IMAP search failed: {status}")
        sys.exit(1)

    uids = data[0].split()
    total = len(uids)
    print(f"Found {total} messages for '{subject}'.")

    if limit:
        uids = uids[start_offset:start_offset + limit]
    else:
        uids = uids[start_offset:]

    parser = PARSERS[form_type]
    count = 0
    errors = 0
    reconnects = 0

    with open(raw_out, "a") as outf:
        for i, uid in enumerate(uids):
            retry = 0
            while retry < 3:
                try:
                    status, msg_data = imap.fetch(uid, "(RFC822)")
                    if status != "OK":
                        errors += 1
                        break
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    body = get_body_text(msg)
                    fields = parser(body)
                    fields["_form_type"] = form_type
                    fields["_email_date"] = msg.get("Date", "")
                    fields["_email_uid"] = uid.decode()
                    outf.write(json.dumps(fields) + "\n")
                    outf.flush()
                    count += 1
                    break
                except (imaplib.IMAP4.abort, imaplib.IMAP4.error, ConnectionError, OSError) as e:
                    retry += 1
                    reconnects += 1
                    print(f"  [RECONNECT] uid {uid}, attempt {retry}: {e}", flush=True)
                    time.sleep(2)
                    try:
                        imap.logout()
                    except Exception:
                        pass
                    imap = imaplib.IMAP4_SSL("imap.gmail.com")
                    imap.login(GMAIL_USER, pw)
                    imap.select("INBOX", readonly=True)
                except Exception as e:
                    errors += 1
                    print(f"  [ERROR] uid {uid}: {e}", flush=True)
                    break
            if (i + 1) % 50 == 0:
                print(f"  ...{i+1}/{len(uids)} processed ({count} extracted, {errors} errors, {reconnects} reconnects)", flush=True)

    try:
        imap.logout()
    except Exception:
        pass
    print(f"\nDone. form_type={form_type} total_found={total} processed={len(uids)} extracted={count} errors={errors} reconnects={reconnects}", flush=True)
    print(f"Appended to: {raw_out}", flush=True)


if __name__ == "__main__":
    main()
