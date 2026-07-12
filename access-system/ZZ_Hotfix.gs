const HLA_HOTFIX = Object.freeze({
  VERSION: '2026-07-12-2',
  FROM_EMAIL: 'info@harbourlineadvisory.com',
  BRAND_NAME: 'Harbour Line Advisory',
  FORM_VERSION: 'HLA-MKT-2026-07-V3',
});

function participantSenderOptions_() {
  const desired = normalizeEmail_(HLA_HOTFIX.FROM_EMAIL);
  const effectiveUser = normalizeEmail_(Session.getEffectiveUser().getEmail());
  const aliases = GmailApp.getAliases().map((address) => normalizeEmail_(address));
  const options = {
    name: HLA_HOTFIX.BRAND_NAME,
    replyTo: desired,
  };

  if (aliases.includes(desired)) {
    options.from = desired;
    return options;
  }

  if (effectiveUser === desired) return options;

  throw new Error(
    'Google has not authorized ' + desired +
    ' as a sending address for this Apps Script account. Add it in Gmail under Settings > Accounts and Import > Send mail as, then run testParticipantSender.'
  );
}

function hotfixStatus() {
  const options = participantSenderOptions_();
  return JSON.stringify({
    version: HLA_HOTFIX.VERSION,
    sender: options.from || HLA_HOTFIX.FROM_EMAIL,
    formVersion: HLA_HOTFIX.FORM_VERSION,
    status: 'READY',
  });
}

function testParticipantSender() {
  const options = participantSenderOptions_();
  const body = [
    'Harbour Line sender test successful.',
    '',
    'Participant approval emails are configured to send from ' +
      HLA_HOTFIX.FROM_EMAIL + '.',
    'Hotfix version: ' + HLA_HOTFIX.VERSION,
  ].join('\n');

  GmailApp.sendEmail(
    CONFIG.OWNER_EMAIL,
    'Harbour Line sender test',
    body,
    options
  );

  return (
    'Test email sent to ' + CONFIG.OWNER_EMAIL +
    ' from ' + HLA_HOTFIX.FROM_EMAIL + '.'
  );
}

