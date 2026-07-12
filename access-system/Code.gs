const CONFIG = Object.freeze({
  OWNER_EMAIL: 'ryandermody@gmail.com',
  OWNER_NAME: 'Ryan Dermody',
  SPREADSHEET_ID: '17V6Z9f3ha1XqrPKcjeiVYAORMe6M8x0UYR8QP0wbaT4',
  ACCESS_SHEET_NAME: 'Access Requests',
  REFERRAL_SHEET_NAME: 'Referral Tracking',
  WEBSITE_URL: 'https://harbourlineadvisory.com',
  STUDY_URL: 'https://harbourlineadvisory.com/study/',
  TYPEFORM_URL: 'https://form.typeform.com/to/FgKntOf1',
  CODE_VALID_DAYS: 7,
  MAX_USES: 3,
  REQUEST_COOLDOWN_HOURS: 12,
  ADMIN_TOKEN_HOURS: 48,
  COLLABORATOR_SESSION_SECONDS: 21600,
  FAILED_ATTEMPT_LIMIT: 5,
  FAILED_ATTEMPT_WINDOW_SECONDS: 900,
  DAILY_REQUEST_LIMIT: 100,
});

const COL = Object.freeze({
  REQUEST_ID: 1,
  REQUESTED_AT: 2,
  NAME: 3,
  ORGANISATION: 4,
  EMAIL: 5,
  STATUS: 6,
  EXPIRES: 7,
  APPROVED_AT: 8,
  USES: 9,
  LAST_USED: 10,
  DECISION_NOTE: 11,
  SOURCE: 12,
  CODE_HASH: 13,
  SALT: 14,
});

const REFCOL = Object.freeze({
  REFERRAL_ID: 1,
  CREATED_AT: 2,
  SENDER_NAME: 3,
  SENDER_EMAIL: 4,
  RECIPIENT_NAME: 5,
  RECIPIENT_EMAIL: 6,
  RECIPIENT_ORGANISATION: 7,
  LAST_CHANNEL: 8,
  SHARE_EVENTS: 9,
  LAST_SHARED_AT: 10,
  FIRST_OPENED_AT: 11,
  OPENS: 12,
  LAST_OPENED_AT: 13,
  CTA_CLICKS: 14,
  ACCESS_REQUESTED_AT: 15,
  REQUEST_ID: 16,
  REQUESTER_NAME: 17,
  REQUESTER_EMAIL: 18,
  FORM_ENTERED_AT: 19,
  STATUS: 20,
  RECIPIENT_MISMATCH: 21,
});

function setup() {
  getAccessSheet_();
  getReferralSheet_();
  ensureCollaboratorPasscode_();
  return 'Harbour Line access and referral system is ready. A collaborator passcode has been emailed if one did not already exist.';
}

