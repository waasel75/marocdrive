'use strict';

const WA_CRM = '212634829085';

(function applyCrmTitleBranding() {
  const agencyName = (JSON.parse(localStorage.getItem('md_site_settings') || '{}').name) || 'Chakroun Cars';
  if (document.title.includes('Chakroun Cars')) document.title = document.title.replace(/Chakroun Cars/g, agencyName);
})();

const ST = {
  pending:         { label:'En attente',        color:'var(--yellow)', icon:'⏳' },
  payment_pending: { label:'Paiement en cours', color:'#f97316',       icon:'💳' },
  confirmed:       { label:'Confirmé',          color:'var(--green)',  icon:'✅' },
  completed:       { label:'Terminé',           color:'var(--blue)',   icon:'🏁' },
  cancelled:       { label:'Annulé',            color:'var(--red)',    icon:'❌' },
};

/* ── SUPABASE SYNC ── */
const FB_KEY = 'md_reservations';

async function syncNow() {
  if (window.SB_READY) {
    const data = await window.sbGetKV(FB_KEY);
    if (data !== null) {
      localStorage.setItem(FB_KEY, JSON.stringify(data));
      updateSyncBadge(true);
      return data;
    }
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
  localStorage.setItem(FB_KEY, JSON.stringify(data)); // db.js intercepts this write and syncs to Supabase
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
  await syncNow();
  navigate('dashboard');
  setInterval(async () => { await syncNow(); renderCurrent(); }, 30000);
  renderNotifBadge();
  checkVidangeAlerts();
  checkEcheanceAlerts();
}

let _currentSection = 'dashboard';
function renderCurrent() {
  if (_currentSection === 'dashboard') renderDashboard();
  else if (_currentSection === 'clients') renderClients();
  else if (_currentSection === 'reservations') renderReservations();
  else if (_currentSection === 'vehicles') renderVehicles();
  else if (_currentSection === 'vidange') renderVidange();
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
  const titles = { dashboard:'Tableau de bord', clients:'Clients', reservations:'Réservations', vehicles:'Véhicules', vidange:'Vidange', stats:'Statistiques' };
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
  const ech = (typeof echeanceAlerts === 'function') ? echeanceAlerts().length : 0;
  const el = document.getElementById('crmNotif');
  const parts = [];
  if (n) parts.push(`${n} en attente`);
  if (ech) parts.push(`🔔 ${ech} échéance(s)`);
  if (el) { el.textContent = parts.join(' · '); el.style.display = parts.length ? 'inline' : 'none'; }
}

/* ── DASHBOARD ── */
function renderDashboard() {
  const all = getRes();
  const total     = all.length;
  const pending   = all.filter(r => r.status === 'pending').length;
  const confirmed = all.filter(r => r.status === 'confirmed').length;
  const completed = all.filter(r => r.status === 'completed').length;
  const cancelled = all.filter(r => r.status === 'cancelled').length;
  const revenue   = all.filter(r => r.status === 'completed').reduce((s, r) => s + +r.total, 0);
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

  renderEcheances();
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
          ${r.contract ? `<a href="${r.contract}" download="${r.contractName||'contrat_'+r.id+(r.contract.startsWith('data:application/pdf')?'.pdf':'')}" onclick="event.stopPropagation()" class="crm-btn-sm" style="margin-left:6px">⬇️ ${r.contract.startsWith('data:application/pdf')?'PDF':'Contrat'}</a>` : ''}
        </div>`).join('')}
    </div>
    <div class="modal-acts">
      ${c.phone ? `<button class="mb wa" onclick="window.open('https://wa.me/${(c.phone||'').replace(/\D/g,'')}','_blank')">📲 WhatsApp</button>` : ''}
      <button class="mb confirm" onclick="exportContact('${esc(key).replace(/'/g,"\\'")}')">📇 Exporter contact</button>
      <button class="mb close" onclick="closeModal()">Fermer</button>
    </div>
  `;
  document.getElementById('crmOverlay').classList.add('open');
}

/* ── CONTACT EXPORT ── */
function vcardFor(c) {
  const ag = agencyInfo();
  return [
    'BEGIN:VCARD','VERSION:3.0',
    `FN:${c.name||'Client'}`,
    `N:${c.name||'Client'};;;;`,
    c.phone ? `TEL;TYPE=CELL:${c.phone}` : '',
    c.email ? `EMAIL:${c.email}` : '',
    `NOTE:Client ${ag.name} — ${c.reservations?c.reservations.length:1} réservation(s)`,
    'END:VCARD'
  ].filter(Boolean).join('\n');
}
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function exportContact(key) {
  const all = getRes();
  const list = all.filter(r => (r.phone || r.name) === key);
  if (!list.length) return;
  const c = list[0];
  downloadFile(vcardFor({...c, reservations:list}), `Contact_${(c.name||'client').replace(/[^a-zA-Z0-9]+/g,'_')}.vcf`, 'text/vcard');
  toast('📇 Contact exporté');
}
function exportAllContacts() {
  const all = getRes();
  const map = {};
  for (const r of all) {
    const key = r.phone || r.name;
    if (!map[key]) map[key] = { name: r.name, phone: r.phone, email: r.email, reservations: [] };
    map[key].reservations.push(r);
  }
  const clients = Object.values(map);
  if (!clients.length) { toast('⚠️ Aucun client à exporter'); return; }
  const vcf = clients.map(vcardFor).join('\n');
  downloadFile(vcf, 'Contacts_clients.vcf', 'text/vcard');
  toast(`📇 ${clients.length} contact(s) exporté(s)`);
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

/* ── PAYMENT / CAUTION ── */
function paymentInfo(r) {
  const total = +r.total || 0;
  const paid  = Math.min(+r.amountPaid || 0, total);
  const due   = Math.max(total - paid, 0);
  return { total, paid, due, full: due <= 0 && total > 0 };
}
function paymentBadge(r) {
  const p = paymentInfo(r);
  if (p.total <= 0) return '';
  return p.full
    ? `<span class="badge" style="background:rgba(46,204,113,.15);color:var(--green)">✅ Payé complet</span>`
    : `<span class="badge" style="background:rgba(244,162,97,.15);color:var(--yellow)">💳 Avance — reste ${fmtN(p.due)} MAD</span>`;
}
function setPayment(id, amountPaid) {
  saveRes(getRes().map(r => r.id==id ? {...r, amountPaid: Math.max(0,+amountPaid||0)} : r));
  toast('💰 Paiement mis à jour');
  renderCurrent();
}
function addPayment(id, extra) {
  extra = +extra || 0;
  if (extra <= 0) { toast('⚠️ Montant invalide'); return; }
  const r = getRes().find(r=>r.id==id);
  if (!r) return;
  const p = paymentInfo(r);
  setPayment(id, Math.min(p.paid + extra, p.total));
  openDetail(id);
}
function setCaution(id, hasCaution, amount) {
  saveRes(getRes().map(r => r.id==id ? {...r, hasCaution, caution: hasCaution ? Math.max(0,+amount||0) : 0} : r));
  toast('🔒 Caution mise à jour');
  openDetail(id);
}
function toggleCautionEdit(id) {
  const r = getRes().find(r=>r.id==id);
  if (!r) return;
  const wrap = document.getElementById('caution_wrap_'+id);
  if (wrap.innerHTML) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `
    <label style="display:flex;align-items:center;gap:6px;font-size:.82rem">
      <input type="checkbox" id="cau_has_${id}" ${r.hasCaution?'checked':''} onchange="document.getElementById('cau_amt_wrap_${id}').style.display=this.checked?'':'none'"/> Caution prise
    </label>
    <div id="cau_amt_wrap_${id}" style="display:${r.hasCaution?'':'none'};margin-top:6px">
      <input id="cau_amt_${id}" type="number" min="0" placeholder="Montant MAD" value="${r.caution||0}"/>
    </div>
    <button class="crm-btn-sm" style="margin-top:6px" onclick="setCaution(${id}, document.getElementById('cau_has_${id}').checked, document.getElementById('cau_amt_${id}').value)">💾 Enregistrer</button>`;
}

/* ── INVOICE ── */
function agencyInfo() {
  const s = JSON.parse(localStorage.getItem('md_site_settings')||'{}');
  return { name: s.name||'Chakroun Cars', logo: s.logo||'', phone: s.phone||'', email: s.email||'', address: s.address||'' };
}
function downloadInvoice(id) {
  const r = getRes().find(r=>r.id==id);
  if (!r) return;
  const p = paymentInfo(r);
  const ag = agencyInfo();
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Facture #${r.id}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#111}
    .ag-header{display:flex;align-items:center;gap:14px;margin-bottom:6px}
    .ag-header img{width:54px;height:54px;border-radius:10px;object-fit:cover}
    h1{color:#e63329;font-size:1.5rem}
    .ag-contact{color:#666;font-size:.85rem;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    td{padding:8px 0;border-bottom:1px solid #eee}
    td:first-child{color:#666;width:45%}
    .total{font-size:1.3rem;font-weight:bold;color:#e63329;margin-top:20px}
  </style></head><body>
    <div class="ag-header">${ag.logo?`<img src="${ag.logo}"/>`:''}<h1>${esc(ag.name)} — Facture</h1></div>
    ${(ag.phone||ag.email||ag.address)?`<p class="ag-contact">${[ag.phone&&'📞 '+esc(ag.phone),ag.email&&'✉️ '+esc(ag.email),ag.address&&'📍 '+esc(ag.address)].filter(Boolean).join(' · ')}</p>`:''}
    <p>Facture N° ${r.id} · ${new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
    <table>
      <tr><td>👤 Client</td><td>${esc(r.name)}</td></tr>
      <tr><td>📞 Téléphone</td><td>${esc(r.phone)}</td></tr>
      ${r.email?`<tr><td>✉️ Email</td><td>${esc(r.email)}</td></tr>`:''}
      <tr><td>📍 Lieu de livraison</td><td>${esc(r.city)||'—'}</td></tr>
      <tr><td>🚘 Véhicule</td><td>${esc(r.car)}</td></tr>
      <tr><td>📅 Départ</td><td>${fmt(r.start)}</td></tr>
      <tr><td>📅 Retour</td><td>${fmt(r.end)}</td></tr>
      <tr><td>⏱ Durée</td><td>${r.days} jour(s)</td></tr>
      <tr><td>💵 Prix/jour</td><td>${fmtN(r.carPrice)} MAD</td></tr>
      <tr><td>💰 Total</td><td>${fmtN(p.total)} MAD</td></tr>
      <tr><td>✅ Déjà payé</td><td>${fmtN(p.paid)} MAD</td></tr>
      <tr><td>⏳ Reste à payer</td><td>${fmtN(p.due)} MAD</td></tr>
      <tr><td>Statut</td><td>${p.full?'Payé complet':'Avance'} · ${ST[r.status]?.label||r.status}</td></tr>
      ${r.hasCaution?`<tr><td>🔒 Caution</td><td>${fmtN(r.caution)} MAD</td></tr>`:''}
    </table>
    <p class="total">Total : ${fmtN(p.total)} MAD</p>
  </body></html>`;
  const blob = new Blob([html], { type:'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Facture_${ag.name.replace(/[^a-zA-Z0-9]+/g,'_')}_${r.id}.html`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('🧾 Facture téléchargée');
}

/* ── EDIT / DELETE ── */
function openEditReservation(id) {
  const r = getRes().find(r=>r.id==id);
  if (!r) return;
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head"><h3>✏️ Modifier la réservation</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="crm-fg"><label>Nom du client</label><input id="er_name" type="text" value="${esc(r.name)}"/></div>
    <div class="crm-fg"><label>Téléphone</label><input id="er_phone" type="text" value="${esc(r.phone)}"/></div>
    <div class="crm-fg"><label>Email (optionnel)</label><input id="er_email" type="email" value="${esc(r.email||'')}"/></div>
    <div class="crm-fg"><label>Véhicule</label>
      <select id="er_car">${getVehicles().map(v=>`<option value="${esc(v.name)}" ${v.name===r.car?'selected':''}>${esc(v.name)}</option>`).join('')}
        ${!getVehicles().some(v=>v.name===r.car)?`<option value="${esc(r.car)}" selected>${esc(r.car)}</option>`:''}
      </select>
    </div>
    <div class="crm-fg"><label>Lieu de livraison</label><input id="er_city" type="text" value="${esc(r.city||'')}"/></div>
    <div class="crm-fg"><label>Date départ</label><input id="er_start" type="date" value="${r.start}"/></div>
    <div class="crm-fg"><label>Date retour</label><input id="er_end" type="date" value="${r.end}"/></div>
    <div class="crm-fg"><label>Total (MAD)</label><input id="er_total" type="number" min="0" value="${r.total}"/></div>
    <div class="crm-fg"><label>Déjà payé (MAD)</label><input id="er_paid" type="number" min="0" value="${r.amountPaid||0}"/></div>
    <div class="crm-fg">
      <label><input id="er_hasCaution" type="checkbox" ${r.hasCaution?'checked':''} onchange="document.getElementById('er_caution_wrap').style.display=this.checked?'':'none'"/> Caution / Garantie prise</label>
    </div>
    <div class="crm-fg" id="er_caution_wrap" style="display:${r.hasCaution?'':'none'}"><label>Montant de la caution (MAD)</label><input id="er_caution" type="number" min="0" value="${r.caution||0}"/></div>
    <div class="crm-fg"><label>Statut</label>
      <select id="er_status">${Object.entries(ST).map(([k,s])=>`<option value="${k}" ${r.status===k?'selected':''}>${s.icon} ${s.label}</option>`).join('')}</select>
    </div>
    <div class="modal-acts">
      <button class="mb confirm" onclick="submitEditReservation(${id})">💾 Enregistrer</button>
      <button class="mb close" onclick="openDetail(${id})">Annuler</button>
    </div>`;
}
function submitEditReservation(id) {
  const v = vid => document.getElementById(vid).value.trim();
  const start = v('er_start'), end = v('er_end');
  const days = Math.max(1, Math.round((new Date(end)-new Date(start))/86400000));
  const total = +v('er_total')||0;
  const hasCaution = document.getElementById('er_hasCaution').checked;
  saveRes(getRes().map(r => r.id==id ? {...r,
    name: v('er_name'), phone: v('er_phone'), email: v('er_email'),
    car: v('er_car'), city: v('er_city'), start, end, days, total,
    carPrice: days?Math.round(total/days):total,
    amountPaid: +v('er_paid')||0,
    hasCaution, caution: hasCaution ? (+v('er_caution')||0) : 0,
    status: v('er_status'),
  } : r));
  toast('✅ Réservation mise à jour');
  openDetail(id);
  renderNotifBadge();
}

/* ── DETAIL MODAL ── */
function openDetail(id) {
  const r = getRes().find(r => r.id == id);
  if (!r) return;
  const p = paymentInfo(r);
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
    <div class="drow"><span class="dk">💳 Paiement</span><span class="dv">${paymentBadge(r)||'—'}</span></div>
    <div class="drow"><span class="dk">✅ Déjà payé</span><span class="dv">${fmtN(p.paid)} MAD</span></div>
    <div class="drow"><span class="dk">⏳ Reste</span><span class="dv">${fmtN(p.due)} MAD</span></div>
    <div class="drow"><span class="dk">🔒 Caution</span><span class="dv">${r.hasCaution ? fmtN(r.caution)+' MAD' : 'Non prise'} <button class="crm-btn-sm" onclick="toggleCautionEdit(${r.id})">✏️</button></span></div>
    <div id="caution_wrap_${r.id}"></div>
    ${p.due > 0 ? `
    <div class="crm-fg">
      <label>💰 Déjà payé (MAD)</label>
      <div style="display:flex;gap:8px">
        <input id="addpay_${r.id}" type="number" min="0" max="${p.due}" placeholder="Ex: 500"/>
        <button class="crm-btn-sm" onclick="addPayment(${r.id}, document.getElementById('addpay_${r.id}').value)">➕ Ajouter</button>
      </div>
      <button class="crm-btn-sm" style="margin-top:6px;width:100%" onclick="addPayment(${r.id}, ${p.due})">✅ ${fmtN(p.due)} MAD</button>
    </div>` : ''}
    <button class="mb wa" style="width:100%;margin-top:10px" onclick="downloadInvoice(${r.id})">🧾 Télécharger la facture</button>
    <div class="crm-fg" style="margin-top:12px">
      <label>📄 Contrat de location</label>
      ${r.contract ? `
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${r.contract.startsWith('data:image') ? `<img src="${r.contract}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;cursor:pointer" onclick="window.open('${r.contract}','_blank')"/>` : `<span style="font-size:1.6rem">📄</span>`}
          <a href="${r.contract}" download="${r.contractName||'contrat_'+r.id}" class="crm-btn-sm">⬇️ Télécharger</a>
          <button class="crm-btn-sm" onclick="removeContract(${r.id})">🗑️ Supprimer</button>
        </div>` : `
        <input id="contract_file_${r.id}" type="file" accept="image/*,.pdf"/>
        <button class="crm-btn-sm" style="margin-top:6px" onclick="uploadContract(${r.id})">📤 Téléverser le contrat</button>`}
    </div>
    <div class="drow"><span class="dk">🕐 Créé le</span><span class="dv">${new Date(r.createdAt).toLocaleString('fr-FR')}</span></div>
    <div class="modal-acts">
      <button class="crm-btn-sm" style="width:100%" onclick="openEditReservation(${r.id})">✏️ Modifier toute la réservation</button>
      ${r.status === 'pending' ? `<button class="mb confirm" onclick="changeStatus(${r.id},'confirmed');closeModal()">✅ Confirmer</button>` : ''}
      ${r.status !== 'cancelled' && r.status !== 'completed' ? `<button class="mb cancel" onclick="changeStatus(${r.id},'cancelled');closeModal()">❌ Annuler</button>` : ''}
      <button class="mb wa" onclick="crmWA(${r.id})">📲 WhatsApp</button>
      <button class="mb cancel" onclick="delRes(${r.id})">🗑️ Supprimer</button>
      <button class="mb close" onclick="closeModal()">Fermer</button>
    </div>
  `;
  document.getElementById('crmOverlay').classList.add('open');
}

function closeModal() { document.getElementById('crmOverlay').classList.remove('open'); }

/* ── CONTRACT ── */
function uploadContract(id) {
  const input = document.getElementById('contract_file_'+id);
  const file = input?.files?.[0];
  if (!file) { toast('⚠️ Choisissez un fichier (image ou PDF)'); return; }
  if (!/^image\/|application\/pdf$/.test(file.type)) { toast('⚠️ Format non supporté — image ou PDF uniquement'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    saveRes(getRes().map(r => r.id==id ? {...r, contract: ev.target.result, contractName: file.name} : r));
    toast('✅ Contrat téléversé');
    openDetail(id);
  };
  reader.readAsDataURL(file);
}
function removeContract(id) {
  if (!confirm('Supprimer le contrat ?')) return;
  saveRes(getRes().map(r => r.id==id ? {...r, contract: '', contractName: ''} : r));
  toast('🗑️ Contrat supprimé');
  openDetail(id);
}

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

/* ── MANUAL RESERVATION ── */
function openManualModal() {
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head"><h3>📞 Nouvelle réservation manuelle</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="crm-fg"><label>Nom du client</label><input id="mr_name" type="text" placeholder="Nom complet"/></div>
    <div class="crm-fg"><label>Téléphone</label><input id="mr_phone" type="text" placeholder="06..."/></div>
    <div class="crm-fg"><label>Email (optionnel)</label><input id="mr_email" type="email" placeholder="exemple@gmail.com"/></div>
    <div class="crm-fg"><label>Véhicule</label>
      <select id="mr_car" onchange="mrCheckAvail()">
        <option value="">— Choisir —</option>
        ${getVehicles().map(v=>`<option value="${esc(v.name)}">${esc(v.name)}${v.plate?' ('+esc(v.plate)+')':''}</option>`).join('')}
      </select>
    </div>
    <div class="crm-fg"><label>Lieu de livraison</label><input id="mr_city" type="text" placeholder="Ville / adresse de livraison"/></div>
    <div class="crm-fg"><label>Date départ</label><input id="mr_start" type="date" onchange="mrCheckAvail()"/></div>
    <div class="crm-fg"><label>Date retour</label><input id="mr_end" type="date" onchange="mrCheckAvail()"/></div>
    <div id="mr_availMsg"></div>
    <div id="mr_miniCal"></div>
    <div class="crm-fg"><label>Total (MAD)</label><input id="mr_total" type="number" min="0" placeholder="0" oninput="_mrSyncPaid()"/></div>
    <div class="crm-fg"><label>Statut paiement</label>
      <select id="mr_paytype" onchange="_mrSyncPaid()">
        <option value="full">✅ Payé complet</option>
        <option value="deposit" selected>💳 Avance</option>
        <option value="none">⏳ Rien payé</option>
      </select>
    </div>
    <div class="crm-fg" id="mr_paid_wrap"><label>Montant déjà payé / avance (MAD)</label><input id="mr_paid" type="number" min="0" placeholder="0"/></div>
    <div class="crm-fg">
      <label><input id="mr_hasCaution" type="checkbox" onchange="document.getElementById('mr_caution_wrap').style.display=this.checked?'':'none'"/> Caution / Garantie prise</label>
    </div>
    <div class="crm-fg" id="mr_caution_wrap" style="display:none"><label>Montant de la caution (MAD)</label><input id="mr_caution" type="number" min="0" placeholder="0"/></div>
    <div class="modal-acts">
      <button class="mb confirm" onclick="submitManualReservation()">✅ Enregistrer</button>
      <button class="mb close" onclick="closeModal()">Annuler</button>
    </div>`;
  document.getElementById('crmOverlay').classList.add('open');
}

function _mrSyncPaid() {
  const type = document.getElementById('mr_paytype')?.value;
  const total = +document.getElementById('mr_total')?.value || 0;
  const paidInput = document.getElementById('mr_paid');
  const wrap = document.getElementById('mr_paid_wrap');
  if (!paidInput) return;
  if (type === 'full')      { paidInput.value = total; wrap.style.display = 'none'; }
  else if (type === 'none') { paidInput.value = 0;     wrap.style.display = 'none'; }
  else                      { wrap.style.display = ''; }
}

function mrCheckAvail() {
  const car = document.getElementById('mr_car').value;
  const start = document.getElementById('mr_start').value;
  const end = document.getElementById('mr_end').value;
  const msgEl = document.getElementById('mr_availMsg');
  const calEl = document.getElementById('mr_miniCal');
  window._mrAvailable = true;
  if (!car) { msgEl.innerHTML=''; calEl.innerHTML=''; return; }
  const v = getVehicles().find(x=>x.name===car);
  if (v && (v.status==='accident' || v.status==='maintenance')) {
    window._mrAvailable = false;
    msgEl.innerHTML = `<p style="color:var(--red);font-size:.82rem;font-weight:600">❌ Indisponible — ${v.status==='accident'?'véhicule accidenté':'chez le mécanicien'}${v.note?' : '+esc(v.note):''}</p>`;
  } else if (start && end) {
    const overlap = vehicleReservations(car).find(r => start<=r.end && r.start<=end);
    if (overlap) {
      window._mrAvailable = false;
      msgEl.innerHTML = `<p style="color:var(--red);font-size:.82rem;font-weight:600">❌ Indisponible — déjà réservé du ${overlap.start} au ${overlap.end}</p>`;
    } else {
      msgEl.innerHTML = `<p style="color:var(--green);font-size:.82rem;font-weight:600">✅ Disponible pour ces dates</p>`;
    }
  } else {
    msgEl.innerHTML = '';
  }
  if (v && +v.price && start && end) {
    const days = Math.max(1, Math.round((new Date(end)-new Date(start))/86400000));
    document.getElementById('mr_total').value = days * (+v.price);
    _mrSyncPaid();
  }
  if (v) {
    const d = start ? new Date(start) : new Date();
    calEl.innerHTML = miniCalendarHtml(car, d.getFullYear(), d.getMonth());
  } else calEl.innerHTML = '';
}

function miniCalendarHtml(car, year, month) {
  const resv = vehicleReservations(car);
  const isReserved = ds => resv.some(r => r.start<=ds && ds<=r.end);
  const first = new Date(year, month, 1);
  const startDow = (first.getDay()+6)%7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  let cells = '';
  for (let i=0;i<startDow;i++) cells += '<div></div>';
  for (let d=1; d<=daysInMonth; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const bg = isReserved(ds) ? 'rgba(230,57,70,.35)' : 'rgba(46,204,113,.25)';
    cells += `<div style="background:${bg};border-radius:6px;padding:6px 0;text-align:center;font-size:.7rem">${d}</div>`;
  }
  return `<div style="font-size:.72rem;color:var(--muted);margin:8px 0 4px">${MONTHS_FR[month]} ${year}</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${cells}</div>`;
}

function submitManualReservation() {
  const v = id => document.getElementById(id).value.trim();
  const name = v('mr_name'), phone = v('mr_phone'), email = v('mr_email'), car = v('mr_car'), city = v('mr_city');
  const start = v('mr_start'), end = v('mr_end');
  const total = +v('mr_total') || 0;
  const payType = v('mr_paytype');
  const amountPaid = payType === 'full' ? total : payType === 'none' ? 0 : (+v('mr_paid') || 0);
  if (!name || !phone || !car || !city || !start || !end) { toast('⚠️ Remplissez les champs obligatoires'); return; }
  if (window._mrAvailable === false) { toast('❌ Véhicule indisponible pour ces dates'); return; }
  const hasCaution = document.getElementById('mr_hasCaution').checked;
  const caution = hasCaution ? (+v('mr_caution')||0) : 0;
  const days = Math.max(1, Math.round((new Date(end)-new Date(start))/86400000));
  const vehicle = getVehicles().find(x=>x.name===car);
  const all = getRes();
  all.unshift({ id: Date.now(), car, carPrice: days?Math.round(total/days):(+vehicle?.price||total),
    name, phone, email, city, start, end, days, total, status:'confirmed',
    createdAt: new Date().toISOString(), source:'manual', amountPaid, hasCaution, caution });
  saveRes(all);
  closeModal();
  toast('✅ Réservation manuelle ajoutée');
  renderCurrent();
  renderNotifBadge();
}

/* ── VEHICLES ── */
const VSTATUS = {
  available:   { label:'Disponible',   icon:'🟢', cls:'confirmed' },
  reserved:    { label:'Réservé',      icon:'🔵', cls:'completed' },
  maintenance: { label:'Chez le mécanicien', icon:'🛠️', cls:'pending' },
  accident:    { label:'Accidenté',    icon:'🚨', cls:'cancelled' },
};
function getVehicles() { return JSON.parse(localStorage.getItem('md_vehicles')||'[]'); }
function saveVehicles(v) { localStorage.setItem('md_vehicles', JSON.stringify(v)); }

function vehicleReservations(name) {
  return getRes().filter(r => r.car===name && r.status!=='cancelled' && r.start && r.end)
    .sort((a,b)=> new Date(a.start) - new Date(b.start));
}
function vehicleSchedule(name) {
  const today = new Date().toISOString().slice(0,10);
  const resv = vehicleReservations(name);
  return { current: resv.find(r => r.start<=today && today<=r.end), next: resv.find(r => r.start>today) };
}

function renderVehicles() {
  const vehicles = getVehicles();
  document.getElementById('vehCount').textContent = `${vehicles.length} véhicule(s)`;
  const counts = { available:0, reserved:0, maintenance:0, accident:0 };
  vehicles.forEach(v=>{
    const eff = (v.status==='available') ? (vehicleSchedule(v.name).current ? 'reserved' : 'available') : v.status;
    counts[eff] = (counts[eff]||0)+1;
  });
  document.getElementById('vehKpi').innerHTML = `
    <div class="kpi c-green"><div class="kpi-val">${counts.available}</div><div class="kpi-label">🟢 Disponibles</div></div>
    <div class="kpi c-blue"><div class="kpi-val">${counts.reserved}</div><div class="kpi-label">🔵 Réservés</div></div>
    <div class="kpi c-yellow"><div class="kpi-val">${counts.maintenance}</div><div class="kpi-label">🛠️ Chez le mécanicien</div></div>
    <div class="kpi c-red"><div class="kpi-val">${counts.accident}</div><div class="kpi-label">🚨 Accidentés</div></div>`;

  document.getElementById('vehGrid').innerHTML = vehicles.length ? vehicles.map(v=>{
    const sched = vehicleSchedule(v.name);
    let status = v.status, sub = '';
    if (status==='available') {
      if (sched.current) { status='reserved'; sub = `🔓 Retour le ${sched.current.end}`; }
      else if (sched.next) { sub = `Prochaine réservation: ${sched.next.start}`; }
      else { sub = 'Aucune réservation prévue'; }
    } else if (status==='maintenance' || status==='accident') {
      sub = v.note ? esc(v.note) : (status==='accident' ? 'En réparation' : 'Entretien en cours');
    }
    const st = VSTATUS[status];
    const img = (v.images&&v.images[0]) ? `<img src="${v.images[0]}" style="width:100%;height:130px;object-fit:cover;border-radius:10px;margin-bottom:10px"/>` : '';
    const ins = echDateInfo(v.insurance), vis = echDateInfo(v.visit), vid = vidangeInfo(v);
    const vidColor = vid.due ? 'var(--red)' : vid.remaining<=1000 ? 'var(--yellow)' : 'var(--green)';
    const alertCard = ins.warn || vis.warn || vid.due || vid.remaining<=1000;
    const infoRow = (icon,label,val,color)=>`<div style="display:flex;justify-content:space-between;gap:8px"><span style="color:var(--muted)">${icon} ${label}</span><span style="color:${color};font-weight:600;text-align:right">${val}</span></div>`;
    return `<div class="crm-card"${alertCard?' style="border:1px solid var(--yellow)"':''}>
      ${img}
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-weight:700">🚗 ${esc(v.name)}</div>
          <div style="color:var(--muted);font-size:.78rem">${esc(v.plate||'—')}${v.price?` · ${esc(v.price)} MAD/j`:''}</div>
        </div>
        <span class="badge badge-${st.cls}">${st.icon} ${st.label}</span>
      </div>
      <div style="margin-top:10px;font-size:.82rem;color:var(--muted)">${sub}</div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:5px;font-size:.78rem;border-top:1px solid rgba(255,255,255,.08);padding-top:10px">
        ${ins.has ? infoRow('🛡️','Assurance',`${fmt(ins.date)} · ${ins.txt}`, ins.color) : infoRow('🛡️','Assurance','—','var(--muted)')}
        ${vis.has ? infoRow('🔧','Visite tech.',`${fmt(vis.date)} · ${vis.txt}`, vis.color) : infoRow('🔧','Visite tech.','—','var(--muted)')}
        ${infoRow('🛢️','Vidange', vid.due?`dépassée de ${Math.abs(vid.remaining)} km`:`${vid.remaining} km restants`, vidColor)}
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="crm-btn-sm" onclick="openVehicleCalendar(${v.id})">📅 Calendrier</button>
        <button class="crm-btn-sm" onclick="openBlockModal(${v.id})">⛔ Réserver</button>
        <button class="crm-btn-sm" onclick="openVehicleModal(${v.id})">✏️ Modifier</button>
        <button class="crm-btn-sm" onclick="deleteVehicle(${v.id})">🗑️</button>
      </div>
    </div>`;
  }).join('') : '<div class="crm-empty"><span class="crm-empty-icon">🚙</span>Aucun véhicule.</div>';
  renderNotifBadge();
}

const VFIELDS = [
  ['name','Nom du véhicule','text','Ex: Dacia Logan'], ['plate','Plaque','text','Ex: 12345-A-6'],
  ['brand','Marque','text','Ex: Dacia'], ['model','Modèle','text','Ex: Logan'], ['year','Année','text','Ex: 2022'],
  ['color','Couleur','text','Ex: Blanc'], ['fuel','Carburant','text','Essence / Diesel'], ['gearbox','Boîte','text','Manuelle / Automatique'],
  ['price','Prix/jour (MAD)','number','Ex: 300'], ['mileage','Kilométrage actuel','number','Ex: 45000'],
  ['lastVidangeKm','Dernière vidange (km)','number','Ex: 40000'], ['vidangeInterval','Intervalle vidange (km)','number','Ex: 10000'],
  ['insurance','Assurance — échéance','date',''], ['visit','Visite technique — échéance','date',''],
];

function openVehicleModal(id) {
  const v = id ? getVehicles().find(x=>x.id===id) : null;
  window._vehImagesTemp = v && v.images ? [...v.images] : [];
  document.getElementById('modalContent').innerHTML = `
    <div style="font-weight:700;font-size:1.05rem;margin-bottom:16px;display:flex;justify-content:space-between">🚗 ${v?'Modifier':'Ajouter'} un véhicule
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem">✕</button>
    </div>
    ${VFIELDS.map(([key,label,type,ph])=>`
      <div class="crm-fg"><label>${label}</label><input id="vh_${key}" type="${type}" value="${v?esc(v[key]||''):''}" placeholder="${ph}"/></div>
    `).join('')}
    <div class="crm-fg">
      <label>Photos du véhicule</label>
      <input id="vh_images" type="file" accept="image/*" multiple onchange="onVehicleImagesChange(event)"/>
      <div id="vh_imgPreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        ${(v&&v.images||[]).map((img,i)=>`<div style="position:relative"><img src="${img}" style="width:60px;height:60px;object-fit:cover;border-radius:8px"/>
          <button type="button" onclick="removeVehicleImage(${i})" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--red);color:#fff;border:none;font-size:.6rem;cursor:pointer">✕</button></div>`).join('')}
      </div>
    </div>
    <div class="crm-fg"><label>Statut</label>
      <select id="vh_status">${Object.entries(VSTATUS).map(([k,s])=>`<option value="${k}" ${v&&v.status===k?'selected':''}>${s.icon} ${s.label}</option>`).join('')}</select>
    </div>
    <div class="crm-fg"><label>Note (accident / mécanique)</label><input id="vh_note" type="text" value="${v?esc(v.note||''):''}" placeholder="Ex: Pare-choc endommagé"/></div>
    <button class="crm-btn" style="width:100%" onclick="saveVehicle(${v?v.id:'null'})">💾 Enregistrer</button>`;
  document.getElementById('crmOverlay').classList.add('open');
}
function onVehicleImagesChange(e) {
  const files = Array.from(e.target.files||[]);
  let remaining = files.length; if (!remaining) return;
  files.forEach(f=>{
    const reader = new FileReader();
    reader.onload = ev => { window._vehImagesTemp.push(ev.target.result); if (--remaining===0) renderVehImgPreview(); };
    reader.readAsDataURL(f);
  });
}
function removeVehicleImage(i) { window._vehImagesTemp.splice(i,1); renderVehImgPreview(); }
function renderVehImgPreview() {
  document.getElementById('vh_imgPreview').innerHTML = window._vehImagesTemp.map((img,i)=>`<div style="position:relative"><img src="${img}" style="width:60px;height:60px;object-fit:cover;border-radius:8px"/>
    <button type="button" onclick="removeVehicleImage(${i})" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--red);color:#fff;border:none;font-size:.6rem;cursor:pointer">✕</button></div>`).join('');
}
function saveVehicle(id) {
  const data = {};
  VFIELDS.forEach(([key])=> data[key] = document.getElementById('vh_'+key).value.trim());
  data.status = document.getElementById('vh_status').value;
  data.note = document.getElementById('vh_note').value.trim();
  data.images = window._vehImagesTemp || [];
  if (!data.name) { toast('⚠️ Nom du véhicule requis'); return; }
  const list = getVehicles();
  if (id) saveVehicles(list.map(v=>v.id===id?{...v,...data}:v));
  else { list.unshift({ id: Date.now(), ...data }); saveVehicles(list); }
  closeModal(); renderVehicles(); checkVidangeAlerts(); checkEcheanceAlerts();
  toast('✅ Véhicule enregistré');
}
function deleteVehicle(id) {
  if (!confirm('Supprimer ce véhicule ?')) return;
  saveVehicles(getVehicles().filter(v=>v.id!==id));
  renderVehicles();
}
function openBlockModal(id) {
  const v = getVehicles().find(x=>x.id===id); if (!v) return;
  document.getElementById('modalContent').innerHTML = `
    <div style="font-weight:700;font-size:1.05rem;margin-bottom:16px;display:flex;justify-content:space-between">⛔ Réserver — ${esc(v.name)}
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem">✕</button>
    </div>
    <div class="crm-fg"><label>Du</label><input id="bk_start" type="date"/></div>
    <div class="crm-fg"><label>Au</label><input id="bk_end" type="date"/></div>
    <div class="crm-fg"><label>Client (optionnel)</label><input id="bk_name" type="text" placeholder="Ex: Réservation interne"/></div>
    <button class="crm-btn" style="width:100%" onclick="saveBlock(${id})">💾 Bloquer ces dates</button>`;
  document.getElementById('crmOverlay').classList.add('open');
}
function saveBlock(id) {
  const v = getVehicles().find(x=>x.id===id);
  const start = document.getElementById('bk_start').value, end = document.getElementById('bk_end').value;
  const name = document.getElementById('bk_name').value.trim() || 'Réservation interne';
  if (!start || !end || end<start) { toast('⚠️ Choisissez des dates valides'); return; }
  const days = Math.max(1, Math.round((new Date(end)-new Date(start))/86400000));
  const all = getRes();
  all.unshift({ id: Date.now(), car: v.name, carPrice: +v.price||0, name, phone:'', email:'', city:'', start, end, days,
    total:(+v.price||0)*days, status:'confirmed', createdAt: new Date().toISOString(), amountPaid:0, source:'manual' });
  saveRes(all);
  closeModal(); renderVehicles();
  toast('✅ Véhicule réservé pour ces dates');
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
function openVehicleCalendar(id, year, month) {
  const today = new Date();
  if (year==null) year = today.getFullYear();
  if (month==null) month = today.getMonth();
  const v = getVehicles().find(x=>x.id===id); if (!v) return;
  const resv = vehicleReservations(v.name);
  const isReserved = ds => resv.some(r => r.start<=ds && ds<=r.end);
  const first = new Date(year, month, 1);
  const startDow = (first.getDay()+6)%7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayStr = today.toISOString().slice(0,10);
  let cells = '';
  for (let i=0;i<startDow;i++) cells += '<div></div>';
  for (let d=1; d<=daysInMonth; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const bg = isReserved(ds) ? 'rgba(230,57,70,.35)' : 'rgba(46,204,113,.25)';
    const border = ds===todayStr ? '2px solid var(--yellow)' : '1px solid transparent';
    cells += `<div style="background:${bg};border:${border};border-radius:8px;padding:10px 0;text-align:center;font-weight:600;font-size:.85rem">${d}</div>`;
  }
  document.getElementById('modalContent').innerHTML = `
    <div style="font-weight:700;font-size:1.05rem;margin-bottom:14px;display:flex;justify-content:space-between">📅 Calendrier — ${esc(v.name)}
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem">✕</button>
    </div>
    <div style="display:flex;gap:14px;font-size:.8rem;margin-bottom:14px;color:var(--muted)">
      <span>🟢 Disponible</span><span>🔴 Réservé</span><span>🟡 Aujourd'hui</span>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <button class="crm-btn-sm" onclick="openVehicleCalendar(${id},${month===0?year-1:year},${month===0?11:month-1})">‹</button>
      <strong>${MONTHS_FR[month]} ${year}</strong>
      <button class="crm-btn-sm" onclick="openVehicleCalendar(${id},${month===11?year+1:year},${month===11?0:month+1})">›</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;font-size:.72rem;color:var(--muted);text-align:center;margin-bottom:6px">
      <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">${cells}</div>`;
  document.getElementById('crmOverlay').classList.add('open');
}

/* ── VIDANGE ── */
function vidangeInfo(v) {
  const mileage = +v.mileage || 0, last = +v.lastVidangeKm || 0, interval = +v.vidangeInterval || 10000;
  const next = last + interval, remaining = next - mileage;
  return { mileage, last, interval, next, remaining, due: remaining <= 0 };
}
function renderVidange() {
  const vehicles = getVehicles();
  const due = vehicles.filter(v=>vidangeInfo(v).due).length;
  const soon = vehicles.filter(v=>{ const i=vidangeInfo(v); return !i.due && i.remaining<=1000; }).length;
  document.getElementById('vidKpi').innerHTML = `
    <div class="kpi c-red"><div class="kpi-val">${due}</div><div class="kpi-label">🚨 Vidange dépassée</div></div>
    <div class="kpi c-yellow"><div class="kpi-val">${soon}</div><div class="kpi-label">⚠️ Vidange proche (≤1000km)</div></div>
    <div class="kpi c-green"><div class="kpi-val">${vehicles.length-due-soon}</div><div class="kpi-label">🟢 OK</div></div>`;
  document.getElementById('vidGrid').innerHTML = vehicles.length ? vehicles.map(v=>{
    const i = vidangeInfo(v);
    const cls = i.due ? 'cancelled' : (i.remaining<=1000 ? 'pending' : 'confirmed');
    const label = i.due ? `🚨 Vidange dépassée de ${Math.abs(i.remaining)} km` : `${i.remaining} km restants`;
    return `<div class="crm-card">
      <div style="font-weight:700">🚗 ${esc(v.name)}</div>
      <div style="color:var(--muted);font-size:.78rem;margin-bottom:8px">${esc(v.plate||'—')}</div>
      <div class="crm-row"><span>Kilométrage actuel</span><span>${i.mileage} km</span></div>
      <div class="crm-row"><span>Dernière vidange</span><span>${i.last} km</span></div>
      <div class="crm-row"><span>Intervalle</span><span>${i.interval} km</span></div>
      <div class="crm-row"><span>Prochaine vidange</span><span>${i.next} km</span></div>
      <span class="badge badge-${cls}" style="margin-top:8px;display:inline-block">${label}</span>
      <button class="crm-btn-sm" style="margin-top:10px;width:100%" onclick="toggleVidangeEdit(${v.id})">✏️ Modifier</button>
      <div id="vid_edit_${v.id}"></div>
    </div>`;
  }).join('') : '<div class="crm-empty"><span class="crm-empty-icon">🛢️</span>Aucun véhicule. Ajoutez des véhicules dans la section Véhicules.</div>';
}
function toggleVidangeEdit(id) {
  const v = getVehicles().find(x=>x.id===id); if (!v) return;
  const wrap = document.getElementById('vid_edit_'+id);
  if (wrap.innerHTML) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `
    <div class="crm-fg" style="margin-top:10px"><label>Kilométrage actuel</label><input id="vid_mileage_${id}" type="number" min="0" value="${v.mileage||0}"/></div>
    <div class="crm-fg"><label>Dernière vidange (km)</label><input id="vid_last_${id}" type="number" min="0" value="${v.lastVidangeKm||0}"/></div>
    <div class="crm-fg"><label>Intervalle vidange (km)</label><input id="vid_int_${id}" type="number" min="0" value="${v.vidangeInterval||10000}"/></div>
    <button class="crm-btn" style="width:100%" onclick="saveVidangeEdit(${id})">💾 Enregistrer</button>`;
}
function saveVidangeEdit(id) {
  const mileage = +document.getElementById('vid_mileage_'+id).value || 0;
  const lastVidangeKm = +document.getElementById('vid_last_'+id).value || 0;
  const vidangeInterval = +document.getElementById('vid_int_'+id).value || 10000;
  saveVehicles(getVehicles().map(v=>v.id===id?{...v,mileage,lastVidangeKm,vidangeInterval}:v));
  renderVidange(); checkVidangeAlerts();
  toast('✅ Vidange mise à jour');
}
function checkVidangeAlerts() {
  let seen = JSON.parse(localStorage.getItem('md_vidange_alerted')||'[]');
  const vehicles = getVehicles();
  seen = seen.filter(id => vehicles.some(v=>v.id===id && vidangeInfo(v).due));
  vehicles.forEach(v=>{
    const i = vidangeInfo(v);
    if (i.due && !seen.includes(v.id)) {
      toast(`🛢️ ${v.name} : vidange à faire (dépassée de ${Math.abs(i.remaining)} km)`);
      seen.push(v.id);
    }
  });
  localStorage.setItem('md_vidange_alerted', JSON.stringify(seen));
}

/* ── ÉCHÉANCES : Assurance & Visite technique ── */
const ECH_THRESHOLD = 10; // jours avant échéance
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr); if (isNaN(d)) return null;
  const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}
function echLabelTxt(a) {
  if (a.vidange) return a.expired ? `vidange dépassée de ${Math.abs(a.remaining)} km` : `vidange dans ${a.remaining} km`;
  return a.expired ? `dépassée depuis ${Math.abs(a.days)}j`
       : a.days === 0 ? `expire aujourd'hui` : `dans ${a.days}j`;
}
function echDateInfo(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return { has:false };
  const expired = days < 0, warn = days <= ECH_THRESHOLD;
  return {
    has:true, days, expired, warn, date:dateStr,
    txt: expired ? `dépassée (${Math.abs(days)}j)` : days === 0 ? `aujourd'hui ⚠️` : `${days}j restants${warn?' ⚠️':''}`,
    color: expired ? 'var(--red)' : warn ? 'var(--yellow)' : 'var(--green)'
  };
}
function echeanceAlerts() {
  const out = [];
  getVehicles().forEach(v => {
    [['insurance','Assurance','🛡️'], ['visit','Visite technique','🔧']].forEach(([key,label,icon]) => {
      const days = daysUntil(v[key]);
      if (days === null || days > ECH_THRESHOLD) return;
      out.push({ id:v.id, name:v.name, plate:v.plate, key, label, icon, date:v[key], days, expired: days < 0 });
    });
    // Vidange (basée sur les km, pas une date) : alerte si dépassée ou proche (<=1000 km)
    const vi = vidangeInfo(v);
    if (vi.due || vi.remaining <= 1000) {
      out.push({ id:v.id, name:v.name, plate:v.plate, key:'vidange', label:'Vidange', icon:'🛢️',
        vidange:true, remaining:vi.remaining, expired:vi.due, days: vi.due ? -1 : 2 });
    }
  });
  return out.sort((a,b)=> a.days - b.days);
}
function renderEcheances() {
  const wrap = document.getElementById('dashEcheances');
  const card = document.getElementById('dashEcheancesCard');
  if (!wrap) return;
  const alerts = echeanceAlerts();
  if (!alerts.length) { if (card) card.style.display = 'none'; return; }
  if (card) card.style.display = '';
  wrap.innerHTML = alerts.map(a => {
    const cls = a.expired ? 'cancelled' : (a.days <= 3 ? 'pending' : 'completed');
    const subline = a.vidange ? `${esc(a.plate||'—')} · entretien moteur` : `${esc(a.plate||'—')} · échéance ${fmt(a.date)}`;
    return `<div class="act-item">
      <div class="act-info">
        <div class="act-name">${a.icon} ${esc(a.name)} — ${a.label}</div>
        <div class="act-sub">${subline}</div>
      </div>
      <div class="act-right" style="display:flex;align-items:center;gap:8px">
        <span class="badge badge-${cls}">${echLabelTxt(a)}</span>
        <button class="crm-btn-sm" onclick="echeanceWA(${a.id},'${a.key}')">📲</button>
      </div>
    </div>`;
  }).join('');
}
function echeanceWA(id, key) {
  const v = getVehicles().find(x => x.id == id); if (!v) return;
  if (key === 'vidange') {
    const vi = vidangeInfo(v);
    const txt = vi.due ? `dépassée de ${Math.abs(vi.remaining)} km` : `dans ${vi.remaining} km`;
    const msg = `🚗 Rappel Vidange\nVéhicule: ${v.name} (${v.plate||'—'})\nVidange ${txt}.`;
    window.open(`https://wa.me/${WA_CRM}?text=${encodeURIComponent(msg)}`, '_blank');
    return;
  }
  const label = key === 'insurance' ? 'Assurance' : 'Visite technique';
  const days = daysUntil(v[key]);
  const msg = `🚗 Rappel ${label}\nVéhicule: ${v.name} (${v.plate||'—'})\nÉchéance: ${fmt(v[key])} — ${echLabelTxt({days, expired: days<0})}.`;
  window.open(`https://wa.me/${WA_CRM}?text=${encodeURIComponent(msg)}`, '_blank');
}
function checkEcheanceAlerts() {
  const today = new Date().toISOString().slice(0,10);
  let seen = JSON.parse(localStorage.getItem('md_ech_alerted') || '{}');
  if (seen._day !== today) seen = { _day: today }; // 1 alerte / échéance / jour
  echeanceAlerts().forEach(a => {
    const k = a.id + '_' + a.key;
    if (seen[k]) return;
    toast(`${a.icon} ${a.name} : ${a.label} ${echLabelTxt(a)}`);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`${a.icon} ${a.label} à renouveler`, { body: `${a.name} (${a.plate||'—'}) — ${echLabelTxt(a)}` });
    }
    seen[k] = 1;
  });
  localStorage.setItem('md_ech_alerted', JSON.stringify(seen));
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
