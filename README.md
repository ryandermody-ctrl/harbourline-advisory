# Harbour Line Advisory

Static public pages for harbourlineadvisory.com.

## Hosting and deployment

GitHub is the source repository. Cloudflare is the public deployment and domain layer. Changes committed to `main` are detected by Cloudflare and published to the live site.

## Current platform architecture

The active research path is deliberately simple:

1. `harbourlineadvisory.com/study/`
2. Harbour Line Model Coherence Study in Typeform
3. Typeform's native Google Sheets integration
4. Raw response tab in `HLA Demand Tracker (LIVE)`
5. Formula-mapped `V3 Analysis` for coding and interpretation

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

## Retired system cleanup

The superseded `access-system/` source and access-control documentation have been removed from the active repository tree. Git history and the archived Google Drive runbook preserve the historical technical record.

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
