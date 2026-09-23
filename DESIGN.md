---
name: Our Keepsake
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#534344'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#867274'
  outline-variant: '#d9c1c2'
  surface-tint: '#944652'
  primary: '#944652'
  on-primary: '#ffffff'
  primary-container: '#d67b88'
  on-primary-container: '#571624'
  inverse-primary: '#ffb2bb'
  secondary: '#4a6453'
  on-secondary: '#ffffff'
  secondary-container: '#ccead3'
  on-secondary-container: '#506a58'
  tertiary: '#865046'
  on-tertiary: '#ffffff'
  tertiary-container: '#c4867a'
  on-tertiary-container: '#4c2219'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9dd'
  primary-fixed-dim: '#ffb2bb'
  on-primary-fixed: '#3e0313'
  on-primary-fixed-variant: '#772f3c'
  secondary-fixed: '#ccead3'
  secondary-fixed-dim: '#b0ceb8'
  on-secondary-fixed: '#062012'
  on-secondary-fixed-variant: '#334c3c'
  tertiary-fixed: '#ffdad3'
  tertiary-fixed-dim: '#fbb6a8'
  on-tertiary-fixed: '#351009'
  on-tertiary-fixed-variant: '#6a3930'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.01em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 34px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  eyebrow:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.22em
  body-quote:
    fontFamily: Playfair Display
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 2.5rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system embodies an intimate, romantic, and nostalgic digital sanctuary created specifically for celebrating shared love and memories between partners. The visual identity draws inspiration from physical memory-keeping: vintage scrapbook albums, tactile Polaroid snapshots, handwritten love notes, pressed peony petals, and retro cassette mixtapes.

### Design Movement & Aesthetic
- **Tactile Nostalgia & Warm Editorial:** Blends editorial typography with physical scrapbooking metaphors.
- **Atmospheric Emotion:** Warm, delicate, and deeply protective. It avoids cold tech tropes, embracing paper textures, gentle angles, subtle tilted framing (-3deg to 3deg on Polaroids), and soft ambient blurs.
- **Heartfelt Micro-Details:** Dainty hairline dividers with central botanical or heart motifs, subtle paper drop shadows, warm blush glows, and rounded tactile surfaces.

## Colors

The palette establishes an emotional, sunlit ambiance reminiscent of dried petals, vintage cardstock, and heirloom audio tapes.

### Roles & Semantic Usage
- **Primary (`#D67B88` / Antique Rose):** Anchors primary call-to-actions, romantic badges, active toggle states, notification pill dots, and key emotional highlights.
- **Secondary (`#7E9A86` / Vintage Sage):** Serves as an earthy, calming accent tailored for retro audio players, cassette ribbons, nature motifs, and playing state controls.
- **Tertiary (`#E8A598` / Soft Peony Peach):** Applied to secondary badges, soft icon backdrops, delicate border strokes, and subtle hover tints.
- **Neutral Surface Hierarchy:**
  - Base Background: `#FAF7F2` (Warm Linen Cream) transitioning gracefully into soft blush gradients (`linear-gradient(180deg, #FAF7F2 0%, #FFF5F2 100%)`).
  - Card & Container Surface: `#FFFDFB` (Pure Pressed Ivory) providing clean contrast against tinted cream backdrops.
- **Typography Neutrals:**
  - Ink Charcoal (`#2C2220`): High-contrast, gentle warm dark brown-black for headings and body text to avoid digital harshness.
  - Dusty Rose Muted (`#8C6F73`): Subtext, timestamps, and secondary captions.

## Typography

The type scale pairs an expressive, high-contrast serif (`Playfair Display`) with an approachable, clean humanist geometric sans-serif (`Plus Jakarta Sans`).

### Typographic Hierarchy
- **Editorial Intimacy (`Playfair Display`):** Reserved for display titles, card headers, and quote introspections. Use italic styles (`font-style: italic`) for personal reflections, quotes, and handwritten letter snippets (`body-quote`).
- **Modern Legibility (`Plus Jakarta Sans`):** Anchors UI controls, form fields, action buttons, timestamps, and card descriptors.
- **Eyebrow Headers:** Always rendered in uppercase with wide letter-spacing (`0.22em`), tinted in antique rose (`#D67B88`) to welcome the user into personal sections.

## Layout & Spacing

Layouts adhere to an intimate mobile-first vertical flow designed to feel like browsing an artful personal diary.

