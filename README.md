# Harbour Line Advisory

Minimal static landing page for [harbourlineadvisory.com](https://harbourlineadvisory.com).

## Structure

- `index.html` — accessible landing-page markup
- `styles.css` — core Harbour Line visual system
- `access.css` — access-dialog styles
- `script.js` — Typeform routing and access-code check
- `favicon.svg` — site icon
- `CNAME` — GitHub Pages custom domain

## Intake flow

The **Start the operating brief** button opens a lightweight access-code dialog and then routes an approved visitor to the Harbour Line Typeform.

The access check is client-side and is intended to discourage casual access. It is not server-side authentication and must not be used to protect confidential data.

## Deployment

GitHub Pages deploys from the root of the `main` branch. Changes committed to `main` are published automatically.

## Data

Raw diagnostic submissions are retained by Typeform. Operating records and qualified-lead tracking are maintained separately in the private Harbour Line Google Drive workspace.