var sendVisitorCode_ = function(email, name, code, referralId) {
  const greeting = name ? 'Hello ' + name + ',' : 'Hello,';
  let portalUrl = ScriptApp.getService().getUrl() + '?tab=code';
  if (referralId) portalUrl += '&r=' + encodeURIComponent(referralId);

  const body = [
    greeting,
    '',
    'Your request to take part in the Harbour Line Operating Reality Study has been approved.',
    '',
    'Use the same email address you submitted and this private access code:',
    code,
    '',
    'Open the private access page:',
    portalUrl,
    '',
    'The code expires after seven days and allows up to three successful entries.',
    '',
    HLA_HOTFIX.BRAND_NAME,
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;color:#1b2733;line-height:1.6;max-width:620px">
      <p style="color:#0e6a6a;text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:bold">Harbour Line Advisory</p>
      <h2 style="font-family:Georgia,serif;font-weight:400">Your private access has been approved</h2>
      <p>${escapeHtml_(greeting)}</p>
      <p>Your request to take part in the Harbour Line Operating Reality Study has been approved.</p>
      <p>Use the same email address you submitted and this private access code:</p>
      <div style="font-family:monospace;font-size:20px;letter-spacing:.04em;background:#f2f5f7;padding:16px;margin:20px 0"><strong>${escapeHtml_(code)}</strong></div>
      <p><a href="${portalUrl}" style="display:inline-block;background:#0e6a6a;color:#fff;text-decoration:none;padding:13px 18px;font-weight:bold">Open private access</a></p>
      <p style="font-size:12px;color:#52616f">The code expires after seven days and allows up to three successful entries.</p>
    </div>`;

  const options = participantSenderOptions_();
  options.htmlBody = htmlBody;

  GmailApp.sendEmail(
    email,
    'Your Harbour Line private access code',
    body,
    options
  );
};

var handleAdminDecision_ = function(params) {
  const requestId = clean_(params && params.id, 80);
  const action = clean_(params && params.action, 30).toLowerCase();
  const token = clean_(params && params.token, 240);

  if (
    !requestId ||
    !['approve', 'reject'].includes(action) ||
    !validateApprovalToken_(requestId, action, token)
  ) {
    return adminPage_(
      'Access denied',
      'This decision link is invalid, expired or has already been used.',
      false
    );
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getAccessSheet_();
    const rows = sheet.getDataRange().getValues();
    let rowNumber = -1;
    let row = null;

    for (let i = 1; i < rows.length; i += 1) {
      if (String(rows[i][COL.REQUEST_ID - 1]) === requestId) {
        rowNumber = i + 1;
        row = rows[i];
        break;
      }
    }

    if (!row) {
      consumeApprovalTokens_(requestId);
      return adminPage_('Request not found', 'No matching access request was found.', false);
    }

    const currentStatus = String(row[COL.STATUS - 1] || '').toUpperCase();
    if (currentStatus !== 'PENDING') {
      consumeApprovalTokens_(requestId);
      return adminPage_('Already decided', 'This request has already been processed.', false);
    }

    const email = normalizeEmail_(row[COL.EMAIL - 1]);
    const name = clean_(row[COL.NAME - 1], 120);
    const source = String(row[COL.SOURCE - 1] || '');
    const referralId = source.indexOf('Referral:') === 0 ? source.slice(9) : '';
    const code = PropertiesService.getScriptProperties().getProperty('CODE_' + requestId);

    if (action === 'reject') {
      sheet.getRange(rowNumber, COL.STATUS).setValue('REJECTED');
      sheet.getRange(rowNumber, COL.DECISION_NOTE).setValue('Declined by Ryan');
      PropertiesService.getScriptProperties().deleteProperty('CODE_' + requestId);
      consumeApprovalTokens_(requestId);
      if (referralId) setReferralStatus_(referralId, 'REJECTED');

      return adminPage_(
        'Request declined',
        'No access code was sent to ' + email + '.',
        true
      );
    }

    if (!code) {
      return adminPage_(
        'Code unavailable',
        'The request remains pending because its code could not be recovered. Ask the participant to request access again.',
        false
      );
    }

    sendVisitorCode_(email, name, code, referralId);

    sheet.getRange(rowNumber, COL.STATUS).setValue('APPROVED');
    sheet.getRange(rowNumber, COL.APPROVED_AT).setValue(new Date());
    sheet
      .getRange(rowNumber, COL.DECISION_NOTE)
      .setValue('Approved; code emailed automatically from ' + HLA_HOTFIX.FROM_EMAIL);
    consumeApprovalTokens_(requestId);
    if (referralId) setReferralStatus_(referralId, 'APPROVED');

    return adminPage_(
      'Approved and sent',
      'Harbour Line automatically emailed the access code to ' + email + '.',
      true
    );
  } finally {
    lock.releaseLock();
  }
};

var verifyAccess = function(payload) {
  const email = normalizeEmail_(payload && payload.email);
  const code = clean_(payload && payload.code, 80).toUpperCase();
  const suppliedReferralId = clean_(payload && payload.referralId, 80);

  if (!isValidEmail_(email) || !code) {
    return { ok: false, message: 'That email and access code combination is not recognised.' };
  }

  if (isTemporarilyLocked_(email)) {
    return { ok: false, message: 'Too many unsuccessful attempts. Please try again in 15 minutes.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getAccessSheet_();
    const rows = sheet.getDataRange().getValues();
    const now = new Date();

    for (let i = rows.length - 1; i >= 1; i -= 1) {
      const row = rows[i];
      if (normalizeEmail_(row[COL.EMAIL - 1]) !== email) continue;

      const status = String(row[COL.STATUS - 1] || '').toUpperCase();
      const expires = new Date(row[COL.EXPIRES - 1]);
      const uses = Number(row[COL.USES - 1] || 0);
      const salt = String(row[COL.SALT - 1] || '');
      const storedHash = String(row[COL.CODE_HASH - 1] || '');

      if (status !== 'APPROVED' || expires < now || uses >= CONFIG.MAX_USES) continue;
      if (sha256_(salt + ':' + code) !== storedHash) continue;

      const newUses = uses + 1;
      sheet.getRange(i + 1, COL.USES).setValue(newUses);
      sheet.getRange(i + 1, COL.LAST_USED).setValue(now);

      const requestId = String(row[COL.REQUEST_ID - 1] || '');
      const source = String(row[COL.SOURCE - 1] || '');
      const sourceReferralId = source.indexOf('Referral:') === 0 ? source.slice(9) : '';
      const referralId = suppliedReferralId || sourceReferralId;

      if (newUses >= CONFIG.MAX_USES) {
        sheet.getRange(i + 1, COL.STATUS).setValue('USED');
        PropertiesService.getScriptProperties().deleteProperty('CODE_' + requestId);
      }

      if (referralId) markReferralFormEntered_(referralId, requestId, email);
      clearFailedAttempts_(email);

      const url = CONFIG.TYPEFORM_URL
        + '#request_id=' + encodeURIComponent(requestId)
        + '&form_version=' + encodeURIComponent(HLA_HOTFIX.FORM_VERSION);

      return { ok: true, url };
    }

    recordFailedAttempt_(email);
    return { ok: false, message: 'That email and access code combination is not recognised.' };
  } finally {
    lock.releaseLock();
  }
};

var genericRequestResponse_ = function() {
  return {
    ok: true,
    message:
      'Your request has been recorded. If approved, Harbour Line will email your private access code and link automatically.',
  };
};