function resetCollaboratorPasscode() {
  const raw = generateCollaboratorPasscode_();
  PropertiesService.getScriptProperties().setProperty('COLLABORATOR_PASSCODE_HASH', sha256_(raw));
  sendCollaboratorPasscode_(raw, true);
  return 'A new collaborator passcode has been emailed to ' + CONFIG.OWNER_EMAIL + '.';
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = clean_(params.action, 30).toLowerCase();
  const page = clean_(params.page, 30).toLowerCase();

  if (['approve', 'approve-send', 'reject'].includes(action)) {
    return handleAdminDecision_(params);
  }

  if (['track-open', 'track-click'].includes(action)) {
    return trackPublicReferralEvent_(action, params);
  }

  if (page === 'collaborator') {
    return HtmlService.createTemplateFromFile('Collaborator').evaluate()
      .setTitle('Collaborator invitations | Harbour Line Advisory')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  const referralId = clean_(params.r, 80);
  const referral = referralId ? getReferralContext_(referralId) : null;
  const template = HtmlService.createTemplateFromFile('Access');
  template.websiteUrl = CONFIG.WEBSITE_URL;
  template.initialTab = clean_(params.tab, 20).toLowerCase();
  template.referralId = referralId;
  template.invitedBy = referral && referral.senderName ? referral.senderName : '';

  return template.evaluate()
    .setTitle('Private access | Harbour Line Advisory')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function collaboratorLogin(passcode) {
  const supplied = clean_(passcode, 120);
  const expectedHash = PropertiesService.getScriptProperties().getProperty('COLLABORATOR_PASSCODE_HASH');

  if (!supplied || !expectedHash || sha256_(supplied) !== expectedHash) {
    Utilities.sleep(450);
    return { ok: false, message: 'The collaborator passcode was not recognised.' };
  }

  const token = secureToken_();
  CacheService.getScriptCache().put('COLLAB_' + sha256_(token), '1', CONFIG.COLLABORATOR_SESSION_SECONDS);
  return { ok: true, token, expiresHours: Math.floor(CONFIG.COLLABORATOR_SESSION_SECONDS / 3600) };
}

function createReferral(sessionToken, payload) {
  requireCollaboratorSession_(sessionToken);

  const senderName = clean_(payload && payload.senderName, 120);
  const senderEmail = normalizeEmail_(payload && payload.senderEmail);
  const recipientName = clean_(payload && payload.recipientName, 120);
  const recipientEmail = normalizeEmail_(payload && payload.recipientEmail);
  const recipientOrganisation = clean_(payload && payload.recipientOrganisation, 160);

  if (!senderName) throw new Error('Enter your name.');
  if (!isValidEmail_(senderEmail)) throw new Error('Enter a valid sender email.');
  if (!recipientName) throw new Error('Enter the intended recipient’s name.');
  if (recipientEmail && !isValidEmail_(recipientEmail)) throw new Error('Enter a valid recipient email or leave it blank.');

  const id = Utilities.getUuid();
  const now = new Date();
  const sheet = getReferralSheet_();

  sheet.appendRow([
    id,
    now,
    senderName,
    senderEmail,
    recipientName,
    recipientEmail,
    recipientOrganisation,
    'Created',
    0,
    '',
    '',
    0,
    '',
    0,
    '',
    '',
    '',
    '',
    '',
    'CREATED',
    '',
  ]);

  return { ok: true, id, link: CONFIG.STUDY_URL + '?r=' + encodeURIComponent(id) };
}

function recordReferralShare(sessionToken, referralId, channel) {
  requireCollaboratorSession_(sessionToken);
  const id = clean_(referralId, 80);
  const safeChannel = clean_(channel, 50) || 'Shared';
  const record = getReferralRow_(id);
  if (!record) throw new Error('The referral could not be found.');

  const now = new Date();
  const sheet = getReferralSheet_();
  const count = Number(record.row[REFCOL.SHARE_EVENTS - 1] || 0) + 1;
  sheet.getRange(record.rowNumber, REFCOL.LAST_CHANNEL).setValue(safeChannel);
  sheet.getRange(record.rowNumber, REFCOL.SHARE_EVENTS).setValue(count);
  sheet.getRange(record.rowNumber, REFCOL.LAST_SHARED_AT).setValue(now);
  sheet.getRange(record.rowNumber, REFCOL.STATUS).setValue('SHARED');
  return { ok: true };
}

function requestAccess(payload) {
  const name = clean_(payload && payload.name, 120);
  const organisation = clean_(payload && payload.organisation, 160);
  const email = normalizeEmail_(payload && payload.email);
  const honeypot = clean_(payload && payload.website, 200);
  const referralId = clean_(payload && payload.referralId, 80);

  if (honeypot) return genericRequestResponse_();
  if (!name) throw new Error('Please enter your name.');
  if (!isValidEmail_(email)) throw new Error('Please enter a valid email address.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    enforceDailyRequestLimit_();
    const sheet = getAccessSheet_();
    const rows = sheet.getDataRange().getValues();
    const now = new Date();
    const cooldownMs = CONFIG.REQUEST_COOLDOWN_HOURS * 60 * 60 * 1000;

    for (let i = rows.length - 1; i >= 1; i -= 1) {
      const rowEmail = normalizeEmail_(rows[i][COL.EMAIL - 1]);
      const requestedAt = new Date(rows[i][COL.REQUESTED_AT - 1]);
      const status = String(rows[i][COL.STATUS - 1] || '').toUpperCase();
      if (rowEmail === email && ['PENDING', 'APPROVED'].includes(status) && now - requestedAt < cooldownMs) {
        if (referralId) updateReferralAccess_(referralId, String(rows[i][COL.REQUEST_ID - 1] || ''), name, email);
        return genericRequestResponse_();
      }
    }

    const requestId = Utilities.getUuid();
    const code = generateCode_();
    const salt = Utilities.getUuid();
    const codeHash = sha256_(salt + ':' + code);
    const expires = new Date(now.getTime() + CONFIG.CODE_VALID_DAYS * 24 * 60 * 60 * 1000);
    const source = referralId ? 'Referral:' + referralId : 'Website';

    sheet.appendRow([
      requestId,
      now,
      name,
      organisation,
      email,
      'PENDING',
      expires,
      '',
      0,
      '',
      '',
      source,
      codeHash,
      salt,
    ]);

    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('CODE_' + requestId, code);
    if (referralId) updateReferralAccess_(referralId, requestId, name, email);

    const approval = createApprovalTokens_(requestId);
    const referral = referralId ? getReferralContext_(referralId) : null;
    sendOwnerNotification_({ requestId, name, organisation, email, code, expires, approval, referralId, referral });
    return genericRequestResponse_();
  } finally {
    lock.releaseLock();
  }
}

function verifyAccess(payload) {
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

      const hidden = [];
      if (requestId) hidden.push('request_id=' + encodeURIComponent(requestId));
      if (referralId) hidden.push('referral_id=' + encodeURIComponent(referralId));
      const url = hidden.length ? CONFIG.TYPEFORM_URL + '#' + hidden.join('&') : CONFIG.TYPEFORM_URL;
      return { ok: true, url };
    }

    recordFailedAttempt_(email);
    return { ok: false, message: 'That email and access code combination is not recognised.' };
  } finally {
    lock.releaseLock();
  }
}

