# Harbour Line Advisory: controlled access

## Purpose

The public site stays deliberately sparse. The operating brief is not openly distributed. Visitors request access, Ryan reviews each request, and only approved email/code combinations can open the Typeform.

## Visitor flow

1. Visitor clicks **Start the operating brief** on harbourlineadvisory.com.
2. The private access portal asks for name, organisation and work email.
3. A unique code is generated but remains inactive.
4. The request is written to **HLA Demand Tracker (LIVE) → Access Requests**.
5. Ryan receives an email containing the visitor details, generated code and three controls:
   - **Approve and send code**
   - **Approve only**
   - **Reject**
6. The visitor enters the approved email and code.
7. A valid code opens the Typeform. Codes expire after seven days and allow no more than three successful entries.

## Why the backend is separate

GitHub Pages is static hosting. Password generation, email delivery, approval status and code verification must run in a private server-side service. The supplied Google Apps Script web app performs those functions using Ryan's Google account, Gmail and the existing Harbour Line tracker.

## Deployment

1. Open **HLA Demand Tracker (LIVE)** in Google Sheets.
2. Choose **Extensions → Apps Script**.
3. Replace the default code with `access-system/Code.gs`.
4. Add an HTML file named `Access` and paste in `access-system/Access.html`.
5. Open **Project Settings**, enable the manifest file, and replace it with `access-system/appsscript.json`.
6. Run `setup()` once and approve the requested Google permissions.
7. Choose **Deploy → New deployment → Web app**.
8. Set **Execute as:** Me.
9. Set **Who has access:** Anyone.
10. Deploy and copy the `/exec` web app URL.
11. Put that URL into the landing-page button in place of the current client-side password gate.

Google must ask Ryan to authorize the script because it writes to the tracker and sends Gmail notifications. That authorization cannot safely be completed by a third party.

## Data retained

The Access Requests sheet stores:

- request ID
- request timestamp
- name and organisation
- email
- status
- expiry and approval timestamps
- number of successful entries
- decision note
- hashed access code and salt

The plain code is not stored in the spreadsheet. It is held in private Script Properties and sent to Ryan in the approval email.

## Operating rules

- Use one-to-one invitations only.
- Do not publish the diagnostic link on LinkedIn or a public newsletter.
- Do not use CC, BCC or a visible distribution list.
- Approve only people Ryan can identify or whose organisation and reason for access are credible.
- Prefer **Approve only** where Ryan wants to add a personal note before sending the code.
- Use **Approve and send code** for known contacts where immediate access is appropriate.
- Reject unknown personal addresses, disposable addresses or requests without a credible organisation.
- Never place an administrator token, plain access code or Apps Script deployment secret in GitHub.

## Residual limitation

Once an approved visitor reaches the Typeform, they can potentially copy its direct URL. The gate controls normal entry and creates an audit trail; it is not digital-rights management. Highly sensitive documents should be shared separately through restricted Drive permissions or a dedicated client portal.
