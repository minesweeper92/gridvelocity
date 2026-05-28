---
name: Grid Velocity
description: Production, design, and web studio — dark-first, orange-led, kinetic.
colors:
  primary: "#EF4823"
  primary-dark: "#b53a1a"
  surface: "#0D0D0D"
  surface-body: "#000000"
  text-primary: "#FFFFFF"
  text-secondary: "#888888"
  text-on-light: "#0D0D0D"
  neutral-light: "#F5F4F2"
typography:
  display:
    fontFamily: "'Boldonse', sans-serif"
    fontSize: "clamp(60px, 8vw, 170px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  display-section:
    fontFamily: "'Boldonse', sans-serif"
    fontSize: "clamp(28px, 4vw, 72px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "normal"
  subheading:
    fontFamily: "'Archivo', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "normal"
  body:
    fontFamily: "'Archivo', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "'Archivo', sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.1em"
  nav:
    fontFamily: "'Archivo', sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "14px"
  pill: "9999px"
spacing:
  xs: "12px"
  sm: "24px"
  md: "48px"
  lg: "88px"
  xl: "120px"
  section: "100px"
components:
  button-primary:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.text-on-light}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
  button-orange:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  nav-cta:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.text-on-light}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
---

## Overview

Grid Velocity's visual system is built for a dark stage. The primary surface is near-black (#0D0D0D), the accent is a committed orange (#EF4823), and the two typefaces — Boldonse (display) and Archivo variable (everything else) — carry the entire visual hierarchy.

The site runs on a fixed 1440px canvas scaled to viewport width via `transform: scale(vw/1440)`. This means pixel values in CSS are design-canvas values, not responsive breakpoints. Motion is GSAP + ScrollTrigger; marquee tracks use GSAP `xPercent` loops; Swiper handles carousels.

The design is dark by conviction, not by default. Grid Velocity works under stage lights and on set; the site belongs in that world.

## Colors

**Primary**: `#EF4823` — the studio's orange. Used as a primary CTA color, active-state indicator, section accent, and hover target. It is not a decorative accent; it leads. When it appears, it commits.

**Primary dark**: `#b53a1a` — a deeper shade for pressed/focus states and hover backgrounds on orange elements.

**Surface (dark)**: `#0D0D0D` — the primary background for most sections. Not pure black; slightly warm-shifted.

**Body background**: `#000000` — true black used as the html/body canvas. Sections sit on top.

**Text primary**: `#FFFFFF` — headings and primary copy on dark backgrounds.

**Text secondary**: `#888888` — secondary metadata, captions, eyebrow labels in non-critical contexts.

**Neutral light**: `#F5F4F2` — used for light-section backgrounds (services pages, some about sections). Warm offwhite.

**Color strategy**: Committed. The orange carries the brand voice at 30-60% presence on hero surfaces. Dark neutrals surround it to amplify, not dilute.

OKLCH equivalents for implementation:
- Orange: `oklch(60% 0.22 33)`
- Orange dark: `oklch(45% 0.18 33)`
- Surface: `oklch(10% 0.005 33)`
- Text secondary: `oklch(57% 0 0)`

## Typography

**Boldonse** is the display typeface. Single weight, all-caps visual presence. Used exclusively for section headings, hero type, eyebrow labels, and decorative ambient text. Never used for body copy.

**Archivo** is the workhorse. Variable font (100-900 weight range, normal and italic). Used for all body copy, labels, navigation, CTAs, and UI text. The 700 weight carries subheadings and callouts; 400 handles body; 700-800 for emphasis.

**Hierarchy**: Boldonse scales create authority at the top (60-170px ambient, 28-72px section heads). Archivo 700 at 15-20px handles mid-tier labels. Archivo 400 at 14-17px handles body. The gap between tiers is always ≥1.5×.

**Labels**: Uppercase, 11-13px, 700 weight, `letter-spacing: 0.08-0.12em`. Used sparingly as section eyebrows or metadata tags. Not repeated as scaffolding on every section.

**Line height**: Body at 1.6-1.7 on dark backgrounds to compensate for perceived lightness. Display at 1.0-1.1 for tightness. Section heads at 1.05.

**Body max-width**: 65-75ch for long-form paragraphs.

## Elevation

No traditional shadow system — depth is achieved through opacity, color contrast, and z-index layering rather than box-shadows.

**Layer model** (bottom to top):
1. Body background (#000)
2. Scaler canvas (#0D0D0D sections)
3. Content sections (z-index 1-10)
4. Sticky navigation (z-index 100)
5. Dropdowns, tooltips (z-index 200)
6. Modals, overlays (z-index 300)

**Ambient depth**: Large low-opacity Boldonse text (`opacity: 0.03-0.12`) sits behind content to create depth without clutter. Radial orange glows behind key sections hint at warmth without becoming gradients.

**Focus ring**: `outline: 2px solid #EF4823; outline-offset: 3px` — orange ring, consistent with brand, meets WCAG 2.1 AA for non-text contrast.

## Components

### Navigation

Fixed header, dark background (#0D0D0D), 80-88px height. Boldonse wordmark left, Archivo 700 nav links center, pill CTA right. On scroll, the logo image shrinks slightly (42px → 36px). Dropdown menus have 14px border-radius, 13px 700 weight uppercase links.

### CTA Buttons

Two variants:
- **White pill** (primary): white background, dark text, 9999px radius, 10-12px/22-24px padding, Archivo 700 13px. Hover: orange background, white text. Active: `scale(0.97)`.
- **Orange pill**: orange background, white text, same radius/padding.

No square buttons. No underlined text links for primary actions. CTAs are always pills.

### Section Eyebrows

Small star glyph (`★` or CSS `clip-path` star shape) + uppercase label in Archivo 700 11-13px, `letter-spacing: 0.1em`. Used once per section to orient the reader. Not repeated on every sub-element.

### Swiper Carousels

Team and testimonial carousels use Swiper 11. Custom nav buttons: 48×48px circles, white background, dark text, no Swiper defaults. `slidesPerView: 5` (team), `loop: true`, `speed: 600ms`.

### Marquee Tracks

Three alternating-direction tracks using GSAP `fromTo xPercent`. Font: Boldonse 56px, `opacity: 0.09` default, orange + text-shadow on hover. Mask gradient fades left and right edges. Hover: `timeScale 0.2` (slow) → `timeScale 1` (resume).

## Do's and Don'ts

**Do:**
- Use Boldonse only for display/headings; never body copy or navigation
- Lead with orange for CTAs and active states; let it carry weight
- Maintain the dark surface across most sections; use offwhite (#F5F4F2) sparingly for contrast
- Vary section padding deliberately: some sections breathe (100px+), some sections crowd (tight juxtapositions)
- Animate purposefully: GSAP ScrollTrigger entrance animations, marquee loops, count-up stats
- Respect `prefers-reduced-motion` — all GSAP animations should check `hasST` and `reducedMotion`

**Don't:**
- Use gradient text (`background-clip: text` + gradient) — banned
- Add `border-left` colored side-stripe accents — banned
- Use glassmorphism decoratively — banned
- Repeat the section-eyebrow label pattern on every sub-element (use it once per section)
- Use white or offwhite as the primary background on most pages — this is a dark-first system
- Animate layout properties (height, width, padding) — use transform and opacity only
- Use bounce or elastic easing (`back.out`, `elastic`) outside of specific playful interactions
