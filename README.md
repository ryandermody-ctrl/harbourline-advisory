# Harbour Line Advisory

Static public pages for harbourlineadvisory.com.

## Hosting and deployment

GitHub is the source repository. Cloudflare is the public deployment and domain layer. Changes committed to `main` are detected by Cloudflare and published to the live site.

## Current release state

Public participant applications are open. The research assessment itself remains paused while single-use permission control is implemented and tested.

The participant path is:

1. `harbourlineadvisory.com/study/`
2. `harbourlineadvisory.com/apply/` for a short qualification application
3. application delivered to `info@harbourlineadvisory.com` and recorded separately in the controlled Participant Applications register
4. Harbour Line review and selection
5. individually issued permission and passcode
6. backend claim that atomically binds the permission to one assessment session
7. Harbour Line Model Coherence Study in Typeform (`Jh4G63Se`) with a non-sensitive `permission_id` URL parameter
8. Typeform's native Google Sheets integration
9. raw response tab in `HLA Demand Tracker (LIVE)`
10. validation against the Permission Control register
11. formula-mapped `V3 Analysis`, accepting only the first valid completion for each permission

Application information is recruitment and communication data. It is not research evidence and must remain separate from assessment responses.

The same incomplete assessment session may be resumed. A completed or already claimed permission must not create another assessment session or accepted response. A repeat assessment requires a newly issued permission.

The direct Typeform URL must not be distributed while this control remains on release hold.

## Current public scope

- `index.html` — Harbour Line landing page
- `study/` — Model Coherence Study explanation and application entry point
- `apply/` — participant qualification application; prepares a structured email to Harbour Line and does not grant assessment access
- `send/` — retirement notice for the former collaborator console
- `styles.css` — public visual system
- `favicon.svg` — site icon
- `_headers` and `robots.txt` — browser and crawler controls
- `CNAME` — custom-domain record retained for compatibility

## Access-control implementation boundary

The public repository contains no passcodes, participant records, spreadsheet data, administrator tokens or backend deployment credentials.

The restricted implementation and audit records belong in the controlled Google Drive environment and the bound Apps Script project. The backend must enforce atomic claim, session binding, completion state, reuse denial, rate limiting and audit logging. Browser-only enforcement is not sufficient.

The public application page does not write applicant details into GitHub or the research-response store. It prepares an email in the applicant's own email client. Applicant records are reviewed and logged separately.

## Private operational material

The public repository must not contain:

- spreadsheet contents or participant records
- administrator or deployment tokens
- plain access codes
- personal contact lists
- confidential client, employer or transaction information

Operational records, research standards and release notes are maintained in restricted Google Drive files.

## Privacy limitation

The public pages are instructed not to appear in search results, but anyone with an exact address may open them. Permission identifiers passed to Typeform must be non-sensitive internal identifiers, not names, email addresses, passwords or authentication secrets. Application and invitation records remain separate from response analysis.