function handleAdminDecision_(params) {
  const requestId = clean_(params && params.id, 80);
  const action = clean_(params && params.action, 30).toLowerCase();
  const token = clean_(params && params.token, 240);

  if (!requestId || !['approve', 'approve-send', 'reject'].includes(action) || !validateApprovalToken_(requestId, action, token)) {
    return adminPage_('Access denied', 'This approval link is invalid, expired or has already been used.', false);
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
      sheet.getRange(rowNumber, COL.DECISION_NOTE).setValue('Rejected by Ryan');
      PropertiesService.getScriptProperties().deleteProperty('CODE_' + requestId);
      consumeApprovalTokens_(requestId);
      if (referralId) setReferralStatus_(referralId, 'REJECTED');
      return adminPage_('Request rejected', email + ' will not be able to use the generated code.', true);
    }

    sheet.getRange(rowNumber, COL.STATUS).setValue('APPROVED');
    sheet.getRange(rowNumber, COL.APPROVED_AT).setValue(new Date());
    sheet.getRange(rowNumber, COL.DECISION_NOTE).setValue(action === 'approve-send' ? 'Approved; code emailed automatically' : 'Approved; Ryan to send code');
    consumeApprovalTokens_(requestId);
    if (referralId) setReferralStatus_(referralId, 'APPROVED');

    if (action === 'approve-send') {
      if (!code) return adminPage_('Approved', 'The request was approved, but the code could not be recovered. Ask the visitor to request access again.', false);
      sendVisitorCode_(email, name, code, referralId);
      return adminPage_('Approved and sent', 'The access code has been emailed to ' + email + '.', true);
    }

    return adminPage_('Request approved', 'The code is active. Send it only to ' + email + '.', true, code || '[code unavailable; request again]');
  } finally {
    lock.releaseLock();
  }
}

