# Digital Contact Card (Vercel)

An animated one-page contact card. Everyone can view it. Only you (with your password) can edit it.

**Start here: [SETUP.md](SETUP.md)** for the step-by-step guide. Edit link: `https://your-site.vercel.app/#edit`

## Project structure
```
index.html   card markup + Design Studio editor
css/         base · hero · sections · layouts · dock · overlays · editor · textfx · focus
js/          icons → state → photo → render → qr → dock → studio → editor → upload → focus → actions → motion → boot
api/         card.js (read/save card) · upload.js (photo upload)
```

## Design (v2)
- **Eighteen layouts** (v4 adds Portfolio, Aurora, Brutalist, Spotlight, Terminal) plus Studio, Cards, Editorial, Minimal, Poster, Compact, Glass, Duo, Story, Bento, Timeline, Badge, Neon. Original list: Studio, Cards, Editorial, Minimal, Poster, Compact, Glass, Duo, Story, Bento, Timeline, Badge, Neon.
- **16 one-tap templates** (layout + photo shape + colors + fonts) in the Templates tab. Cards saved with older layout names are mapped automatically.
- **Ten photo shapes** (Full, Circle, Portrait, Square, Side, Arch, Hexagon, Organic, Polaroid, Wide) that work with every layout.
- **Motion:** one orchestrated intro (curtain, photo reveal, name rise, quick-action pop, sheet slide-up), scroll-linked header, sticky mini header, view-transition morphs when switching layout/theme. Set to Cinematic / Subtle / Off in the editor; reduced-motion is always respected.
- **Quick actions** (Call, WhatsApp, Email, Directions, Website), copy buttons on every contact row, Highlights badges.

## Design Studio (editor) features
Undo/redo (Ctrl+Z), draft recovery, visitor preview, click-any-element-to-edit, card strength checklist, visual layout picker,
section order and visibility, quick-action toggles, title placement, match colors to photo, readability checker with auto-fix,
17 themes, type pairings, quick-add social links, save status indicator, Ctrl+S.

Corner sizes are controlled by the Corner roundness slider (`--card-radius`).

## Added in v3
- Mobile editor no longer zooms or scrolls the card: the panel overlays the bottom, can be dragged between three heights (tap the handle), and keyboard/focus scroll jumps are blocked.
- Drag-and-drop: reorder sections, quick actions, links and services by their grip; drop a photo onto the photo area or the card to upload.
- Visitor features: main call-to-action button, Services list with prices, Testimonial, contact file now includes your photo.
- Responsive checked at 320, 390, 768 and 1280 px across every layout and photo shape.


## Added in v4
- **Portfolio layout** (matches the reference design): sticky top bar with a "Let's Talk" button, dotted circle photo with color blobs, social icon row, and a "Hey there, It's Name." headline. Edit the greeting, the word before your name and the button label in **More → Greeting & top bar**.
- **Top bar** can be switched On/Off/Auto for any layout (Layout tab).
- **New sections:** Numbers (count-up) and Skills (animated bars), editable in the More tab.
- **8 new one-tap templates**, 3 new themes (Sunrise, Matrix, Cream), Inter and JetBrains Mono type pairings.
- Reading-progress bar, back-to-top button, staggered item reveals, pointer parallax on desktop.
- Responsive: card widens to 520/600/640px on tablets and desktops, small-phone and landscape tuning.
- Files: `css/layouts2.css`, `css/responsive.css`; `api/card.js` allows the new layouts.

## v4.2
- Contrast guard: text, icons, buttons and accent-colored labels are automatically kept readable for every theme and layout (fixes invisible text/icons on Paper, Midnight and the light themes).
- Professional layouts: **Counsel** (attorneys, advisors), **Clinic** (doctors, dentists, therapists), **Agent** (realtors, sales), with matching Legal and Medical themes and 6 templates.
- Fixed: tapping anything in the editor panel (fonts, colors) scrolled it back to the top.

## Added in v4.3
- Fixed the name animation: the black block over the first letter (a text-gradient clip in the Aurora layout) is gone, the letter-flip is now a simple rise, and the intro lasts long enough for long names with typewriter/wave.
- 3 new layouts: **Swiss** (numbered editorial), **Luxe** (black & gold arch portrait), **Soft** (gentle raised surfaces).
- 9 new color themes: Sand, Aqua, Grape, Bubblegum, Graphite, Emerald, Ruby, Denim, Noir.
- New features (More tab): announcement banner (with optional link), map of your Location, verified tick next to the name. The Map is also a reorderable section.
- Replace the whole folder, including `api/card.js` (it lists the allowed layouts).

## v5
- **Removed** the "Send a message" form. Old saved cards that still list it load normally; the section is simply ignored.
- **New QR sheet** (`js/qr.js`, `js/dock.js`, `css/overlays.css`): the code is now made on the visitor's device (no `api.qrserver.com`), so it works offline and never sends your link to a third party.
  A "pass" in your card colors with your photo in the middle, three code styles (soft, dots, classic), three colors, and two modes:
  **Open card** (your link) and **Save contact** (a small contact file, so the phone offers "Add contact" right away).
  **Save image** makes a branded 1080×1350 picture (photo, name, code) for printing or sharing; **Share** sends that picture on phones that support it.
  Eye corners are only slightly rounded on purpose, so every scanner finds them.
- **Fixes**
  - The card no longer stays blank when the browser blocks storage (some in-app browsers and private modes).
  - A slow or stuck server no longer leaves visitors on the loading screen (falls back after 8 seconds).
  - The link used for sharing and the QR code drops a trailing `index.html`.
  - Contact file: long lines are folded as the vCard format requires, a name is always present, and the file is sent as UTF-8.
  - Wrong-password attempts on `/api/card` and `/api/upload` are slowed down; uploads accept only JPG, PNG and WebP and reject oversized photos with a clear message.
- Replace the whole folder, including `api/card.js` and `api/upload.js`, then redeploy.
