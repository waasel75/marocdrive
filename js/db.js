'use strict';

// ============================================================
//  FIREBASE SYNC — remplissez FB_URL avec votre projet
//  1. Allez sur https://console.firebase.google.com
//  2. Créez un projet → Realtime Database → Créer une base
//  3. Copiez l'URL (ex: https://mon-projet-default-rtdb.firebaseio.com)
//  4. Dans Règles, mettez: { "rules": { ".read": true, ".write": true } }
// ============================================================
const FB_URL = (typeof SITE !== 'undefined' && SITE.firebaseUrl) ? SITE.firebaseUrl : 'YOUR_PROJECT';

const FB_KEYS = [
  'md_cars','md_reservations','md_offers','md_blocks',
  'md_site_settings','md_chat_conversations','md_chat_config','md_booking_config'
];

function _fbPath(lsKey) {
  return `${FB_URL}/${lsKey.replace('md_','')}.json`;
}

async function fbGet(key) {
  const r = await fetch(_fbPath(key));
  if (!r.ok) return null;
  return await r.json();
}

async function fbSet(key, val) {
  await fetch(_fbPath(key), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(val)
  });
}

async function fbDel(key) {
  await fetch(_fbPath(key), { method: 'DELETE' });
}

// Intercept localStorage writes → push to Firebase automatically
const _lsSet = localStorage.setItem.bind(localStorage);
const _lsRem = localStorage.removeItem.bind(localStorage);

localStorage.setItem = function(key, val) {
  _lsSet(key, val);
  if (FB_KEYS.includes(key) && !FB_URL.includes('YOUR_PROJECT')) {
    try { fbSet(key, JSON.parse(val)).catch(() => {}); } catch(e) {}
  }
};

localStorage.removeItem = function(key) {
  _lsRem(key);
  if (FB_KEYS.includes(key) && !FB_URL.includes('YOUR_PROJECT')) {
    fbDel(key).catch(() => {});
  }
};

// On page load: pull latest data from Firebase → update localStorage → fire event
(async function syncFromFirebase() {
  if (FB_URL.includes('YOUR_PROJECT')) return;
  try {
    let changed = false;
    for (const key of FB_KEYS) {
      const data = await fbGet(key);
      if (data !== null && data !== undefined) {
        const newVal = JSON.stringify(data);
        if (localStorage.getItem(key) !== newVal) {
          _lsSet(key, newVal);
          changed = true;
        }
      }
    }
    if (changed) window.dispatchEvent(new Event('db-synced'));
  } catch (e) {
    console.warn('[DB] Firebase sync failed, using local data:', e.message);
  }
})();
