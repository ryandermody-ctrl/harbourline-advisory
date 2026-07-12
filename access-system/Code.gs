const CONFIG = Object.freeze({
  OWNER_EMAIL: 'ryandermody@gmail.com',
  OWNER_NAME: 'Ryan Dermody',
  SPREADSHEET_ID: '17V6Z9f3ha1XqrPKcjeiVYAORMe6M8x0UYR8QP0wbaT4',
  SHEET_NAME: 'Access Requests',
  TYPEFORM_URL: 'https://form.typeform.com/to/FgKntOf1',
  CODE_VALID_DAYS: 7,
  MAX_USES: 3,
  REQUEST_COOLDOWN_HOURS: 12,
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

function setup() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('ADMIN_SECRET')) {
    properties.setProperty('ADMIN_SECRET', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  }
  getAccessSheet_();
  return 'Harbour Line access system is ready.';
}

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();
  if (['approve', 'approve-send', 'reject'].includes(action)) {
    return handleAdminDecision_(e.parameter);
  }

  const template = HtmlService.createTemplateFromFile('Access');
  template.websiteUrl = 'https://harbourlineadvisory.com';
  return template.evaluate()
    .setTitle('Private access | Harbour Line Advisory')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function requestAccess(payload) {
  const name = clean_(payload && payload.name, 120);
  const organisation = clean_(payload && payload.organisation, 160);
  const email = normalizeEmail_(payload && payload.email);
  const honeypot = clean_(payload && payload.website, 200);

  if (honeypot) return genericRequestResponse_();
  if (!isValidEmail_(email)) throw new Error('Please enter a valid email address.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getAccessSheet_();
    const rows = sheet.getDataRange().getValues();
    const now = new Date();
    const cooldownMs = CONFIG.REQUEST_COOLDOWN_HOURS * 60 * 60 * 1000;

    for (let i = rows.length - 1; i >= 1; i -= 1) {
      const rowEmail = normalizeEmail_(rows[i][COL.EMAIL - 1]);
      const requestedAt = new Date(rows[i][COL.REQUESTED_AT - 1]);
      const status = String(rows[i][COL.STATUS - 1] || '').toUpperCase();
      if (rowEmail === email && ['PENDING', 'APPROVED'].includes(status) && now - requestedAt < cooldownMs) {
        return genericRequestResponse_();
      }
    }

    const requestId = Utilities.getUuid();
    const code = generateCode_();
    const salt = Utilities.getUuid();
    const codeHash = sha256_(salt + ':' + code);
    const expires = new Date(now.getTime() + CONFIG.CODE_VALID_DAYS * 24 * 60 * 60 * 1000);

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
      'Website',
      codeHash,
      salt,
    ]);

    PropertiesService.getScriptProperties().setProperty('CODE_' + requestId, code);
    sendOwnerNotification_({ requestId, name, organisation, email, code, expires });
    return genericRequestResponse_();
  } finally {
    lock.releaseLock();
  }
}

function verifyAccess(payload) {
  const email = normalizeEmail_(payload && payload.email);
  const code = clean_(payload && payload.code, 80).toUpperCase();

  if (!isValidEmail_(email) || !code) {
    return { ok: false, message: 'That email and access code combination is not recognised.' };
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
      if (newUses >= CONFIG.MAX_USES) sheet.getRange(i + 1, COL.STATUS).setValue('USED');

      return { ok: true, url: CONFIG.TYPEFORM_URL };
    }

    return { ok: false, message: 'That email and access code combination is not recognised.' };
  } finally {
    lock.releaseLock();
  }
}

function handleAdminDecision_(params) {
  const requestId = clean_(params && params.id, 80);
  const action = clean_(params && params.action, 30).toLowerCase();
  const token = clean_(params && params.token, 200);
  const expectedToken = PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET');

  if (!requestId || !expectedToken || token !== expectedToken) {
    return adminPage_('Access denied', 'This approval link is invalid or has expired.', false);
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

    if (!row) return adminPage_('Request not found', 'No matching access request was found.', false);

    const email = normalizeEmail_(row[COL.EMAIL - 1]);
    const name = clean_(row[COL.NAME - 1], 120);
    const code = PropertiesService.getScriptProperties().getProperty('CODE_' + requestId);

    if (action === 'reject') {
      sheet.getRange(rowNumber, COL.STATUS).setValue('REJECTED');
      sheet.getRange(rowNumber, COL.DECISION_NOTE).setValue('Rejected by Ryan');
      return adminPage_('Request rejected', email + ' will not be able to use the generated code.', true);
    }

    sheet.getRange(rowNumber, COL.STATUS).setValue('APPROVED');
    sheet.getRange(rowNumber, COL.APPROVED_AT).setValue(new Date());
    sheet.getRange(rowNumber, COL.DECISION_NOTE).setValue(action === 'approve-send' ? 'Approved; code emailed automatically' : 'Approved; Ryan to send code');

    if (action === 'approve-send') {
      if (!code) return adminPage_('Approved', 'The request was approved, but the original code could not be recovered. Ask the visitor to request access again.', false);
      sendVisitorCode_(email, name, code);
      return adminPage_('Approved and sent', 'The access code has been emailed to ' + email + '.', true);
    }

    return adminPage_('Request approved', 'The code is now active. Send this code to ' + email + ': ' + (code || '[code unavailable; request again]'), true, code);
  } finally {
    lock.releaseLock();
  }
}

