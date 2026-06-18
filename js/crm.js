'use strict';

const WA_CRM = '212634829085';

const ST = {
  pending:  { label:'En attente',  color:'var(--yellow)', icon:'⏳' },
  confirmed:{ label:'Confirmé',    color:'var(--green)',  icon:'✅' },
  completed:{ label:'Terminé',     color:'var(--blue)',   icon:'🏁' },
  cancelled:{ label:'Annulé',      color:'var(--red)',    icon:'❌' },
};

/* ── FIREBASE SYNC ── */
let FB_BASE = '';
const FB_KEY = 'md_reservations';

function initFirebase() {
  try {
    const ss = JSON.parse(localStorage.getItem('md_site_settings') || '{}');
    if (ss.firebaseUrl && !ss.firebaseUrl.includes('YOUR_PROJECT')) {
      FB_BASE = ss.firebaseUrl;
    } else if (typeof SITE !== 'undefined' && SITE.firebaseUrl && !SITE.firebaseUrl.includes('YOUR_PROJECT')) {
      FB_BASE = SITE.firebaseUrl;
    }
  } catch(e) {}
}

async function fbFetch() {
  if (!FB_BASE) return null;
  try {
    const r = await fetch(`${FB_BASE}/reservations.json`);
    if (!r.ok) return null;
    return await r.json();
  } catch(e) { return null; }
}

