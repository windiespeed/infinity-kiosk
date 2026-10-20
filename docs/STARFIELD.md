# Starfield background

The stars behind every screen come from one image, `src/assets/starfield.svg`. Don't edit that file by hand. It is made by `scripts/make-starfield.mjs`, and every setting lives in that script.

## Changing the stars

1. Open `scripts/make-starfield.mjs` and change a number from the table below.
2. Run `npm run make-stars`. It rewrites `src/assets/starfield.svg`.
3. Refresh the browser to see it. (If `npm run dev` isn't running, start it.)
4. Commit both files: the script and `starfield.svg`.

## Settings

| What it controls | Setting in the script | Now | Try |
|---|---|---|---|
| Number of stars | `COUNT` | `260` | Fewer looks calmer, more looks busier |
| Arrangement | `SEED` | `1966` | Any other number gives a new sky |
| Directions of drift | `GROUPS` | `6` | `10` for more variety |
| How far stars drift (pixels) | `dist` | `15 + rand() * 25` (15 to 40) | `30 + rand() * 50` for more movement |
| Drift speed (seconds per trip out and back) | `secs` | `40 + rand() * 50` (40 to 90) | `20 + rand() * 30` to go faster |
| How many stars twinkle | `TWINKLE_SHARE` | `0.25` (a quarter) | `0` turns twinkling off |
| How dim a twinkle gets | `opacity * 0.25` | dims to a quarter | `0.1` deeper, `0.5` subtler |
| Twinkle speed (seconds) | `2 + twinkle() * 4` | 2 to 6 | Smaller numbers are faster |

Changing the twinkle settings never moves any stars.

## How it fits together

- `src/styles/theme.css` shows the image in a `body::before` layer behind all content. The `body` block needs `isolation: isolate`, or the stars hide behind the page background.
- High-contrast mode hides the stars (`html[data-contrast="high"] body::before { display: none; }`).
- The drift and twinkle are built into the SVG, so the app's "Reduce motion" setting does not pause them. Keep the movement slow and gentle.

## Troubleshooting

- **No stars at all:** check that `isolation: isolate;` is in the `body` block of `theme.css`.
- **"at-rule or selector expected" in theme.css:** a line was pasted in the wrong place. Undo the last edit, or ask for help in the project.
- **Changes don't show up:** run `npm run make-stars` again, then hard-refresh (Ctrl+Shift+R).
