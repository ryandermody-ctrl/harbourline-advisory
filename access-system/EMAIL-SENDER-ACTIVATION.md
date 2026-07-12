# Harbour Line participant email activation

Approved study participants should receive their access code automatically from:

`info@harbourlineadvisory.com`

The approval decision email continues to go only to:

`ryandermody@gmail.com`

## Gmail check

On the Google account that owns and deploys the Apps Script:

1. Open Gmail.
2. Go to **Settings > See all settings > Accounts and Import**.
3. Under **Send mail as**, confirm `info@harbourlineadvisory.com` is listed and verified.
4. If it is not listed, choose **Add another email address**, complete the SMTP details, and click the verification link delivered to the info mailbox.

A forwarding address alone is not sufficient. Google must authorize it as a sending address.

## Apps Script files

The Apps Script project must contain:

- `Code.gs`
- `EmailSender.gs`
- `Access.html`
- `Collaborator.html`
- `appsscript.json`

Copy each matching file from this folder into the existing Apps Script project. To edit `appsscript.json`, enable **Show appsscript.json manifest file in editor** in Project Settings.

## Authorize and test

1. Save all files.
2. Select the `testParticipantSender` function.
3. Click **Run**.
4. Approve the additional Gmail permission requested by Google.
5. Confirm the test arrives at `ryandermody@gmail.com` showing `info@harbourlineadvisory.com` as the sender.

Do not open invitations until this test succeeds.

## Deploy

1. Choose **Deploy > Manage deployments**.
2. Edit the existing web app deployment.
3. Select **New version**.
4. Deploy while preserving the existing `/exec` URL.

## Final live test

1. Submit a test access request using a different email address.
2. Confirm the control email arrives at `ryandermody@gmail.com` with only:
   - **YES — APPROVE & SEND**
   - **NO — DECLINE**
3. Click **YES — APPROVE & SEND**.
4. Confirm the participant receives the code and private access link automatically from `info@harbourlineadvisory.com`.
5. Enter the code and confirm the Typeform opens.
