# Digital Contact Card (Vercel)

An animated one-page contact card. Everyone can view it. Only you (with your password) can edit it.

**Start here: [SETUP.md](SETUP.md)** for the step-by-step guide.

## Files
- `index.html` – the card and the owner editor
- `api/card.js` – loads the card (public) and saves it (password required)
- `api/upload.js` – uploads your photo (password required)

## Quick facts
- Edit link: `https://your-site.vercel.app/#edit`
- Required: a Vercel Blob store connected to the project, plus an `ADMIN_PASSWORD` environment variable.

## Project structure
```
index.html        page markup only
css/              base · hero · sections · dock · overlays · editor
js/               icons → state → photo → render → dock → editor → upload → actions → boot
api/              card.js (read/save card) · upload.js (photo upload)
```
Scripts load in the order above (see `index.html`). Corner sizes are set once in `css/base.css` (`--r-xs`, `--r-sm`, `--r-md`, `--r-lg`).


## Design editor upgrades

- Expanded palette with 13 ready-made color themes plus custom background, accent, and text colors.
- Four selectable layouts: Classic, Centered, Minimal, and Editorial.
- Additional typography choices (DM Sans, Manrope, Montserrat, Space Grotesk, Playfair Display, and Roboto Mono).
- Live preview updates while editing. Profile image sizing remains adjustable with the zoom slider, drag positioning, and touch pinch-to-zoom controls.


The default public card layout is now **Centered Profile**, so the redesigned appearance is visible immediately on first load (not only after opening the editor). Older saved cards without a layout also fall back to Centered Profile.