function trackPublicReferralEvent_(action, params) {
  const id = clean_(params && (params.id || params.r), 80);
  const record = getReferralRow_(id);
  if (!record) return pixelResponse_();

  const now = new Date();
  const sheet = getReferralSheet_();

  if (action === 'track-open') {
    const opens = Number(record.row[REFCOL.OPENS - 1] || 0) + 1;
    if (!record.row[REFCOL.FIRST_OPENED_AT - 1]) sheet.getRange(record.rowNumber, REFCOL.FIRST_OPENED_AT).setValue(now);
    sheet.getRange(record.rowNumber, REFCOL.OPENS).setValue(opens);
    sheet.getRange(record.rowNumber, REFCOL.LAST_OPENED_AT).setValue(now);
    sheet.getRange(record.rowNumber, REFCOL.STATUS).setValue('OPENED');
  }

  if (action === 'track-click') {
    const clicks = Number(record.row[REFCOL.CTA_CLICKS - 1] || 0) + 1;
    sheet.getRange(record.rowNumber, REFCOL.CTA_CLICKS).setValue(clicks);
    sheet.getRange(record.rowNumber, REFCOL.STATUS).setValue('CLICKED');
  }

  return pixelResponse_();
}

function updateReferralAccess_(referralId, requestId, requesterName, requesterEmail) {
  const record = getReferralRow_(referralId);
  if (!record) return;

  const intendedEmail = normalizeEmail_(record.row[REFCOL.RECIPIENT_EMAIL - 1]);
  const mismatch = intendedEmail && requesterEmail && intendedEmail !== normalizeEmail_(requesterEmail) ? 'YES' : '';
  const sheet = getReferralSheet_();
  sheet.getRange(record.rowNumber, REFCOL.ACCESS_REQUESTED_AT).setValue(new Date());
  sheet.getRange(record.rowNumber, REFCOL.REQUEST_ID).setValue(requestId);
  sheet.getRange(record.rowNumber, REFCOL.REQUESTER_NAME).setValue(requesterName);
  sheet.getRange(record.rowNumber, REFCOL.REQUESTER_EMAIL).setValue(requesterEmail);
  sheet.getRange(record.rowNumber, REFCOL.STATUS).setValue('ACCESS_REQUESTED');
  sheet.getRange(record.rowNumber, REFCOL.RECIPIENT_MISMATCH).setValue(mismatch);
}

function markReferralFormEntered_(referralId, requestId, requesterEmail) {
  const record = getReferralRow_(referralId);
  if (!record) return;
  const sheet = getReferralSheet_();
  sheet.getRange(record.rowNumber, REFCOL.FORM_ENTERED_AT).setValue(new Date());
  if (requestId) sheet.getRange(record.rowNumber, REFCOL.REQUEST_ID).setValue(requestId);
  if (requesterEmail) sheet.getRange(record.rowNumber, REFCOL.REQUESTER_EMAIL).setValue(requesterEmail);
  sheet.getRange(record.rowNumber, REFCOL.STATUS).setValue('FORM_ENTERED');
}

function setReferralStatus_(referralId, status) {
  const record = getReferralRow_(referralId);
  if (record) getReferralSheet_().getRange(record.rowNumber, REFCOL.STATUS).setValue(status);
}

function getReferralContext_(referralId) {
  const record = getReferralRow_(referralId);
  if (!record) return null;
  return {
    id: referralId,
    senderName: clean_(record.row[REFCOL.SENDER_NAME - 1], 120),
    senderEmail: normalizeEmail_(record.row[REFCOL.SENDER_EMAIL - 1]),
    recipientName: clean_(record.row[REFCOL.RECIPIENT_NAME - 1], 120),
    recipientEmail: normalizeEmail_(record.row[REFCOL.RECIPIENT_EMAIL - 1]),
    organisation: clean_(record.row[REFCOL.RECIPIENT_ORGANISATION - 1], 160),
  };
}