function sendOwnerNotification_(request) {
  const serviceUrl = ScriptApp.getService().getUrl();
  const secret = PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET');
  const approve = serviceUrl + '?action=approve&id=' + encodeURIComponent(request.requestId) + '&token=' + encodeURIComponent(secret);
  const approveSend = serviceUrl + '?action=approve-send&id=' + encodeURIComponent(request.requestId) + '&token=' + encodeURIComponent(secret);
  const reject = serviceUrl + '?action=reject&id=' + encodeURIComponent(request.requestId) + '&token=' + encodeURIComponent(secret);
  const displayName = request.name || 'Name not supplied';
  const organisation = request.organisation || 'Organisation not supplied';

  const body = [
    'A visitor has requested access to the Harbour Line operating brief.',
    '',
    'Name: ' + displayName,
    'Organisation: ' + organisation,
    'Email: ' + request.email,
    'Generated code: ' + request.code,
    'Expires: ' + request.expires,
    '',
    'Approve only: ' + approve,
    'Approve and email the code: ' + approveSend,
    'Reject: ' + reject,
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;color:#1b2733;line-height:1.5;max-width:620px">
      <h2 style="font-family:Georgia,serif;margin-bottom:8px">Harbour Line access request</h2>
      <p style="color:#52616f">A visitor has requested access to the operating brief.</p>
      <table style="border-collapse:collapse;width:100%;margin:22px 0">
        <tr><td style="padding:7px 0;color:#52616f">Name</td><td style="padding:7px 0"><strong>${escapeHtml_(displayName)}</strong></td></tr>
        <tr><td style="padding:7px 0;color:#52616f">Organisation</td><td style="padding:7px 0"><strong>${escapeHtml_(organisation)}</strong></td></tr>
        <tr><td style="padding:7px 0;color:#52616f">Email</td><td style="padding:7px 0"><strong>${escapeHtml_(request.email)}</strong></td></tr>
        <tr><td style="padding:7px 0;color:#52616f">Generated code</td><td style="padding:7px 0;font-family:monospace;font-size:16px"><strong>${escapeHtml_(request.code)}</strong></td></tr>
      </table>
      <p>
        <a href="${approveSend}" style="display:inline-block;background:#0e6a6a;color:#fff;text-decoration:none;padding:12px 16px;margin:0 8px 8px 0">Approve and send code</a>
        <a href="${approve}" style="display:inline-block;background:#1b2733;color:#fff;text-decoration:none;padding:12px 16px;margin:0 8px 8px 0">Approve only</a>
        <a href="${reject}" style="display:inline-block;border:1px solid #9b2c2c;color:#9b2c2c;text-decoration:none;padding:11px 16px;margin-bottom:8px">Reject</a>
      </p>
      <p style="font-size:12px;color:#52616f">Approval links are private. Do not forward this email.</p>
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

function sendVisitorCode_(email, name, code) {
  const greeting = name ? 'Hello ' + name + ',' : 'Hello,';
  const body = [
    greeting,
    '',
    'Your private access request has been approved.',
    '',
    'Return to the Harbour Line operating brief and use:',
    'Email: ' + email,
    'Access code: ' + code,
    '',
    'Website: https://harbourlineadvisory.com',
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

function getAccessSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(['Request ID', 'Requested at', 'Name', 'Organisation', 'Email', 'Status', 'Expires', 'Approved at', 'Uses', 'Last used', 'Decision note', 'Source', 'Code hash', 'Salt']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateCode_() {
  const words = ['ANCHOR', 'BEACON', 'CHANNEL', 'HARBOUR', 'NORTH', 'QUAY', 'SOUNDER', 'TIDE'];
  const first = words[Math.floor(Math.random() * words.length)];
  let second = words[Math.floor(Math.random() * words.length)];
  if (second === first) second = 'LINE';
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return first + '-' + digits + '-' + second;
}

function sha256_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
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
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function genericRequestResponse_() {
  return {
    ok: true,
    message: 'Your request has been recorded. Access is issued personally after review.',
  };
}

function adminPage_(title, message, success, code) {
  const safeTitle = escapeHtml_(title);
  const safeMessage = escapeHtml_(message);
  const codeBlock = code ? `<div style="font-family:monospace;font-size:20px;letter-spacing:.04em;background:#f2f5f7;padding:14px;margin-top:20px">${escapeHtml_(code)}</div>` : '';
  return HtmlService.createHtmlOutput(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title></head><body style="margin:0;background:#fbfcfc;color:#1b2733;font-family:Arial,sans-serif"><main style="max-width:680px;margin:8vh auto;padding:32px"><div style="border-top:4px solid ${success ? '#0e6a6a' : '#9b2c2c'};background:white;padding:34px;box-shadow:0 12px 40px rgba(27,39,51,.08)"><p style="color:#0e6a6a;text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:bold">Harbour Line Advisory</p><h1 style="font-family:Georgia,serif;font-weight:400">${safeTitle}</h1><p style="color:#52616f;line-height:1.6">${safeMessage}</p>${codeBlock}</div></main></body></html>`);
}