async function fbPut(data) {
  if (!FB_BASE) return;
  try {
    await fetch(`${FB_BASE}/reservations.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch(e) {}
}

async function syncNow() {
  const data = await fbFetch();
  if (data !== null) {
    localStorage.setItem(FB_KEY, JSON.stringify(data));
    updateSyncBadge(true);
    return data;
  }
  updateSyncBadge(false);
  return getRes();
}

function updateSyncBadge(ok) {
  const dot = document.getElementById('syncDot');
  if (dot) dot.style.background = ok ? 'var(--green)' : 'var(--yellow)';
}

/* ── DATA ── */
function getRes() { return JSON.parse(localStorage.getItem(FB_KEY) || '[]'); }
function saveRes(data) {
  localStorage.setItem(FB_KEY, JSON.stringify(data));
  fbPut(data).catch(() => {});
}

/* ── UTILS ── */
const esc   = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt   = d => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
const fmtN  = n => Number(n).toLocaleString('fr-FR');
const init  = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const badge = s => `<span class="badge badge-${s}">${ST[s]?.label || s}</span>`;
const avatarColor = phone => {
  const colors = ['#e63946','#4361ee','#2ecc71','#f4a261','#7b2d8b','#00b4d8'];
  let h = 0; for (const c of (phone || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  return colors[Math.abs(h) % colors.length];
};

let _toast;
function toast(msg) {
  const el = document.getElementById('crmToast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toast);
  _toast = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── AUTH ── */
function crmLogin() {
  const u = document.getElementById('crmUser').value.trim();
  const p = document.getElementById('crmPass').value;
  const res = authCheckLogin(u, p);
  if (res.ok) {
    sessionStorage.setItem('md_crm', '1');
    document.getElementById('crmLoginScreen').style.display = 'none';
    document.getElementById('crmApp').style.display = 'flex';
    initApp();
  } else if (res.locked) {
    document.getElementById('crmErr').textContent = `🔒 Trop de tentatives. Réessayez dans ${res.locked}s.`;
  } else {
    document.getElementById('crmErr').textContent = '❌ Identifiant ou mot de passe incorrect.';
  }
}

function crmLogout() {
  sessionStorage.removeItem('md_crm');
  location.reload();
}

/* ── INIT ── */
async function initApp() {
  initFirebase();
  await syncNow();
  navigate('dashboard');
  setInterval(async () => { await syncNow(); renderCurrent(); }, 30000);
  renderNotifBadge();
}

let _currentSection = 'dashboard';
function renderCurrent() {
  if (_currentSection === 'dashboard') renderDashboard();
  else if (_currentSection === 'clients') renderClients();
  else if (_currentSection === 'reservations') renderReservations();
  else if (_currentSection === 'stats') renderStats();
}

function navigate(section) {
  _currentSection = section;
  document.querySelectorAll('.crm-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });
  document.querySelectorAll('.crm-section').forEach(el => {
    el.classList.toggle('active', el.id === 'sec-' + section);
  });
  const titles = { dashboard:'Tableau de bord', clients:'Clients', reservations:'Réservations', stats:'Statistiques' };
  document.getElementById('topbarTitle').textContent = titles[section] || '';
  renderCurrent();
}

function toggleSidebar() {
  document.getElementById('crmSidebar').classList.toggle('collapsed');
  document.getElementById('crmSidebar').classList.toggle('open');
}

/* ── NOTIF ── */
function renderNotifBadge() {
  const n = getRes().filter(r => r.status === 'pending').length;
  const el = document.getElementById('crmNotif');
  if (el) { el.textContent = n ? `${n} en attente` : ''; el.style.display = n ? 'inline' : 'none'; }
}

/* ── DASHBOARD ── */
function renderDashboard() {
  const all = getRes();
  const total     = all.length;
  const pending   = all.filter(r => r.status === 'pending').length;
  const confirmed = all.filter(r => r.status === 'confirmed').length;
  const completed = all.filter(r => r.status === 'completed').length;
  const cancelled = all.filter(r => r.status === 'cancelled').length;
  const revenue   = all.filter(r => r.status !== 'cancelled').reduce((s, r) => s + +r.total, 0);
  const clients   = new Set(all.map(r => r.phone)).size;

  document.getElementById('dashKpi').innerHTML = `
    <div class="kpi c-red"><div class="kpi-icon">📋</div><div class="kpi-val">${total}</div><div class="kpi-label">Total réservations</div><div class="kpi-sub ${pending ? 'warn' : 'up'}">${pending ? pending + ' en attente' : 'Tout traité ✓'}</div></div>
    <div class="kpi c-green"><div class="kpi-icon">💰</div><div class="kpi-val" style="font-size:1.5rem">${fmtN(revenue)}</div><div class="kpi-label">Chiffre d'affaires (MAD)</div><div class="kpi-sub up">Hors annulations</div></div>
    <div class="kpi c-blue"><div class="kpi-icon">👥</div><div class="kpi-val">${clients}</div><div class="kpi-label">Clients uniques</div><div class="kpi-sub up">Tous temps</div></div>
    <div class="kpi c-yellow"><div class="kpi-icon">⏳</div><div class="kpi-val" style="color:var(--yellow)">${pending}</div><div class="kpi-label">En attente</div><div class="kpi-sub ${pending ? 'warn' : 'up'}">${pending ? 'Action requise' : 'Aucune en attente ✓'}</div></div>
    <div class="kpi c-purple"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--green)">${confirmed}</div><div class="kpi-label">Confirmées</div><div class="kpi-sub up">${completed} terminée(s)</div></div>
  `;

  // Recent
  const recent = [...all].reverse().slice(0, 6);
  document.getElementById('dashRecent').innerHTML = recent.length
    ? recent.map(r => `
      <div class="act-item" onclick="openDetail(${r.id})">
        <div class="act-avatar" style="background:${avatarColor(r.phone)}">${esc(init(r.name))}</div>
        <div class="act-info">
          <div class="act-name">${esc(r.name)}</div>
          <div class="act-sub">🚗 ${esc(r.car)} · ${esc(r.city) || '—'}</div>
        </div>
        <div class="act-right">
          <div class="act-amount">${fmtN(r.total)} MAD</div>
          <div class="act-date">${badge(r.status)}</div>
        </div>
      </div>`).join('')
    : '<div class="crm-empty"><div class="crm-empty-icon">📭</div><div>Aucune réservation</div></div>';

  // Pending
  const pends = all.filter(r => r.status === 'pending').slice(0, 5);
  document.getElementById('dashPending').innerHTML = pends.length
    ? pends.map(r => `
      <div class="act-item">
        <div class="act-avatar" style="background:${avatarColor(r.phone)}">${esc(init(r.name))}</div>
        <div class="act-info">
          <div class="act-name">${esc(r.name)}</div>
          <div class="act-sub">🚗 ${esc(r.car)} · ${fmtN(r.total)} MAD</div>
        </div>
        <div class="acts">
          <button class="ab ok" onclick="changeStatus(${r.id},'confirmed')">✅</button>
          <button class="ab no" onclick="changeStatus(${r.id},'cancelled')">❌</button>
          <button class="ab wa" onclick="crmWA(${r.id})">📲</button>
        </div>
      </div>`).join('')
    : '<div class="crm-empty" style="padding:20px"><div>Aucune réservation en attente ✓</div></div>';

  // Status bars
  const counts = { pending, confirmed, completed, cancelled };
  document.getElementById('dashBars').innerHTML = Object.entries(ST).map(([k, v]) => {
    const n = counts[k] || 0;
    const pct = total ? Math.round(n / total * 100) : 0;
    return `<div class="sbar">
      <div class="sbar-val" style="color:${v.color}">${n}</div>
      <div class="sbar-label">${v.label}</div>
      <div class="sbar-track"><div class="sbar-fill" style="width:${pct}%;background:${v.color}"></div></div>
      <div class="sbar-pct">${pct}%</div>
    </div>`;
  }).join('');

  renderNotifBadge();
}

/* ── CLIENTS ── */
let _clientSearch = '';
function renderClients() {
  const all = getRes();
  const map = {};
  for (const r of all) {
    const key = r.phone || r.name;
    if (!map[key]) map[key] = { name: r.name, phone: r.phone, email: r.email, reservations: [], total: 0 };
    map[key].reservations.push(r);
    if (r.status !== 'cancelled') map[key].total += +r.total;
  }
  let clients = Object.values(map).sort((a, b) => b.total - a.total);
  if (_clientSearch) {
    const q = _clientSearch.toLowerCase();
    clients = clients.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q));
  }
  document.getElementById('clientCount').textContent = clients.length + ' client(s)';
  document.getElementById('clientGrid').innerHTML = clients.length
    ? clients.map(c => {
        const n = c.reservations.length;
        const active = c.reservations.filter(r => r.status === 'confirmed' || r.status === 'pending').length;
        const last = c.reservations[c.reservations.length - 1];
        return `<div class="client-card" onclick="openClientDetail('${esc(c.phone || c.name)}')">
          <div class="cc-top">
            <div class="cc-avatar" style="background:${avatarColor(c.phone)}">${esc(init(c.name))}</div>
            <div>
              <div class="cc-name">${esc(c.name)}</div>
              <div class="cc-phone">${esc(c.phone) || '—'}</div>
            </div>
          </div>
          <div class="cc-stats">
            <div class="cc-stat"><div class="cc-stat-val">${n}</div><div class="cc-stat-label">Réserv.</div></div>
            <div class="cc-stat"><div class="cc-stat-val" style="color:var(--green);font-size:.8rem">${fmtN(c.total)}</div><div class="cc-stat-label">MAD total</div></div>
            <div class="cc-stat"><div class="cc-stat-val" style="color:var(--blue)">${active}</div><div class="cc-stat-label">En cours</div></div>
          </div>
          ${last ? `<div style="margin-top:10px;font-size:.73rem;color:var(--muted)">Dernière: 🚗 ${esc(last.car)} · ${fmt(last.start)}</div>` : ''}
        </div>`;
      }).join('')
    : '<div class="crm-empty" style="grid-column:1/-1"><div class="crm-empty-icon">👥</div><div>Aucun client trouvé</div></div>';
}

function openClientDetail(key) {
  const all = getRes();
  const list = all.filter(r => (r.phone || r.name) === key);
  if (!list.length) return;
  const c = list[0];
  const totalRevenue = list.filter(r => r.status !== 'cancelled').reduce((s, r) => s + +r.total, 0);
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <h3>👤 Profil client</h3>
      <button class="modal-close" onclick="closeModal()">✕ Fermer</button>
    </div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--border)">
      <div class="cc-avatar" style="width:52px;height:52px;font-size:1rem;background:${avatarColor(c.phone)}">${esc(init(c.name))}</div>
      <div>
        <div style="font-weight:700;font-size:1rem">${esc(c.name)}</div>
        <div style="color:var(--muted);font-size:.8rem">${esc(c.phone) || '—'} ${c.email ? '· ' + esc(c.email) : ''}</div>
      </div>
    </div>
    <div class="cc-stats" style="margin-bottom:16px">
      <div class="cc-stat"><div class="cc-stat-val">${list.length}</div><div class="cc-stat-label">Réservations</div></div>
      <div class="cc-stat"><div class="cc-stat-val" style="color:var(--green);font-size:.8rem">${fmtN(totalRevenue)}</div><div class="cc-stat-label">MAD dépensé</div></div>
      <div class="cc-stat"><div class="cc-stat-val" style="color:var(--yellow)">${list.filter(r=>r.status==='pending').length}</div><div class="cc-stat-label">En attente</div></div>
    </div>
    <div style="font-weight:600;font-size:.82rem;margin-bottom:8px;color:var(--muted)">HISTORIQUE</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${list.map(r => `
        <div class="act-item" onclick="closeModal();openDetail(${r.id})" style="cursor:pointer">
          <div class="act-info">
            <div class="act-name">🚗 ${esc(r.car)}</div>
            <div class="act-sub">${fmt(r.start)} → ${fmt(r.end)} · ${r.days}j</div>
          </div>
          <div class="act-right">
            <div class="act-amount">${fmtN(r.total)} MAD</div>
            <div>${badge(r.status)}</div>
          </div>
        </div>`).join('')}
    </div>
    <div class="modal-acts">
      ${c.phone ? `<button class="mb wa" onclick="window.open('https://wa.me/${(c.phone||'').replace(/\D/g,'')}','_blank')">📲 WhatsApp</button>` : ''}
      <button class="mb close" onclick="closeModal()">Fermer</button>
    </div>
  `;
  document.getElementById('crmOverlay').classList.add('open');
}

/* ── RESERVATIONS ── */
let _resSearch = '', _resStatus = '';
function renderReservations() {
  let data = getRes();
  if (_resSearch) {
    const q = _resSearch.toLowerCase();
    data = data.filter(r =>
      r.name?.toLowerCase().includes(q) || r.car?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q) || r.phone?.includes(q)
    );
  }
  if (_resStatus) data = data.filter(r => r.status === _resStatus);
  data = [...data].reverse();

  document.getElementById('resCount').textContent = data.length + ' réservation(s)';
  const tbody = document.getElementById('resBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="crm-empty"><div class="crm-empty-icon">📭</div><div>Aucune réservation trouvée</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div class="crm-avatar" style="background:${avatarColor(r.phone)}">${esc(init(r.name))}</div>
        <div><div class="td-name">${esc(r.name)}</div><div class="td-sub">${esc(r.phone)}</div></div>
      </div></td>
      <td style="font-weight:600">${esc(r.car)}</td>
      <td style="color:var(--muted);font-size:.78rem">${esc(r.city) || '—'}</td>
      <td style="font-size:.78rem">${fmt(r.start)}<br><span style="color:var(--muted)">→ ${fmt(r.end)}</span></td>
      <td style="color:var(--muted)">${r.days}j</td>
      <td style="font-weight:700;color:var(--green)">${fmtN(r.total)} <span style="color:var(--muted);font-size:.7rem">MAD</span></td>
      <td>${badge(r.status)}</td>
      <td><div class="acts">
        <button class="ab" onclick="openDetail(${r.id})" title="Détails">👁</button>
        <button class="ab wa" onclick="crmWA(${r.id})" title="WhatsApp">📲</button>
        ${r.status === 'pending' ? `<button class="ab ok" onclick="changeStatus(${r.id},'confirmed')">✅</button>` : ''}
        ${r.status !== 'cancelled' && r.status !== 'completed' ? `<button class="ab no" onclick="changeStatus(${r.id},'cancelled')">❌</button>` : ''}
        <button class="ab del" onclick="delRes(${r.id})" title="Supprimer">🗑</button>
      </div></td>
    </tr>
  `).join('');
}

/* ── STATS ── */
function renderStats() {
  const all = getRes();
  if (!all.length) {
    document.getElementById('statsContent').innerHTML = '<div class="crm-empty"><div class="crm-empty-icon">📊</div><div>Aucune donnée disponible</div></div>';
    return;
  }

  // Cars ranking
  const carMap = {};
  for (const r of all) {
    if (r.status === 'cancelled') continue;
    carMap[r.car] = (carMap[r.car] || 0) + 1;
  }
  const topCars = Object.entries(carMap).sort((a,b) => b[1]-a[1]).slice(0, 6);
  const maxCar = topCars[0]?.[1] || 1;

  // Monthly revenue
  const monthMap = {};
  for (const r of all) {
    if (r.status === 'cancelled') continue;
    const m = new Date(r.start).toLocaleDateString('fr-FR', { month:'short', year:'numeric' });
    monthMap[m] = (monthMap[m] || 0) + +r.total;
  }
  const months = Object.entries(monthMap).slice(-6);
  const maxRev = Math.max(...months.map(m => m[1]), 1);

  // Cities
  const cityMap = {};
  for (const r of all) {
    const city = r.city || 'Non précisé';
    cityMap[city] = (cityMap[city] || 0) + 1;
  }
  const topCities = Object.entries(cityMap).sort((a,b) => b[1]-a[1]).slice(0, 5);

  document.getElementById('statsContent').innerHTML = `
    <div class="grid-2">
      <div class="crm-card">
        <div class="crm-card-title">🚗 Top véhicules</div>
        ${topCars.map(([car, n]) => `
          <div class="sbar" style="margin-bottom:12px">
            <div class="sbar-val" style="color:var(--blue)">${n}</div>
            <div class="sbar-label" style="width:120px;font-size:.8rem">${esc(car)}</div>
            <div class="sbar-track"><div class="sbar-fill" style="width:${Math.round(n/maxCar*100)}%;background:var(--blue)"></div></div>
          </div>`).join('')}
      </div>
      <div class="crm-card">
        <div class="crm-card-title">📍 Top villes</div>
        ${topCities.map(([city, n]) => `
          <div class="sbar" style="margin-bottom:12px">
            <div class="sbar-val" style="color:var(--accent)">${n}</div>
            <div class="sbar-label" style="width:120px;font-size:.8rem">${esc(city)}</div>
            <div class="sbar-track"><div class="sbar-fill" style="width:${Math.round(n/topCities[0][1]*100)}%;background:var(--accent)"></div></div>
          </div>`).join('')}
      </div>
    </div>
    <div class="crm-card">
      <div class="crm-card-title">📈 Chiffre d'affaires mensuel (MAD)</div>
      <div style="display:flex;align-items:flex-end;gap:10px;height:140px;padding-bottom:4px">
        ${months.map(([m, rev]) => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div style="font-size:.65rem;color:var(--muted)">${fmtN(rev)}</div>
            <div style="width:100%;background:var(--accent2);border-radius:4px 4px 0 0;height:${Math.round(rev/maxRev*100)}px"></div>
            <div style="font-size:.65rem;color:var(--muted);text-align:center">${m}</div>
          </div>`).join('')}
      </div>
    </div>
  `;
}

/* ── DETAIL MODAL ── */
function openDetail(id) {
  const r = getRes().find(r => r.id == id);
  if (!r) return;
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <h3>📋 Réservation #${r.id}</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="margin-bottom:14px">${badge(r.status)}</div>
    <div class="drow"><span class="dk">👤 Client</span><span class="dv">${esc(r.name)}</span></div>
    <div class="drow"><span class="dk">📞 Téléphone</span><span class="dv">${esc(r.phone)}</span></div>
    ${r.email ? `<div class="drow"><span class="dk">✉️ Email</span><span class="dv">${esc(r.email)}</span></div>` : ''}
    <div class="drow"><span class="dk">🚗 Véhicule</span><span class="dv">${esc(r.car)}</span></div>
    <div class="drow"><span class="dk">📍 Lieu</span><span class="dv">${esc(r.city) || '—'}</span></div>
    <div class="drow"><span class="dk">📅 Départ</span><span class="dv">${fmt(r.start)}</span></div>
    <div class="drow"><span class="dk">📅 Retour</span><span class="dv">${fmt(r.end)}</span></div>
    <div class="drow"><span class="dk">⏱ Durée</span><span class="dv">${r.days} jour${r.days > 1 ? 's' : ''}</span></div>
    <div class="drow"><span class="dk">💵 Prix/jour</span><span class="dv">${fmtN(r.carPrice)} MAD</span></div>
    <div class="dtotal"><span>💰 Total</span><span class="dtotal-val">${fmtN(r.total)} MAD</span></div>
    <div class="drow"><span class="dk">🕐 Créé le</span><span class="dv">${new Date(r.createdAt).toLocaleString('fr-FR')}</span></div>
    <div class="modal-acts">
      ${r.status === 'pending' ? `<button class="mb confirm" onclick="changeStatus(${r.id},'confirmed');closeModal()">✅ Confirmer</button>` : ''}
      ${r.status !== 'cancelled' && r.status !== 'completed' ? `<button class="mb cancel" onclick="changeStatus(${r.id},'cancelled');closeModal()">❌ Annuler</button>` : ''}
      <button class="mb wa" onclick="crmWA(${r.id})">📲 WhatsApp</button>
      <button class="mb close" onclick="closeModal()">Fermer</button>
    </div>
  `;
  document.getElementById('crmOverlay').classList.add('open');
}

function closeModal() { document.getElementById('crmOverlay').classList.remove('open'); }

/* ── ACTIONS ── */
function changeStatus(id, status) {
  const data = getRes().map(r => r.id == id ? { ...r, status } : r);
  saveRes(data);
  toast(`${ST[status].icon} Statut: ${ST[status].label}`);
  renderCurrent();
  renderNotifBadge();
}

function delRes(id) {
  if (!confirm('Supprimer cette réservation ?')) return;
  saveRes(getRes().filter(r => r.id != id));
  toast('🗑️ Réservation supprimée');
  renderCurrent();
  renderNotifBadge();
}

function crmWA(id) {
  const r = getRes().find(r => r.id == id);
  if (!r) return;
  const phone = (r.phone || WA_CRM).replace(/\D/g, '');
  const msg = encodeURIComponent(`Bonjour ${r.name},\nVotre réservation pour ${r.car} du ${fmt(r.start)} au ${fmt(r.end)} (${r.days}j) — Total: ${fmtN(r.total)} MAD.\nStatut: ${ST[r.status]?.label}.`);
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

/* ── BOOT ── */
window.addEventListener('load', () => {
  if (sessionStorage.getItem('md_crm') === '1') {
    document.getElementById('crmLoginScreen').style.display = 'none';
    document.getElementById('crmApp').style.display = 'flex';
    initApp();
  }
  document.getElementById('crmUser').addEventListener('keydown', e => { if (e.key === 'Enter') crmLogin(); });
  document.getElementById('crmPass').addEventListener('keydown', e => { if (e.key === 'Enter') crmLogin(); });
});
