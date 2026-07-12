# Controlled access

## Purpose

The public site remains deliberately sparse. Visitors may request private access, and only approved email/code combinations can continue.

## Visitor flow

1. A visitor selects **Continue**.
2. The private access page asks for name, organisation and email.
3. A unique code is generated in a pending state.
4. The request is recorded in a private administrator-controlled register.
5. The administrator may approve, approve and send, or reject the request.
6. The visitor enters the approved email and code.
7. Valid access opens the private destination.

Codes expire after seven days and permit no more than three successful entries unless the administrator changes those settings.

## Why the backend is separate

GitHub Pages is static hosting. Password generation, email delivery, approval status and verification require a private server-side service. The supplied Google Apps Script files provide that service through an administrator-controlled Google account and spreadsheet.

## Deployment

1. Open the private tracking spreadsheet.
2. Choose **Extensions → Apps Script**.
3. Replace the default code with `access-system/Code.gs`.
4. Add an HTML file named `Access` and paste in `access-system/Access.html`.
5. Enable the manifest file and replace it with `access-system/appsscript.json`.
6. Run `setup()` once and approve the requested permissions.
7. Choose **Deploy → New deployment → Web app**.
8. Set **Execute as:** Me.
9. Set **Who has access:** Anyone.
10. Deploy and copy the `/exec` URL.
11. Replace the temporary public access gate with that deployed URL after testing.

## Data retained

The private register stores request details, status, expiry, approval timestamps, successful-entry counts, notes, and salted code hashes. Plain access codes are not stored in the spreadsheet.

## Operating rules

- Use one-to-one invitations.
- Do not publish the private destination.
- Do not use visible distribution lists.
- Approve only identifiable or expected visitors.
- Keep administrator tokens, plain codes and deployment secrets out of GitHub.
- Store sensitive material separately using restricted permissions.

## Limitation

An approved visitor may still copy a destination URL after access is granted. This system controls normal entry and creates an audit trail; it is not digital-rights management.