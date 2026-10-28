// The Google Apps Script users paste into their own spreadsheet (Extensions → Apps Script).
export const APPS_SCRIPT_CODE = `/**
 * Ipon Savings App — Google Sheets backend
 * Paste this into Extensions → Apps Script, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). Copy the Web app URL into the app's Settings.
 */
const PASSCODE = ''; // optional: set a secret here AND in the app's Settings → Connection

const TABS = {
  accounts: 'Accounts',
  expenses: 'Expenses',
  income: 'Income',
  transfers: 'Transfers',
  config: 'Config'
};

function doGet(e) {
  try {
    check_(e.parameter.passcode);
    if (e.parameter.action === 'ping') return out_({ ok: true, pong: true });
    const data = {};
    Object.keys(TABS).forEach(function (k) { data[k] = readAll_(TABS[k]); });
    return out_({ ok: true, data: data });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const body = JSON.parse(e.postData.contents);
    check_(body.passcode);
    (body.ops || []).forEach(function (op) {
      const name = TABS[op.c];
      if (!name) return;
      if (op.t === 'upsert') upsert_(name, op.row);
      if (op.t === 'delete') remove_(name, op.id);
    });
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function check_(code) {
  if (PASSCODE && String(code || '') !== PASSCODE) throw new Error('Wrong passcode');
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1).setValue('id');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 1).setFontWeight('bold');
  }
  return sh;
}

function headers_(sh) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  return sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
}

function upsert_(name, row) {
  const sh = sheet_(name);
  let hdr = headers_(sh);
  Object.keys(row).forEach(function (k) {
    if (hdr.indexOf(k) === -1) {
      hdr.push(k);
      sh.getRange(1, hdr.length).setValue(k).setFontWeight('bold');
    }
  });
  const values = hdr.map(function (h) { return row[h] === undefined ? '' : row[h]; });
  // keep dates as plain text so Sheets does not convert them
  hdr.forEach(function (h, i) { if (h === 'date') sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@'); });
  const r = findRow_(sh, row.id);
  if (r > 0) {
    sh.getRange(r, 1, 1, hdr.length).setValues([values]);
  } else {
    sh.getRange(sh.getLastRow() + 1, 1, 1, hdr.length).setValues([values]);
  }
}

function remove_(name, id) {
  const sh = sheet_(name);
  const r = findRow_(sh, id);
  if (r > 0) sh.deleteRow(r);
}

function findRow_(sh, id) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function readAll_(name) {
  const sh = sheet_(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const hdr = headers_(sh);
  const tz = Session.getScriptTimeZone();
  return sh.getRange(2, 1, last - 1, hdr.length).getValues().map(function (r) {
    const o = {};
    hdr.forEach(function (h, i) {
      let v = r[i];
      if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      o[h] = v;
    });
    return o;
  });
}

/** Run once from the editor to create all tabs and authorize the script. */
function setup() {
  Object.keys(TABS).forEach(function (k) { sheet_(TABS[k]); });
}
`;
