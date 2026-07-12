# Harbour Line Advisory

Static public pages for harbourlineadvisory.com.

## Hosting and deployment

GitHub is the source repository. Cloudflare is the public deployment and domain layer. Changes committed to `main` are detected by Cloudflare and published to the live site.

## Current platform architecture

The active research path is deliberately simple:

1. `harbourlineadvisory.com/study/`
2. Harbour Line Model Coherence Study in Typeform
3. Typeform's native Google Sheets integration
4. `HLA Demand Tracker (LIVE)` for analysis and outreach records

Live Typeform:

`https://form.typeform.com/to/Jh4G63Se`

The participant path does not use an access code, Apps Script approval, a collaborator console or a custom response relay.

## Current public scope

- `index.html` — Harbour Line landing page
- `study/` — Model Coherence Study explanation and direct Typeform link
- `send/` — retirement notice for the former collaborator console
- `styles.css` — public visual system
- `favicon.svg` — site icon
- `_headers` and `robots.txt` — browser and crawler controls
- `CNAME` — custom-domain record retained for compatibility

## Retired access system

`access-system/` is retained only as a historical technical record. It is not part of the active participant journey and should not be deployed as the current Harbour Line study architecture.

The files may contain superseded process language and old form references. The governing source for the live study is the current Typeform URL above and the current documents in Google Drive.

## Private operational material

The public repository must not contain:

- spreadsheet contents or participant records
- administrator or deployment tokens
- plain access codes
- personal contact lists
- confidential client, employer or transaction information

Operational records, research standards and release notes are maintained in restricted Google Drive files.

## Privacy limitation

The public pages are instructed not to appear in search results, but anyone with an exact address may open them. The Typeform does not ask for names, organisations or confidential transaction information. Invitation records held separately may still identify who received a link, so the pilot is confidential rather than guaranteed anonymous.