### Grid & Density Rules
- **Canvas Sizing:** Centered column container with a maximum content width of 480px on mobile and 860px on tablet/desktop, maintaining a personal, focused reading frame rather than a wide corporate dashboard.
- **Gutters & Margins:** 
  - Mobile: Outer margin `1.25rem`, vertical gap `1rem` between list tiles.
  - Desktop: Outer margin `2.5rem`, central album column with dual-pane layout for visual media and accompanying audio/letters.
- **Scrapbook Overlays:** Photos and Polaroids can break the rigid flow with negative spacing and staggered positions (e.g., `-1.5rem` horizontal pull) and gentle rotations (`transform: rotate(-3deg)` and `rotate(3.5deg)`).

## Elevation & Depth

Depth mimics real physical paper and photographic prints resting atop a soft linen table cloth.

### Elevation Principles
- **No Stark Grays:** Shadows are strictly tinted with warm terra and dusty blush undertones (`rgba(176, 120, 115, 0.12)`).
- **Polaroid Depth:**
  - `box-shadow: 0 10px 24px -4px rgba(184, 134, 128, 0.18), 0 2px 6px 0 rgba(0, 0, 0, 0.04);`
  - Gives Polaroid frames tangible lift while keeping colors delicate and warm.
- **Interactive Pill Cards & Lists:**
  - Resting: Subtle, crisp border (`1px solid #F5EAE6`) paired with a diffused ambient glow (`0 4px 16px rgba(226, 132, 144, 0.08)`).
  - Hover / Active: Smooth elevation shift with micro-scale (`transform: translateY(-2px) scale(1.005)`).
- **Cassette Tape Realism:** Multi-level inward beveling using inner shadows (`inset 0 2px 4px rgba(255, 255, 255, 0.6)`, `inset 0 -2px 6px rgba(60, 75, 65, 0.15)`) coupled with soft olive borders.

## Shapes

Shapes communicate gentleness and comfort. Rigid 90-degree corners are avoided across UI surfaces, with physical paper items adopting slightly firmer corners than interactive UI pills.

### Geometry Specifications
- **Interactive Buttons & Badges:** Full pill-shaped geometries (`border-radius: 9999px`) provide touch-friendly softness.
- **Cards & Content Panels:** Defined by `rounded-xl` (`1.25rem` to `1.5rem`), creating pillowy, protective enclosures.
- **Polaroid Frames:** Structured rectangular outer containers with subtle `0.5rem` rounding, thick bottom photo-margins for handwritten captioning, and micro-rotations.
- **Cassette Player:** Symmetrical rounded industrial contour (`rounded-2xl` / `1rem`) with circular spool cutouts.

## Components

### Buttons
- **Primary CTA ("Entrar", "Guardar"):** Pill-shaped, background tinted in `#D67B88` with white text, font `Plus Jakarta Sans` semi-bold, accompanied by subtle right-arrow or heart icons. Active press scales down slightly (`0.98`).
- **Secondary Pill Button ("Ver secciones", "Cambiar usuario"):** Translucent creamy white background (`rgba(255, 253, 251, 0.9)`), border `1px solid #F2DDD8`, text color `#6B4F53`, with trailing chevron or indicator pill badges.

### List Navigation Tiles (Music, Letters, Memories, etc.)
- **Container:** Full-width rounded card (`border-radius: 1.25rem`), background `#FFFDFB`, border `1px solid #F5EAE6`.
- **Leading Icon Avatar:** Soft square with curved corners (`border-radius: 0.75rem`), background `#FCECEF`, tinted icon glyphs in `#D67B88`.
- **Content:** Title in `Playfair Display` semi-bold, subtitle in `Plus Jakarta Sans` muted dusty rose.
- **Trailing Affordance:** Subtle right-facing chevron in `#CBB5B5`.

### Scrapbook Polaroids & Floating Photos
- Ivory border frame (`8px` top/sides, `24px` to `32px` bottom) enclosing photos.
- Handwritten style caption at the bottom margin using casual or italicized typography.
- Gentle tilted orientation (`-2.5deg` left or `+3deg` right) with warm ambient blur.

### Vintage Cassette Player
- Body finished in vintage sage green (`#7E9A86` or `#B5C7BB`), accented with floral line art decals, physical screws, cassette spool cutouts, and playing track indicator buttons.
- Linear track list with circular play/pause buttons utilizing `#5B7065` for active states.

### Badges & Notification Dots
- Numeric counters: Pill badge with primary antique rose fill (`#D67B88`), crisp white text, placed slightly offset on the top-right corner of icons or menu buttons.

### Dividers & Flourishes
- Hairline dividers tinted in `#F0D5D8` centered with a small filled heart (`♥`) or blooming botanical glyph.