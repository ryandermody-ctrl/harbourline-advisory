# Harbour Line Advisory

Static public pages for harbourlineadvisory.com.

## Hosting and deployment

GitHub is the source repository. Cloudflare is the public deployment and domain layer. Changes committed to `main` are detected by Cloudflare and published to the live site.

## Current release state

Study intake is paused while single-use permission control is implemented and tested.

The required participant path is:

1. `harbourlineadvisory.com/study/`
2. individually issued permission and passcode
3. backend claim that atomically binds the permission to one assessment session
4. Harbour Line Model Coherence Study in Typeform (`Jh4G63Se`) with a non-sensitive `permission_id` URL parameter
5. Typeform's native Google Sheets integration
6. raw response tab in `HLA Demand Tracker (LIVE)`
7. validation against the Permission Control register
8. formula-mapped `V3 Analysis`, accepting only the first valid completion for each permission

The same incomplete session may be resumed. A completed or already claimed permission must not create another assessment session or accepted response. A repeat assessment requires a newly issued permission.

The direct Typeform URL must not be distributed while this control remains on release hold.

## Current public scope

- `index.html` — Harbour Line landing page
- `study/` — Model Coherence Study explanation; direct intake paused
- `send/` — retirement notice for the former collaborator console
- `styles.css` — public visual system
- `favicon.svg` — site icon
- `_headers` and `robots.txt` — browser and crawler controls
- `CNAME` — custom-domain record retained for compatibility

## Access-control implementation boundary

The public repository contains no passcodes, participant records, spreadsheet data, administrator tokens or backend deployment credentials.

The restricted implementation and audit records belong in the controlled Google Drive environment and the bound Apps Script project. The backend must enforce atomic claim, session binding, completion state, reuse denial, rate limiting and audit logging. Browser-only enforcement is not sufficient.

## Private operational material

The public repository must not contain:

- spreadsheet contents or participant records
- administrator or deployment tokens
- plain access codes
- personal contact lists
- confidential client, employer or transaction information

Operational records, research standards and release notes are maintained in restricted Google Drive files.

## Privacy limitation

The public pages are instructed not to appear in search results, but anyone with an exact address may open them. Permission identifiers passed to Typeform must be non-sensitive internal identifiers, not names, email addresses, passwords or authentication secrets. Invitation records remain separate from response analysis.
