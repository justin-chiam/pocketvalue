# PocketValue design system

Source of truth for brand, color, type, spacing, motion, and component patterns
across the landing page and `mobile`. This was extracted from the fully
realized web landing page (`frontend/src/pages/Landing.tsx` + `Landing.css`)
and the synced mobile theme. Nothing here is aspirational — every token below
is copied from shipping code.

**Status:** the landing page (`/`) and mobile app are on-brand. There is no web
app workflow. See [Sync status](#sync-status) for the current surface status.

## Brand

- **Name:** PocketValue
- **Wordmark:** set in the display face, 700 weight, tight tracking. No
  logomark yet — text wordmark only (`frontend/src/pages/Landing.tsx`, `.wordmark`).
- **Voice:** short, confident sentences. No em dashes. Copy leans editorial,
  not marketing-speak ("Your old tech isn't dead. It's undecided.").
- **Mission framing:** anti-consumerist, not a resale marketplace. The
  product talks users out of unnecessary upgrades first; "buy new" is
  positioned as the last resort, struck through, not a CTA.

## Color

Light theme only, deliberately — `color-scheme: light` is set explicitly on
`.landing` and there is no dark-mode variant. Don't add one without a product
decision; the brand reads as an off-white, editorial, high-contrast page.

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#ffffff` | Page background |
| `--surface` | `#ffffff` | Card / panel background (same as paper — cards are separated by border, not fill) |
| `--ink` | `#191c1a` | Headings, primary text |
| `--body-c` | `#494f4c` | Body copy |
| `--muted` | `#6a716d` | Secondary text, captions, labels |
| `--line` | `#e5e7e6` | Hairline borders, dividers |
| `--pine` | `#1c5b45` | **The one accent color.** CTAs, links, active states, icons, stat figures, stamps |
| `--cta-bg` | `#1c5b45` (= pine) | Primary button fill |
| `--cta-text` | `#f2f7f4` | Text/icon color on pine fill |

Rules that came out of iteration, keep them when extending:

- **One accent only.** Pine green carries every accent use on the page —
  buttons, links, icon strokes, stat numbers, the "keep it" stamp, the
  featured-state fill on hover. No secondary accent color was introduced.
- **Cards are outlined, not filled.** Default card state is `--surface`
  background + 1px `--line` border, radius 16px. Color fill (pine) is
  reserved for *emphasis on interaction* — e.g. the five outcome cards
  (`.outcome`) are all neutral by default and animate to a solid pine fill
  only `on hover` (see [Motion](#motion)).
- **Text-on-pine pairing:** `#f2f7f4` for headings/icons on a pine fill,
  `#c8ddd2` for body copy on a pine fill (slightly desaturated so body text
  doesn't compete with headings).

## Typography

Two typefaces, both self-hosted via `@fontsource` (no runtime Google Fonts
requests):

| Role | Family | Package | Used for |
|---|---|---|---|
| Display | **Bricolage Grotesque** (variable) | `@fontsource-variable/bricolage-grotesque` | All headings, wordmark, CTA labels, stat figures, "ticket" device-report card |
| Body | System sans (`system-ui, 'Segoe UI', Roboto, sans-serif`) | none — system stack | Paragraph copy |
| Mono / data | **IBM Plex Mono** (400 + 500) | `@fontsource/ibm-plex-mono` | Uppercase tracked labels, spec data (condition grade, price rows), the "9:41" status bar on the phone mockup |

Type scale (desktop, from `Landing.css`):

| Element | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|
| H1 (hero) | `clamp(2.5rem, 5.4vw, 4.15rem)` | 640 | `-0.028em` | `line-height: 1.04`, one word emphasized in pine italic |
| H2 (section) | `clamp(1.8–1.9rem, ~3.5vw, 2.75–2.9rem)` | 600–620 | `-0.02em` | Every major section header |
| H3 (card/chapter title) | 20–21px, or `clamp(1.6rem, 2.6vw, 2.2rem)` for scrollytelling chapters | 620–630 | `-0.01em` to `-0.015em` | |
| Body | 15–19px | 400 | 0 | `line-height: 1.6` at the page root |
| Mono label (eyebrow/spec) | 11–12px | 400–500 | `0.06em`–`0.14em`, uppercase | Always IBM Plex Mono, always uppercase, always tracked |

Rules:

- Never use a body font for numbers that represent *data* (prices, grades,
  specs, the phone's clock) — those are always mono.
- Emphasis inside a headline is italic + pine color, same family, never a
  second typeface or a bold-weight swap.
- No serif anywhere.

## Spacing & shape

- **Radius scale:** `16px` (cards, panels), `999px` (pills — buttons, nav
  CTA, badges, stamps outline is squared instead, see below). No other
  radius values in use; don't introduce a third.
- **Border weight:** 1px hairlines everywhere (`--line`), except the "keep
  it" stamp which uses a 2px pine border to read as a rubber-stamp mark.
- **Shadow:** one shadow token, used sparingly (hero device card, mobile
  scrollytelling chapter card): `0 24px 48px -24px rgba(25, 32, 28, 0.25)`
  — soft, tinted toward ink, never pure black.
- **Section rhythm:** large sections use `110–130px` vertical padding
  desktop, collapsing to `80–96px` under `700px` width. Content max-width is
  `1080px`, centered, `24px` side padding.
- **Breakpoints in use:** `1180px`, `960px`, `820px`, `700px`. Not a strict
  design-token scale, tuned per-section — treat `960px` as the tablet cut and
  `700px` as the phone cut if extending elsewhere.

## Iconography

- **Library:** [Phosphor Icons](https://phosphoricons.com/) React package
  (`@phosphor-icons/react`) exclusively. No hand-drawn SVGs, no other icon set.
- **Weight:** `light` for standalone/decorative icons (28–40px), `bold` for
  small inline icons paired with text (14–20px), default weight for
  status-bar glyphs (wifi/battery).
- Icon color always inherits from context: `--pine` by default, flips to the
  pine-fill text color (`#f2f7f4`) on hover/active states.

## Motion

Every transition in the codebase uses the same easing curve:
**`cubic-bezier(0.22, 1, 0.36, 1)`** (a snappy ease-out). Use this curve for
any new interactive transition rather than a default `ease` or `ease-in-out`
— it's what makes hovers and reveals feel consistent across the page.

Patterns in use:

- **Scroll reveal:** elements marked `data-reveal` start at `opacity: 0`,
  `translateY(22px)` and animate in via `IntersectionObserver` (not scroll
  event listeners) once 15% visible. `0.7s`, the shared easing curve, with an
  optional stagger via a `--d` CSS variable set inline per item.
- **Hero entrance:** hero copy and the device-report "ticket" card animate in
  on page load (not scroll-triggered) with a `0.15s` stagger between them.
- **Hover fill:** cards default to neutral (`--surface` + `--line` border)
  and animate to a solid `--pine` fill + inverted text color on hover —
  background-color, border-color, and text color all transition over
  `0.35s`. Gated behind `@media (hover: hover)` so touch devices don't get a
  stuck hover state. Paired with a `translateY(-4px)` lift on `0.4s`.
- **Button press:** `:active` scales to `0.97` — a physical "push" cue on
  every primary CTA.
- **Pinned scroll story:** the four-chapter "how it works" section uses
  `position: sticky` (not scroll-jacking JS) to pin a device mockup while
  copy chapters scroll past; an `IntersectionObserver` with a
  `-45% 0px -45% 0px` root margin swaps the mockup's screen content as each
  chapter crosses the viewport center.
- **Reduced motion:** every animation is wrapped in
  `@media (prefers-reduced-motion: no-preference)` — nothing above should
  ship without a static fallback.

## Component patterns

- **Primary CTA (`.cta`):** pill button (`radius: 999px`), pine fill,
  `15px 30px` padding, trailing arrow icon that shifts right 4px on hover.
  One primary CTA per view; label is always "Try it" — reused verbatim
  everywhere rather than varying ("Get started" / "Try now" / etc).
- **Secondary CTA (`.cta-quiet`):** text link with a 2px bottom border in
  `--line` that turns pine on hover. No background, no pill shape — visually
  subordinate to the primary CTA.
- **Nav (`.nav`):** sticky top bar, `color-mix` translucent paper background
  + `backdrop-filter: blur(12px)`, 1px bottom hairline. Wordmark left, single
  CTA right, no nav links.
- **Outcome cards (`.outcome`):** neutral-by-default, pine-on-hover pattern
  described above. Five sit in a single row on desktop (icon, title, one-line
  body), collapsing to 2-col then 1-col.
- **Device report "ticket" (`.ticket`):** the signature visual — a slightly
  rotated (1.2deg) white card styled like a physical receipt/report, mono
  labels, a rubber-stamp badge (`.stamp`, rotated -6deg, 2px pine border,
  uppercase mono text) for the verdict. This pattern (ticket + stamp) is the
  most distinctive piece of the visual identity — reuse it for anything that
  presents an AI verdict or assessment result.
- **Phone mockup (`.iphone` / `.device-iphone-14-pro`):** a real iPhone 14
  Pro frame (Dynamic Island, side buttons, antenna lines) built in CSS,
  adapted from [devices.css](https://github.com/picturepan2/devices.css)
  (MIT licensed — attribution comment kept in `Landing.css`). Status bar
  content (`9:41`, wifi, battery) is authored separately at native 390px
  scale so it stays crisp when the whole frame is scaled down via
  `transform: scale()` per breakpoint. Reuse this frame for any future
  product-screenshot mockup instead of a flat rounded-rectangle screenshot.

## Sync status

| Surface | File(s) | Current state | Gap |
|---|---|---|---|
| **Landing page** (`/`) | `frontend/src/pages/Landing.tsx`, `Landing.css` | ✅ Fully on-brand — source of truth for everything above | — |
| **Root shell** | `frontend/src/index.css` | Legacy Vite template tokens remain for the landing-page root shell | Remove unused legacy tokens when the landing page CSS is next consolidated |
| **Mobile app** | `mobile/src/screens/*.tsx`, `mobile/src/components/*.tsx`, `mobile/src/theme.ts` | ✅ Synced to the light paper/ink/pine system with Bricolage Grotesque, IBM Plex Mono, Phosphor icons, outlined cards, and pill CTAs | The live camera and captured-photo viewers intentionally remain dark viewports; all interface chrome uses brand tokens |

### Mobile alignment

Mobile is already aligned with the brand. Keep the following decisions intact
when extending it:

1. **Accent:** completed. Pine `#1c5b45` is the sole mobile accent.
2. **Theme:** completed. Mobile uses the light brand theme for app surfaces.
   The live camera and full-screen captured-photo viewers are the intentional
   dark exception because the image itself is the working surface; their
   controls still use pine, paper, and branded typography.
3. **Fonts:** completed. Bricolage Grotesque and IBM Plex Mono load locally
   through `expo-font` and `@expo-google-fonts`.
4. **Shared tokens:** completed. `mobile/src/theme.ts` is the single flat
   source for mobile color, font, and radius tokens.
5. **Radius / motion:** completed. Primary actions use pill geometry and
   branded transitions use the shared ease-out curve where React Native's
   animation API applies.

Suggested starting point for `mobile/src/theme.ts`:

```ts
export const colors = {
  paper: '#ffffff',
  surface: '#ffffff',
  ink: '#191c1a',
  body: '#494f4c',
  muted: '#6a716d',
  line: '#e5e7e6',
  pine: '#1c5b45',
  ctaText: '#f2f7f4',
} as const

export const radius = {
  card: 16,
  pill: 999,
} as const
```
