# Harbour Line Advisory

Static public pages for harbourlineadvisory.com.

## Hosting and deployment

GitHub is the source repository. Cloudflare is the public deployment and domain layer. The live site must remain informational while the V4 participant and assessment platform is built and tested separately.

## Current release state

**Assessment release is paused.**

The previous Typeform and Apps Script transaction path has failed systems-architecture review and is now legacy evidence only. Do not distribute a direct Typeform URL, issue new assessment permissions or restore the archived Apps Script web app.

The public participant path currently stops at:

1. `harbourlineadvisory.com/study/`
2. `harbourlineadvisory.com/apply/` for a short qualification application
3. Harbour Line review and selection

The present application page prepares an email in the applicant's own email client. It is a temporary recruitment route, not the V4 system of record. Applying does not create an assessment record or grant study access.

## Approved V4 boundary

The replacement platform will use:

- Cloudflare Pages for public content and questionnaire UI
- a Cloudflare Worker for public API requests
- a Durable Object for serialized single-use permission and session state
- D1 for canonical applications, sessions, responses and audit events
- server-validated Turnstile on public submissions
- an idempotent queue-backed mirror into controlled Google Sheets
- private Apps Script utilities only; no anonymous Google-owner authentication web app

Google Sheets remains the controlled analysis and reporting surface. It is not the V4 transaction authority. The legacy Typeform raw tab remains immutable historical data.

## Current public scope

- `index.html` — Harbour Line landing page
- `study/` — Model Coherence Study explanation and application entry point
- `apply/` — temporary participant qualification application; prepares an email and does not grant assessment access
- `send/` — retirement notice for the former collaborator console
- `styles.css` — public visual system
- `favicon.svg` — site icon
- `_headers` and `robots.txt` — browser and crawler controls
- `CNAME` — custom-domain record retained for compatibility

## Public repository boundary

This repository must contain no passcodes, participant records, spreadsheet data, administrator tokens, backend credentials, personal contact lists or confidential client, employer or transaction information.

The governing systems architecture, schemas, audit records and deployment controls are maintained in the private `harbourline-automation-private` repository and restricted Google records.

## Release rule

A material change to authentication, data, questionnaire semantics, routing, integrations, security headers or deployment must pass a systems-architecture review, staging tests, documented rollback and explicit owner approval before production publication.
