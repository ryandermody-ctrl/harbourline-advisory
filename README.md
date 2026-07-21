# Harbour Line Advisory

Static public pages for harbourlineadvisory.com.

## Hosting and deployment

GitHub is the source repository. Cloudflare is the public deployment and domain layer. The public website remains the recruitment and study-information surface; the permission-gated V4 application and assessment run on separately controlled Cloudflare beta resources.

## Current release state

**Permission-gated V4 live beta is open.**

The previous Typeform and Apps Script transaction path remains retired legacy evidence. Do not distribute a direct Typeform URL, issue Typeform assessment permissions or restore the archived Apps Script web app.

The public participant path is:

1. `harbourlineadvisory.com/study/`
2. `harbourlineadvisory.com/apply/` for the secure direct-submit qualification application
3. Harbour Line review and selection
4. an individually issued V4 permission ID and passcode
5. the permission-gated V4 assessment at `hla-v4-beta-pages.pages.dev/assessment/`

The public `/apply/` route redirects to the V4 application page on the controlled beta Pages origin. The form submits directly to the V4 Worker through the Pages proxy, uses server-validated Turnstile and stores the application in D1. Application identity remains separate from research responses. Applying does not create an assessment response or grant study access.

## V4 beta boundary

The permission-gated beta uses:

- Cloudflare Pages for the application and questionnaire UI
- a Cloudflare Worker for public API requests, hidden behind the Pages proxy
- Durable Objects for serialized single-use permission, session and abuse state
- D1 for canonical applications, permissions, sessions and responses
- server-validated Turnstile for application, claim and completion
- dedicated `hla-v4-beta-*` resources separate from development and the public website

Google integration is deferred during the live beta. D1 is the canonical response store. The legacy Typeform raw tab remains immutable historical data.

The beta passed automated source, security, deployment-boundary and hosted Chromium, Firefox and WebKit layout checks. Manual screen-reader listening and native 200% browser zoom are deferred and must not be described as passed.

## Current public scope

- `index.html` — Harbour Line landing page
- `study/` — Model Coherence Study explanation and application entry point
- `apply/` — stable public route to the V4 direct-submit participant application
- `send/` — retirement notice for the former collaborator console
- `styles.css` — public visual system
- `favicon.svg` — site icon
- `_headers`, `_redirects` and `robots.txt` — browser, routing and crawler controls
- `CNAME` — custom-domain record retained for compatibility

## Public repository boundary

This repository must contain no passcodes, participant records, spreadsheet data, administrator tokens, backend credentials, personal contact lists or confidential client, employer or transaction information.

The governing systems architecture, schemas, audit records, permission issuance and deployment controls are maintained in the private `harbourline-automation-private` repository and restricted Google records.

## Rollback

Remove the assessment link from `study/index.html`, remove the `/apply` redirect and disable the `hla-v4-beta-api` Worker. The public informational pages remain available.

## Release rule

A material change to authentication, data, questionnaire semantics, routing, integrations, security headers or deployment requires documented testing, rollback and explicit owner approval before expansion beyond the permission-gated beta.
