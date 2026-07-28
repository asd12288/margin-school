# Margin School brand assets

The approved logo combines a compact indigo/violet margin mark with the
`Margin School` wordmark. Keep the mark's proportions and colors unchanged.

## Primary logos

| File | Use |
| --- | --- |
| `margin-school-logo.png` | Full logo on light backgrounds |
| `margin-school-logo-dark.png` | Full logo on dark backgrounds |
| `margin-school-mark.png` | Transparent standalone mark, 1024 × 1024 |
| `margin-school-mark-tight.png` | The same mark cropped to its alpha bounds, 769 × 482 — use this one in layout |

`margin-school-mark-tight.png` is generated from `margin-school-mark.png`, not
drawn separately: the 1024² version letterboxes the glyph into the middle
75% × 47% of its canvas, so rendering it inline at a header's height paints
about half as much logo as the box suggests. Cropping empty pixels changes no
proportion and no colour. Regenerate it if the source mark changes.

## Browser and application icons

| File | Use |
| --- | --- |
| `favicon-16.png` | Small browser UI |
| `favicon-32.png` | Standard browser favicon |
| `favicon-48.png` | High-density browser favicon |
| `favicon-64.png` | Large browser/bookmark favicon |
| `app-icon-192.png` | Web app icon |
| `app-icon-512.png` | Large web app icon |

Next.js metadata assets are also installed at `app/favicon.ico`, `app/icon.png`,
and `app/apple-icon.png`.

## Sharing cards

| File | Use |
| --- | --- |
| `brand-card-light.png` | 1200 × 630 social/share card on white |
| `brand-card-dark.png` | 1200 × 630 social/share card on deep cool neutral |

Use the full logo whenever horizontal space permits. Use the standalone mark
for square surfaces, favicons, and compact controls. Do not stretch, recolor,
rotate, outline, or add effects to either asset.