function getReferralRow_(referralId) {
  if (!referralId) return null;
  const sheet = getReferralSheet_();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i += 1) {
    if (String(rows[i][REFCOL.REFERRAL_ID - 1]) === referralId) return { rowNumber: i + 1, row: rows[i] };
  }
  return null;
}

function requireCollaboratorSession_(token) {
  const cleanToken = clean_(token, 160);
  const valid = cleanToken && CacheService.getScriptCache().get('COLLAB_' + sha256_(cleanToken)) === '1';
  if (!valid) throw new Error('Your collaborator session has expired. Sign in again.');
}

function ensureCollaboratorPasscode_() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('COLLABORATOR_PASSCODE_HASH')) return;
  const raw = generateCollaboratorPasscode_();
  properties.setProperty('COLLABORATOR_PASSCODE_HASH', sha256_(raw));
  sendCollaboratorPasscode_(raw, false);
}

function generateCollaboratorPasscode_() {
  return 'HLA-' + String(Math.floor(100000 + Math.random() * 900000)) + '-' + secureToken_().slice(0, 6).toUpperCase();
}

function sendCollaboratorPasscode_(passcode, reset) {
  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL,
    subject: reset ? 'New Harbour Line collaborator passcode' : 'Harbour Line collaborator passcode',
    body: [
      'Your private collaborator console is ready.',
      '',
      'Console: ' + ScriptApp.getService().getUrl() + '?page=collaborator',
      'Passcode: ' + passcode,
      '',
      'Share the passcode only with trusted collaborators. You can reset it by running resetCollaboratorPasscode in Apps Script.',
    ].join('\n'),
    name: 'Harbour Line Advisory',
  });
}

function createApprovalTokens_(requestId) {
  const expiresAt = Date.now() + CONFIG.ADMIN_TOKEN_HOURS * 60 * 60 * 1000;
  const raw = { approve: secureToken_(), 'approve-send': secureToken_(), reject: secureToken_() };
  PropertiesService.getScriptProperties().setProperty('ADMIN_' + requestId, JSON.stringify({
    expiresAt,
    hashes: {
      approve: sha256_(raw.approve),
      'approve-send': sha256_(raw['approve-send']),
      reject: sha256_(raw.reject),
    },
  }));
  return raw;
}

function validateApprovalToken_(requestId, action, token) {
  const value = PropertiesService.getScriptProperties().getProperty('ADMIN_' + requestId);
  if (!value || !token) return false;
  try {
    const record = JSON.parse(value);
    if (!record.expiresAt || Date.now() > Number(record.expiresAt)) {
      consumeApprovalTokens_(requestId);
      return false;
    }
    return record.hashes && record.hashes[action] === sha256_(token);
  } catch (error) {
    consumeApprovalTokens_(requestId);
    return false;
  }
}

function consumeApprovalTokens_(requestId) {
  PropertiesService.getScriptProperties().deleteProperty('ADMIN_' + requestId);
}

