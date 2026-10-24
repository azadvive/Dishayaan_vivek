# DishaYaaN — Academia-style frontend

Content: unchanged, taken verbatim from `src/data/content.json` (all 5 languages).
Layout/UI: rebuilt in the Academia template structure (`App.js`, `App.css`, `index.js`, `components/...`).

## Deploy on Netlify
**Option A (drag & drop):** upload the *Netlify-upload* zip contents (index.html at root) at app.netlify.com/drop.
**Option B (Git / this source):** push this folder; `netlify.toml` already sets `CI=false npm run build`, publish dir `build`, and the SPA redirect.

## Run locally
npm install && npm start

## Forms
Mentor-connect, home enquiry, booking, partner enquiry and plan requests POST to Netlify Forms
(registered in public/index.html). View them in Netlify → Forms.
Community posts, AI credits and Path Finder results are stored in the visitor's browser (localStorage).

## One-click upload zip
Run `make-netlify-zip.bat` (Windows) or `./make-netlify-zip.sh` (Mac/Linux). It installs, builds and creates `netlify-upload.zip`
(index.html at the root) ready to drag onto app.netlify.com/drop. Requires Node.js 18+.
