# Airbnb UI Kit (Design Reference)

MoMo Insights uses the **Airbnb design system** as its visual foundation — adapted for a financial analysis dashboard while keeping the light/dark toggle.

Source spec: [shadcn.io/design/airbnb](https://www.shadcn.io/design/airbnb)

## Key tokens in use

| Token | Value | Usage |
|-------|-------|--------|
| Rausch (primary) | `#ff385c` | CTAs, accents, heatmap |
| Primary active | `#e00b41` | Button press state |
| Canvas | `#ffffff` | Page background (light) |
| Ink | `#222222` | Headlines, primary text |
| Body | `#3f3f3f` | Secondary copy |
| Muted | `#6a6a6a` | Captions, labels |
| Hairline | `#dddddd` | Borders, dividers |
| Surface soft | `#f7f7f7` | Muted backgrounds |
| Card radius | `14px` | Cards, panels |
| Button radius | `8px` | Primary/secondary buttons |
| Typography | Inter | Cereal VF substitute |

## Implementation files

- `src/app/globals.css` — CSS variables mapped to shadcn tokens
- `src/lib/design/airbnb.ts` — exported constants
- `src/components/ui/*` — shadcn primitives styled for Airbnb

## Design principles applied

1. **Single accent** — Rausch used sparingly for CTAs and key moments
2. **Modest typography** — display headlines at 22–28px, weight 500–700
3. **Soft radii** — 14px cards, 8px buttons, pill badges
4. **One shadow tier** — Airbnb card elevation on cards and pills
5. **White canvas** — generous whitespace, clean layout
