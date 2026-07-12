# Harbour Line Advisory

Minimal landing page for [harbourlineadvisory.com](https://harbourlineadvisory.com), with a private Typeform operating brief.

## Structure

- `index.html` — accessible landing-page markup
- `styles.css` — core Harbour Line visual system
- `access.css` — current access-dialog styles
- `script.js` — current Typeform routing and temporary client-side access gate
- `favicon.svg` — site icon
- `CNAME` — GitHub Pages custom domain
- `access-system/` — Google Apps Script approval backend and branded access portal
- `docs/ACCESS-CONTROL.md` — deployment, security and operating instructions

## Current live flow

The **Start the operating brief** button currently opens a lightweight access-code dialog and routes an approved visitor to Typeform. This temporary check is client-side and is only intended to discourage casual access.

## Controlled access flow

The prepared Google Apps Script service replaces the shared password with individual approval:

1. Visitor enters name, organisation and work email.
2. A unique inactive code is generated.
3. Ryan receives the request with approve, approve-and-send, and reject controls.
4. The request is recorded in **HLA Demand Tracker (LIVE) → Access Requests**.
5. Only an approved email/code combination opens the Typeform.

The access backend must be deployed and authorized by Ryan from the existing Google Sheet. Deployment instructions are in `docs/ACCESS-CONTROL.md`. The live landing-page button should not be switched until the deployed `/exec` URL has been tested.

## Deployment

GitHub Pages deploys from the root of the `main` branch. Changes committed to `main` are published automatically.

## Data

Typeform retains completed diagnostic submissions. Access requests, approvals and usage are retained in the private Harbour Line Google Sheet. No administrator token or plain per-user access code belongs in the public repository.
