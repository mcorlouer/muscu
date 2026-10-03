/**
 * Logbook musculation : API entre l'app et ce Google Sheet.
 *
 * Installation :
 * 1. Dans le Sheet : Extensions > Apps Script, coller ce fichier.
 * 2. Exécuter une fois la fonction setup (autoriser l'accès).
 * 3. Paramètres du projet > Propriétés du script : ajouter TOKEN = votre mot de passe.
 * 4. Déployer > Nouveau déploiement > Application Web
 *    Exécuter en tant que : moi ; Qui a accès : tout le monde.
 * 5. Copier l'URL du déploiement (se termine par /exec) dans les réglages de l'app.
 */

const SHEETS = {
  Series: ['id', 'horodatage', 'date', 'index_seance', 'semaine', 'phase', 'seance', 'ordre',
    'exercice_id', 'exercice_prevu_id', 'numero_serie', 'type', 'serie_parent_id',
    'charge_kg', 'reps', 'duree_s', 'rpe', 'reps_min', 'reps_max', 'decharge'],
  Seances: ['id', 'horodatage', 'index_seance', 'seance', 'date_prevue', 'statut', 'date_reelle'],
  Modifications: ['id', 'horodatage', 'seance', 'ordre', 'exercice_initial', 'exercice_remplacant', 'a_partir_de_semaine'],
  Programme: ['json']
};

function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(function (name) {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(SHEETS[name]);
      sh.setFrozenRows(1);
    }
  });
}

function doGet() {
  return out({ ok: true, msg: 'Logbook API' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || req.token !== token) return out({ ok: false, error: 'Mot de passe refusé' });
    const d = req.data || {};
    switch (req.action) {
      case 'ping': return out({ ok: true });
      case 'getAll': return out(getAll());
      case 'setProgramme': return out(setProgramme(d.json));
      case 'addSerie': return out(append('Series', d));
      case 'addSeance': return out(append('Seances', d));
      case 'addModification': return out(append('Modifications', d));
      default: return out({ ok: false, error: 'Action inconnue : ' + req.action });
    }
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('Onglet manquant : ' + name + ' (exécuter setup)');
  return sh;
}

function readRows(name) {
  const sh = sheet(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(1, 1, last, sh.getLastColumn()).getValues();
  const head = values[0];
  const tz = Session.getScriptTimeZone();
  return values.slice(1).map(function (row) {
    const o = {};
    head.forEach(function (h, i) {
      let v = row[i];
      if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      o[h] = v;
    });
    return o;
  });
}

function getAll() {
  return {
    ok: true,
    programme: getProgramme(),
    series: readRows('Series'),
    seances: readRows('Seances'),
    modifications: readRows('Modifications')
  };
}

function getProgramme() {
  const sh = sheet('Programme');
  const last = sh.getLastRow();
  if (last < 2) return null;
  const txt = sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return r[0]; }).join('');
  return txt ? JSON.parse(txt) : null;
}

function setProgramme(json) {
  JSON.parse(json); // validation
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet('Programme');
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).clearContent();
    const chunks = [];
    for (let i = 0; i < json.length; i += 40000) chunks.push([json.slice(i, i + 40000)]);
    sh.getRange(2, 1, chunks.length, 1).setNumberFormat('@').setValues(chunks);
    return { ok: true, chunks: chunks.length };
  } finally {
    lock.releaseLock();
  }
}

function append(name, obj) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet(name);
    const last = sh.getLastRow();
    if (obj.id && last > 1) {
      const found = sh.getRange(2, 1, last - 1, 1).createTextFinder(String(obj.id)).matchEntireCell(true).findNext();
      if (found) return { ok: true, duplicate: true };
    }
    const row = SHEETS[name].map(function (h) {
      const v = obj[h];
      return v === undefined || v === null ? '' : v;
    });
    sh.appendRow(row);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
