# Auralis brand assets

Authoritative SVG marks for Auralis Finance. All files are hand-authored, resolution-independent, and reference the same geometry.

## Files

| File | Use |
|---|---|
| `auralis-mark.svg` | Square mark only. Inherits text color for the "A" via `currentColor`; arcs are fixed teal and the apex dot is fixed brass. |
| `auralis-logo.svg` | Horizontal lockup (mark + "AURALIS" wordmark + tagline). |
| `../../app/icon.svg` | Next.js 15 app icon — mark on a dark ink chip for browser tab favicon. |
| `../../app/apple-icon.svg` | Next.js 15 Apple touch icon — same chip variant, used for iOS home-screen. |

## Geometry

- **Three teal aura arcs** crown the mark — a visual reference to the "aural / aurora" root and to the layered authority of a rating agency.
- **Geometric A monogram** below the arcs — the diagonals stop short of meeting.
- **Brass rating seal** fills the apex gap. The brass dot is the only place where the brass accent appears, matching the design system rule "brass on rating seal only".

## Color tokens

| Role | Light theme | Dark theme |
|---|---|---|
| Aura (teal) | `#0E9E8C` | `#14B8A3` |
| Aura highlight (gradient stop) | `#14B8A3` | `#2DD4B5` |
| Monogram (`currentColor`) | `#0B1220` ink | `#E8ECF2` paper |
| Rating seal (brass) | `#B08442` | `#D4A35A` |

The `.svg` files in this directory use the light-theme palette by default. When embedded in an HTML page they pick up the surrounding `color` for the monogram, so the same file looks correct on dark surfaces.

## Clearspace

Reserve clearspace equal to the height of the brass apex dot (~5% of mark height) on every side of the mark or lockup. Do not place the mark on a busy photographic background without a solid surface beneath it.

## Don't

- Don't recolor the brass dot — it is the rating-seal accent, not a neutral.
- Don't outline the arcs in a contrasting color.
- Don't stretch the lockup non-uniformly.
- Don't introduce a second accent color alongside teal and brass.
