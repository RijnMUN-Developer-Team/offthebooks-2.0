# RijnMUN design QA

**Source visual truth**

- `design/selected-homepage.png`
- Source pixels: 721 × 2180 (generated long-page concept representing a 1440px desktop layout)

**Implementation evidence**

- `qa-home-desktop-final.png`
- `qa-home-mobile-final.png`
- `qa-comparison-final.png`
- `qa-focus-hero-final.png`
- Desktop capture pixels: 1440 × 5087; CSS viewport: 1440 × 1000; device scale factor: 1
- Mobile capture pixels: 375 × 7040; CSS viewport: 375 × 812; device scale factor: 1
- State: homepage, top of page, reduced-motion preference enabled so all below-fold content is visible in a deterministic full-page capture
- Density normalization: source retained at 721px wide; desktop capture scaled proportionally to fit a 721 × 2180 comparison panel and padded without distortion

## Findings

No actionable P0, P1 or P2 differences remain.

- Typography: the implementation uses Libre Caslon Display with DM Sans, preserving the source's editorial serif/sans hierarchy, large event title, restrained uppercase labels and compact metadata. Line lengths and weights remain readable at desktop and mobile sizes.
- Spacing and layout: hero, countdown, editorial introduction, typographic statistics, committee panels, journey, news, CTA and footer follow the source sequence and proportions. The implementation is longer because it carries full real content and seven journey stages rather than abbreviated concept copy.
- Colors and tokens: deep diplomatic navy, institutional blue, light blue, white and restrained gold rules match the source direction. Contrast is strong across navigation, overlays and buttons.
- Image quality: all visible photography is sourced from the official RijnMUN site and uses responsive cover crops. This intentionally differs from the synthetic people and UN-room imagery in the concept while more closely satisfying the brief's authenticity requirement. No placeholder imagery or CSS-drawn image substitutes remain.
- Copy and content: event identity, 20–22 November 2026 dates, venue, committees, verified issues, statistics and news are present. Unreleased information uses intentional announcement states.
- Icons: interface icons use a consistent outline family; official Instagram and TikTok raster marks are used for the social links.
- Responsiveness: no horizontal overflow at 375px or 1440px. Mobile navigation opens, closes and routes correctly; committee content remains available without hover.
- Accessibility: the homepage has one H1, every image has an alt attribute, every link has an href, focus styles are visible, semantic buttons/tabs are keyboard reachable and reduced motion produces a complete static layout.

## Focused comparison evidence

`qa-focus-hero-final.png` compares the navigation, hero, countdown and introduction at equal width. Event hierarchy, CTA placement, navy overlay, date/location treatment, countdown structure and the text/image split align with the selected visual. The exact conference photograph is intentionally replaced by an authentic RijnMUN image.

## Comparison history

### Pass 1

- [P1] Header used the dark transparent treatment instead of the selected white institutional bar.
- [P2] Introduction image and copy columns were reversed relative to the selected design.
- Fixes: changed the fixed header to white with blue identity/navigation treatment and reordered the desktop introduction to copy-left/image-right.
- Post-fix evidence: `qa-comparison-final.png` and `qa-focus-hero-final.png` show both issues resolved.

### Final pass

- All requested routes rendered with one visible H1.
- Primary interactions tested: desktop route navigation, GA3 committee tab selection, mobile menu open/close and mobile programme navigation.
- Browser console and page errors checked: none.
- Desktop and mobile horizontal overflow: 0px.
- Remaining differences are limited to intentional use of authentic source photography and expanded real-world content.

## Follow-up polish

- [P3] The complete homepage is taller than the generated concept because the build preserves all seven journey stages and full news descriptions.
- [P3] Remote Google Fonts can fall back briefly to Georgia/Arial on a slow first load; self-hosting the font files would remove that small shift before production deployment.

## Implementation checklist

- [x] Selected visual hierarchy implemented
- [x] Authentic RijnMUN images placed
- [x] Desktop and mobile captures reviewed
- [x] Core navigation and interactions exercised
- [x] Console and overflow checks passed
- [x] P1/P2 findings corrected and recaptured

final result: passed
