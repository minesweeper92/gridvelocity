# Grid Velocity — Website 2026

Production website for [Grid Velocity](https://gridvelocity.com) — a Webflow Official Partner branding, video production and web design studio based in Karachi, Pakistan.

**Live:** [gridvelocity.com](https://gridvelocity.com)

---

## Stack

- **Plain HTML / CSS / JS** — no framework, no build step
- **Vercel** — hosting and edge CDN, auto-deploys from this repo
- **GSAP + ScrollTrigger** — scroll animations (self-hosted in `js/vendor/`)
- **Lottie** — CTA card animations (self-hosted)
- **Swiper** — team carousel on About page (self-hosted)
- **Google Analytics 4** — `G-PX6EFBB6R3`

All third-party libraries are self-hosted. Zero external CDN dependencies in production.

---

## Project Structure

```
/
├── index.html              Homepage
├── about.html              About page
├── contact.html            Contact form
├── careers.html            Careers / open roles
├── accessibility.html      Accessibility statement
│
├── services/
│   ├── branding.html       Brand Identity Studio service page
│   ├── video.html          Video Production service page
│   ├── websites.html       Webflow Agency service page
│   └── paid-ads.html       Performance Marketing service page
│
├── work/
│   ├── index.html          Work portfolio index
│   ├── nestle.html         Nestlé Bunyad Iron + case study
│   ├── onic.html           ONIC case study
│   ├── enkay.html          Enkay Consulting case study
│   ├── publicis.html       RED Publicis case study
│   ├── ministry-of-burgers.html
│   ├── ibento-bureau.html
│   ├── kati-baba.html
│   ├── claudia-monroy.html
│   ├── halal-boys.html
│   ├── sublime-by-sara.html
│   ├── issac-merch.html
│   ├── brew-box.html
│   ├── dlc.html
│   └── food-monsters.html
│
├── blog/
│   ├── index.html                          Blog index
│   ├── how-much-does-branding-cost.html    Article
│   ├── ai-video-production.html            Article
│   └── what-is-a-brand-playbook.html       Article
│
├── legal/
│   ├── privacy.html
│   ├── cookies.html
│   ├── terms.html
│   └── accessibility-statement.html
│
├── assets/
│   ├── work/               Case study images (named: {project}-hero.ext, {project}-gallery-NN.ext)
│   ├── projects/           Service page client thumbnails
│   ├── team/               Team member photos
│   ├── network-section-images/  About page network role images (directors.png, designers.png etc.)
│   ├── logos/              Client logo SVGs for homepage marquee
│   ├── lottie files        astronaut-original.json, astro-laptop.json, astro-levitate.json
│   └── brand files         logo-long-white.png, logo-long-orange.png, favicon.png etc.
│
├── css/
│   ├── main.css            All styles (v=140)
│   └── swiper-bundle.min.css
│
├── js/
│   ├── main.js             All site interactions (v=58)
│   └── vendor/
│       ├── gsap.min.js
│       ├── ScrollTrigger.min.js
│       ├── lottie-light.min.js
│       └── swiper-bundle.min.js
│
├── fonts/
│   ├── Boldonse-Regular.ttf
│   └── Archivo-VariableFont_wdth,wght.ttf
│
├── sitemap.xml
├── robots.txt
├── llms.txt                AI/LLM crawler instructions
└── vercel.json             Vercel config (cleanUrls: true)
```

---

## Architecture

The site is authored at **1440px design width** and scaled to the viewport by a `transform: scale()` on `#scaler`, set by `scaleToFit()` in `js/main.js`.

- **≥ 1024px** — JS scaling active, desktop layout
- **< 1024px** — JS scaling disabled, CSS media queries take over (mobile/tablet)

This means `position: sticky` doesn't work inside `#scaler` on desktop (CSS transforms break stacking contexts). The process flower animation solves this by portaling the sticky element to `<body>`.

---

## Deploying

Vercel auto-deploys on every push to `main`. To manually deploy:

```bash
npx vercel deploy --prod
```

---

## Adding a Blog Post

1. Copy `blog/how-much-does-branding-cost.html` as a template
2. Update: `<title>`, `<meta name="description">`, `<link rel="canonical">`, Article schema, BreadcrumbList schema, and content
3. Add a card to `blog/index.html`
4. Add the URL to `sitemap.xml`
5. Push to `main` — Vercel deploys automatically

---

## Asset Naming Conventions

| Folder | Convention | Example |
|--------|-----------|---------|
| `assets/projects/{project}/hero.ext, gallery-01.ext ...
| `assets/projects/` | `{project-slug}.ext` | `enkay-consulting.avif` |
| `assets/team/` | `{firstname-lastname}.ext` | `hashim-hameed.png` |
| `assets/network-section-images/` | `{role}.png` | `directors.png`, `designers.png` |

---

## SEO

- Structured data: Organization, WebSite, Service, FAQPage, Article, BreadcrumbList schemas
- `sitemap.xml` — 30 pages
- `robots.txt` — all crawlers allowed including GPTBot, ClaudeBot, PerplexityBot
- `llms.txt` — AI/LLM crawler context file
- GA4: `G-PX6EFBB6R3` — connected to Google Search Console

---

*Grid Velocity — Branding, Video & Webflow Studio*
