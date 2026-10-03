# OxyDerm Laser Clinic — Web Implementation Brief for Marketing Agency
**Date:** October 3, 2026  
**Client:** Oxyderm Laser Clinic (Unit 211, 6958 76 Ave NW, Edmonton AB T6B 2R2 | 780-863-7561)  
**Target:** Conversion Rate Optimization, Local SEO, and AI Search Readiness

---

## 1. Primary CTA & Booking Link Swap
**Goal:** Remove callback form friction and enable instant online booking for free consultations.

* **Current State:** "Book Now" buttons route to an external callback request form (`leadshaw.io`).
* **Required Change:** Replace all primary CTA button links across the website with the direct Square Free Consultation link:
  `https://book.squareup.com/appointments/dkt5it2zn9eyr0/location/SA5CTAH41JNY2/services/VU4R6ZVWFLJIT5H6IVW6DZ2Y`
* **Button Text:** Change button label from "Book Now" / "Request Consultation" to:
  `Book Free Consult & Test Patch`

---

## 2. Structured Data (JSON-LD Schema)
**Goal:** Improve Google Maps rankings, local pack visibility, and AI search indexing.
**Action:** Place the following JSON-LD block into the `<head>` of the website (via theme header or Yoast / RankMath custom code):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["MedicalBusiness", "HealthAndBeautyBusiness"],
  "@id": "https://oxydermlaserclinic.ca/#organization",
  "name": "Oxyderm Laser Clinic",
  "url": "https://oxydermlaserclinic.ca",
  "logo": "https://oxydermlaserclinic.ca/logo.png",
  "image": "https://oxydermlaserclinic.ca/assets/clinic.jpg",
  "telephone": "+1-780-863-7561",
  "email": "info@oxydermlaserclinic.ca",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Unit 211, 6958 76 Ave NW",
    "addressLocality": "Edmonton",
    "addressRegion": "AB",
    "postalCode": "T6B 2R2",
    "addressCountry": "CA"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 53.504825,
    "longitude": -113.435777
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "10:00",
      "closes": "18:00"
    }
  ],
  "founder": {
    "@type": "Person",
    "name": "Hetisha Shukla",
    "jobTitle": "Lead Medical Esthetician",
    "description": "Honours graduate from European Institute of Esthetics with over 10 years experience in advanced laser and clinical skin therapies."
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Clinical Laser & Skin Treatments",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Laser Hair Removal (Nd:YAG, Alexandrite, IPL)"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Microneedling & PRP Skin Therapy"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Melanin-Safe Chemical Peels"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Free Consultation with Test Patch"
        }
      }
    ]
  }
}
</script>
```

---

## 3. SEO Privacy & Sitemap Cleanup (Apply `noindex`)
**Goal:** Prevent search engines from indexing private medical intake and client consent forms.
**Action:** In Yoast / RankMath (Advanced Settings -> "Allow search engines to show this Page in search results" -> Select **No**), mark these URLs as `noindex` and exclude them from `sitemap_index.xml`:

1. `/medical-history-form`
2. `/treatment-records`
3. `/personal-information`
4. `/release-form`
5. `/edermastamp-dermaroller-treatment-consent-form`
6. `/chemical-peel-microdermabrasion-consent-form`
7. `/massage-therapy-client-intake`
8. `/massagebook-digital-soap-note-form`
9. `/skin-chart`
10. `/skin-chart-2`
11. `/contact-form`
12. `/thankyou`

---

## 4. 301 Redirects for Discontinued / Legacy Pages
**Goal:** Clean 404s and redirect legacy injectables / unoffered services to active treatment categories.

| Old URL (Redirect From) | New URL (301 Permanent Redirect To) | Reason |
|---|---|---|
| `/injectables` | `/laser-hair-removal-edmonton` | Injectables not offered |
| `/botox-injections` | `/laser-hair-removal-edmonton` | Injectables not offered |
| `/dysport-injections` | `/laser-hair-removal-edmonton` | Injectables not offered |
| `/dermal-fillers` | `/skin-rejuvenation-edmonton` | Injectables not offered |
| `/juvederm-restylane-teosyal-revanesse-fillers` | `/skin-rejuvenation-edmonton` | Injectables not offered |
| `/biostimulators-sculptra` | `/microneedling-edmonton` | Injectables not offered |
| `/pdo-thread-lift-treatment` | `/skin-rejuvenation-edmonton` | Service not offered |
| `/skin-lightening-treatment` | `/pigmentation-treatment-edmonton` | Non-compliant terminology -> Brightening |

---

## 5. Technical Template Fixes
* **Blog Single Template (`single.php`):** The `<h1>` tag currently outputs `"Post navigation"` instead of the actual article title. Please update the single blog template so the post title is the sole `<h1>` on blog pages.
* **Meta Pixel Duplicate:** Two pixel IDs are currently firing (`5107570072619273` and `415211902501495`). Please remove `415211902501495` and keep `5107570072619273`.
