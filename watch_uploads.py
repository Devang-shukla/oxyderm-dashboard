#!/usr/bin/python3
"""
Oxyderm Video Watcher
Watches uploads/videos/ folder for new files.
When a new .mp4 appears, adds music + captions and saves to videos-final/.
Run once: python3 watch_uploads.py
"""

import os, time, json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WATCH_DIR  = Path("/Users/genesis/Desktop/Oxyderm-Build/dashboard/uploads/videos")
OUT_DIR    = Path("/Users/genesis/Desktop/Oxyderm-Build/content/videos-final")
MUSIC      = OUT_DIR / "bg-music.mp3"
SEEN_FILE  = Path("/tmp/ox-watched.json")

WATCH_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

def load_seen():
    try: return set(json.loads(SEEN_FILE.read_text()))
    except: return set()

def save_seen(s): SEEN_FILE.write_text(json.dumps(list(s)))

def get_info(path):
    r = subprocess.run(
        ["ffprobe","-v","quiet","-print_format","json","-show_streams",str(path)],
        capture_output=True, text=True)
    d = json.loads(r.stdout)
    w,h,dur = 1920,1080,60.0
    for s in d.get("streams",[]):
        if s.get("codec_type")=="video":
            w,h = int(s.get("width",1920)),int(s.get("height",1080))
        if s.get("duration"): dur = float(s["duration"])
    return w,h,dur

def make_png(line1, line2, w, h, out):
    img = Image.new("RGBA",(w,h),(0,0,0,0))
    draw = ImageDraw.Draw(img)
    is_vert = h > w
    fs1 = 48 if is_vert else 56
    fs2 = 36 if is_vert else 42
    bar_h = 130
    bar_y = h - bar_h
    draw.rectangle([(0,bar_y),(w,h)], fill=(0,23,45,200))
    draw.rectangle([(0,bar_y),(w,bar_y+3)], fill=(201,169,110,255))
    fps = ["/System/Library/Fonts/Helvetica.ttc","/System/Library/Fonts/Arial.ttf","/Library/Fonts/Arial.ttf"]
    f1=f2=None
    for fp in fps:
        if os.path.exists(fp):
            try: f1=ImageFont.truetype(fp,fs1); f2=ImageFont.truetype(fp,fs2); break
            except: pass
    if not f1: f1=f2=ImageFont.load_default()
    for line, font, color, y in [
        (line1, f1, (255,255,255,255), bar_y+14),
        (line2, f2, (201,169,110,255), bar_y+14+fs1+8),
    ]:
        bb = draw.textbbox((0,0),line,font=font)
        x = (w-(bb[2]-bb[0]))//2
        draw.text((x,y),line,fill=color,font=font)
    img.save(out,"PNG")

def process(src, caption):
    stem = Path(src).stem
    out  = OUT_DIR / (stem + "_final.mp4")
    if out.exists():
        print(f"  Already processed: {out.name}")
        return True

    parts = caption.split("|") if "|" in caption else [caption, "Book Now: oxyderm.ca"]
    line1 = parts[0].strip()[:60]
    line2 = parts[1].strip()[:60] if len(parts) > 1 else "Oxyderm Beauty Clinic | Edmonton"

    w,h,dur = get_info(src)
    png = f"/tmp/ox_cap_{stem}.png"
    make_png(line1, line2, w, h, png)
    fade_out = max(0, dur-2)

    cmd = [
        "ffmpeg","-y",
        "-i", str(src),
        "-i", png,
        "-stream_loop","-1","-i", str(MUSIC),
        "-filter_complex",
        f"[0:v][1:v]overlay=0:0[vout];"
        f"[0:a]volume=1.0[orig];"
        f"[2:a]volume=0.18,afade=t=in:st=0:d=2,afade=t=out:st={fade_out}:d=2[music];"
        f"[orig][music]amix=inputs=2:duration=first[aout]",
        "-map","[vout]","-map","[aout]",
        "-c:v","libx264","-preset","fast","-crf","23",
        "-c:a","aac","-b:a","128k",
        "-t",str(dur),
        str(out)
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try: os.remove(png)
    except: pass
    if r.returncode == 0:
        size = out.stat().st_size // (1024*1024)
        print(f"  Done ({size}MB): {out.name}")
        return True
    else:
        print(f"  FAILED: {r.stderr[-200:]}")
        return False

print("Oxyderm Video Watcher started.")
print(f"Watching: {WATCH_DIR}")
print(f"Output:   {OUT_DIR}")
print("Ctrl+C to stop.\n")

seen = load_seen()
while True:
    try:
        for f in WATCH_DIR.glob("*.mp4"):
            if f.name not in seen:
                print(f"New video: {f.name}")
                # Check for matching caption file
                cap_file = f.with_suffix(".txt")
                if cap_file.exists():
                    caption = cap_file.read_text().strip()
                else:
                    caption = "Oxyderm Beauty Clinic | Edmonton"
                ok = process(f, caption)
                if ok:
                    seen.add(f.name)
                    save_seen(seen)
        time.sleep(5)
    except KeyboardInterrupt:
        print("\nWatcher stopped.")
        break
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(5)
