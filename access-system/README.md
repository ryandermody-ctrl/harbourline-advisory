# Harbour Line access and referral system

## Files to copy into Google Apps Script

1. Replace `Code.gs` with the repository version.
2. Replace `Access.html` with the repository version.
3. Add a new HTML file named `Collaborator` and copy `Collaborator.html` into it.
4. Confirm `appsscript.json` matches the repository version.

## Activate

1. Save all files.
2. Select `setup` and click **Run**.
3. Approve permissions if requested.
4. `setup` creates or checks the two tracker sheets and emails Ryan the collaborator passcode if one does not already exist.
5. Open **Deploy → Manage deployments**.
6. Edit the existing web app deployment.
7. Select **New version** and click **Deploy**.
8. Keep the existing `/exec` URL.

## Approval flow

1. A participant submits their name, organisation and email.
2. Ryan receives an `ACTION REQUIRED` control email at `ryandermody@gmail.com`.
3. The email contains only two decisions:
   - **YES — APPROVE & SEND**
   - **NO — DECLINE**
4. Choosing YES immediately emails the participant a private access code and access link from the automated Harbour Line system.
5. Ryan does not need to copy, forward or send the code manually.
6. Choosing NO closes the request without sending a code.
7. Decision links expire after 48 hours and stop working after one use.

## Typeform hidden fields

Add these hidden fields to the Typeform before testing:

- `request_id`
- `referral_id`

The approved access link passes both values into Typeform.

## Test sequence

1. Open `https://harbourlineadvisory.com/send/`.
2. Open the Google-hosted collaborator console.
3. Sign in with the passcode emailed by `setup`.
4. Create one invitation addressed to Ryan.
5. Send or copy the unique link.
6. Open the study page and request access using a second email address you can check.
7. Open the control email delivered to `ryandermody@gmail.com`.
8. Click **YES — APPROVE & SEND**.
9. Confirm the participant inbox receives the Harbour Line code automatically.
10. Enter the code and open the diagnostic.
11. Confirm the `Referral Tracking` row records: created, shared, opened, clicked, access requested, approved and form entered.
12. Confirm the Typeform response contains `request_id` and `referral_id`.
13. Repeat once with **NO — DECLINE** and confirm no code is sent.

## Email identity

The email is automated and uses the display name `Harbour Line Advisory`. Google still sends it through the account that owns the Apps Script. To show a dedicated address such as `access@harbourlineadvisory.com`, configure that address as a verified Gmail send-as alias and update the script after the alias is active.

## Privacy model

- The website pages are noindexed and unlisted.
- The collaborator console is served by Google Apps Script and requires a server-validated passcode.
- Sender and recipient details are written directly to Ryan's private Google Sheet.
- Shared links contain only a random referral ID.
- The system flags a mismatch when the intended recipient email is supplied and a different email requests access.
- Attribution cannot continue if someone deliberately removes the unique link or replaces it with the generic website address.

## Resetting collaborator access

Run `resetCollaboratorPasscode` in Apps Script. A new passcode will be emailed to Ryan and the previous passcode will stop working.
