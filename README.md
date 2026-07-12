# Harbour Line Advisory

Static public pages for harbourlineadvisory.com.

## Current public scope

- `index.html` — private holding page and existing-participant access
- `study/` — unlisted market-research brief; new responses are paused
- `send/` — closed holding page while the invitation system is rebuilt
- `styles.css` — public visual system
- `favicon.svg` — site icon
- `_headers` and `robots.txt` — browser and crawler controls
- `CNAME` — custom domain

## Temporary deployment exception

`access-system/` contains the staged security revision for the existing Google Apps Script deployment. It remains here only so the owner can copy the revised files into Apps Script and publish a new version.

While this exception remains:

- new study responses are paused
- the collaborator invitation tool is closed
- the source must not contain access codes, administrator tokens or participant records

After the revised deployment passes the recorded access tests, delete `access-system/` from this public repository.

## Private operational material

The public repository must not contain:

- spreadsheet contents or participant records
- administrator or deployment tokens
- plain access codes
- personal contact lists
- confidential client, employer or transaction information

Operational records, the governing documents and deployment runbook are maintained in restricted Google Drive folders.

## Privacy limitation

The pages are unlisted and instructed not to appear in search results. They are not secret: anyone who has an exact page address may open it. Access-controlled material must remain behind the separate private service.
