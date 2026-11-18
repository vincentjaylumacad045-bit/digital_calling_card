# Digital Contact Card (Vercel)

An animated one-page contact card. Everyone can view it. Only you (with your password) can edit it.

**Start here: [SETUP.md](SETUP.md)** for the step-by-step guide. Edit link: `https://your-site.vercel.app/#edit`

## Project structure
```
index.html   card markup + Design Studio editor
css/         base · hero · sections · layouts · dock · overlays · editor
js/          icons → state → photo → render → dock → studio → editor → upload → actions → motion → boot
api/         card.js (read/save card) · upload.js (photo upload)
```

## Design (v2)
- **Six layouts:** Studio, Cards, Editorial, Minimal, Poster, Compact. Cards saved with older layout names are mapped automatically.
- **Five photo shapes** (Full, Circle, Portrait, Square, Side) that work with every layout.
- **Motion:** one orchestrated intro (curtain, photo reveal, name rise, quick-action pop, sheet slide-up), scroll-linked header, sticky mini header, view-transition morphs when switching layout/theme. Set to Cinematic / Subtle / Off in the editor; reduced-motion is always respected.
- **Quick actions** (Call, WhatsApp, Email, Directions, Website), copy buttons on every contact row, Highlights badges.

## Design Studio (editor) features
Undo/redo (Ctrl+Z), draft recovery, visitor preview, click-any-element-to-edit, card strength checklist, visual layout picker,
section order and visibility, quick-action toggles, title placement, match colors to photo, readability checker with auto-fix,
17 themes, type pairings, quick-add social links, save status indicator, Ctrl+S.

Corner sizes are controlled by the Corner roundness slider (`--card-radius`).