function sendOwnerNotification_(request) {
  const serviceUrl = ScriptApp.getService().getUrl();
  const approve = adminUrl_(serviceUrl, 'approve', request.requestId, request.approval.approve);
  const approveSend = adminUrl_(serviceUrl, 'approve-send', request.requestId, request.approval['approve-send']);
  const reject = adminUrl_(serviceUrl, 'reject', request.requestId, request.approval.reject);
  const displayName = request.name || 'Name not supplied';
  const organisation = request.organisation || 'Organisation not supplied';
  const introducer = request.referral && request.referral.senderName ? request.referral.senderName : 'Direct website request';
  const intendedRecipient = request.referral && request.referral.recipientName ? request.referral.recipientName : '';

  const body = [
    'A visitor has requested access to Harbour Line.',
    '',
    'Name: ' + displayName,
    'Organisation: ' + organisation,
    'Email: ' + request.email,
    'Introduced by: ' + introducer,
    intendedRecipient ? 'Intended recipient: ' + intendedRecipient : '',
    'Generated code: ' + request.code,
    'Code expires: ' + request.expires,
    '',
    'Approve only: ' + approve,
    'Approve and email the code: ' + approveSend,
    'Reject: ' + reject,
  ].filter(Boolean).join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;color:#1b2733;line-height:1.5;max-width:620px">
      <h2 style="font-family:Georgia,serif;margin-bottom:8px">Harbour Line access request</h2>
      <p style="color:#52616f">A visitor has requested private study access.</p>
      <table style="border-collapse:collapse;width:100%;margin:22px 0">
        <tr><td style="padding:7px 0;color:#52616f">Name</td><td style="padding:7px 0"><strong>${escapeHtml_(displayName)}</strong></td></tr>
        <tr><td style="padding:7px 0;color:#52616f">Organisation</td><td style="padding:7px 0"><strong>${escapeHtml_(organisation)}</strong></td></tr>
        <tr><td style="padding:7px 0;color:#52616f">Email</td><td style="padding:7px 0"><strong>${escapeHtml_(request.email)}</strong></td></tr>
        <tr><td style="padding:7px 0;color:#52616f">Introduced by</td><td style="padding:7px 0"><strong>${escapeHtml_(introducer)}</strong></td></tr>
        <tr><td style="padding:7px 0;color:#52616f">Generated code</td><td style="padding:7px 0;font-family:monospace;font-size:16px"><strong>${escapeHtml_(request.code)}</strong></td></tr>
      </table>
      <p>
        <a href="${approveSend}" style="display:inline-block;background:#0e6a6a;color:#fff;text-decoration:none;padding:12px 16px;margin:0 8px 8px 0">Approve and send</a>
        <a href="${approve}" style="display:inline-block;background:#1b2733;color:#fff;text-decoration:none;padding:12px 16px;margin:0 8px 8px 0">Approve only</a>
        <a href="${reject}" style="display:inline-block;border:1px solid #9b2c2c;color:#9b2c2c;text-decoration:none;padding:11px 16px;margin-bottom:8px">Reject</a>
      </p>
      <p style="font-size:12px;color:#52616f">These links expire in ${CONFIG.ADMIN_TOKEN_HOURS} hours and stop working after one decision. Do not forward this email.</p>
    </div>`;

  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL,
    subject: 'Harbour Line access request: ' + request.email,
    body,
    htmlBody,
    name: 'Harbour Line Advisory',
    replyTo: request.email,
  });
}

function sendVisitorCode_(email, name, code, referralId) {
  const greeting = name ? 'Hello ' + name + ',' : 'Hello,';
  let portalUrl = ScriptApp.getService().getUrl() + '?tab=code';
  if (referralId) portalUrl += '&r=' + encodeURIComponent(referralId);
  const body = [
    greeting,
    '',
    'Your Harbour Line study access request has been approved.',
    '',
    'Use the same email address and this code:',
    code,
    '',
    'Private access page: ' + portalUrl,
    '',
    'The code expires after seven days and allows up to three successful entries.',
    '',
    'Ryan Dermody',
    'Harbour Line Advisory',
  ].join('\n');

  MailApp.sendEmail({
    to: email,
    subject: 'Your Harbour Line access code',
    body,
    name: 'Harbour Line Advisory',
    replyTo: CONFIG.OWNER_EMAIL,
  });
}

function adminUrl_(serviceUrl, action, requestId, token) {
  return serviceUrl + '?action=' + encodeURIComponent(action) + '&id=' + encodeURIComponent(requestId) + '&token=' + encodeURIComponent(token);
}

function enforceDailyRequestLimit_() {
  const properties = PropertiesService.getScriptProperties();
  const day = Utilities.formatDate(new Date(), CONFIG_TIMEZONE_(), 'yyyyMMdd');
  const key = 'REQUEST_COUNT_' + day;
  const count = Number(properties.getProperty(key) || 0);
  if (count >= CONFIG.DAILY_REQUEST_LIMIT) throw new Error('The request service is temporarily unavailable. Please try again later.');
  properties.setProperty(key, String(count + 1));
}

function isTemporarilyLocked_(email) {
  return Number(CacheService.getScriptCache().get(failureKey_(email)) || 0) >= CONFIG.FAILED_ATTEMPT_LIMIT;
}

function recordFailedAttempt_(email) {
  const cache = CacheService.getScriptCache();
  const key = failureKey_(email);
  cache.put(key, String(Number(cache.get(key) || 0) + 1), CONFIG.FAILED_ATTEMPT_WINDOW_SECONDS);
}

function clearFailedAttempts_(email) {
  CacheService.getScriptCache().remove(failureKey_(email));
}

function failureKey_(email) {
  return 'FAIL_' + sha256_(email).slice(0, 32);
}

function getAccessSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.ACCESS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.ACCESS_SHEET_NAME);
    sheet.appendRow(['Request ID','Requested at','Name','Organisation','Email','Status','Expires','Approved at','Uses','Last used','Decision note','Source','Code hash','Salt']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getReferralSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.REFERRAL_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.REFERRAL_SHEET_NAME);
    sheet.appendRow(['Referral ID','Created at','Sender name','Sender email','Intended recipient','Intended recipient email','Recipient organisation','Last channel','Share events','Last shared at','First opened at','Opens','Last opened at','CTA clicks','Access requested at','Request ID','Requester name','Requester email','Form entered at','Status','Recipient mismatch']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateCode_() {
  const words = ['ANCHOR','BEACON','CHANNEL','HARBOUR','NORTH','QUAY','SOUNDER','TIDE'];
  const first = words[Math.floor(Math.random() * words.length)];
  let second = words[Math.floor(Math.random() * words.length)];
  if (second === first) second = 'LINE';
  return first + '-' + String(Math.floor(1000 + Math.random() * 9000)) + '-' + second;
}

function secureToken_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function sha256_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8);
  return digest.map((byte) => ((byte + 256) % 256).toString(16).padStart(2, '0')).join('');
}

function normalizeEmail_(value) {
  return clean_(value, 254).toLowerCase();
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function clean_(value, maxLength) {
  return String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
}

function escapeHtml_(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function genericRequestResponse_() {
  return { ok: true, message: 'Your request has been recorded. Approved participants receive a private code by email.' };
}

function pixelResponse_() {
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}

function adminPage_(title, message, success, code) {
  const codeBlock = code ? `<div style="font-family:monospace;font-size:20px;letter-spacing:.04em;background:#f2f5f7;padding:14px;margin-top:20px">${escapeHtml_(code)}</div>` : '';
  return HtmlService.createHtmlOutput(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${escapeHtml_(title)}</title></head><body style="margin:0;background:#fbfcfc;color:#1b2733;font-family:Arial,sans-serif"><main style="max-width:680px;margin:8vh auto;padding:32px"><div style="border-top:4px solid ${success ? '#0e6a6a' : '#9b2c2c'};background:white;padding:34px;box-shadow:0 12px 40px rgba(27,39,51,.08)"><p style="color:#0e6a6a;text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:bold">Harbour Line Advisory</p><h1 style="font-family:Georgia,serif;font-weight:400">${escapeHtml_(title)}</h1><p style="color:#52616f;line-height:1.6">${escapeHtml_(message)}</p>${codeBlock}</div></main></body></html>`);
}

function CONFIG_TIMEZONE_() {
  return Session.getScriptTimeZone() || 'America/Vancouver';
}
