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
