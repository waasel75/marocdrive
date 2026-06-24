'use strict';

const WA    = '212634829085';

const STATUS = {
  pending:         { label:'En attente',       color:'var(--yellow)', icon:'⏳' },
  payment_pending: { label:'Paiement en cours',color:'#f97316',       icon:'💳' },
  confirmed:       { label:'Confirmé',         color:'var(--green)',  icon:'✅' },
  completed:       { label:'Terminé',          color:'var(--blue)',   icon:'🏁' },
  cancelled:       { label:'Annulé',           color:'var(--red)',    icon:'❌' },
};

/* ===== BRANDING ===== */
function applyAdminBranding() {
  const cfg = JSON.parse(localStorage.getItem('md_site_settings') || '{}');
  const name = cfg.name || 'Chakroun Cars';
  const customLogo = (cfg.logo || '').trim();
  const isImg = /^(https?:|data:)/.test(customLogo) || /\.(png|jpe?g|svg|webp|gif)$/i.test(customLogo);
  // Default brand = the site logo image (its wordmark already includes the name).
  // A custom image logo replaces it; a custom emoji/text logo keeps the name beside it.
  let brand;
  if (!customLogo || isImg) {
    const src = isImg ? customLogo : 'images/logo.png';
    brand = `<img src="${src}" alt="${esc(name)}" style="height:30px;width:auto;vertical-align:middle;object-fit:contain"/>`;
  } else {
    const words = name.trim().split(' ');
    const last = words.pop();
    const nameHtml = (words.length ? esc(words.join(' ')) + ' ' : '') + `<strong>${esc(last)}</strong>`;
    brand = `${customLogo} ${nameHtml}`;
  }
  const loginLogo = document.getElementById('brandLoginLogo');
  if (loginLogo) loginLogo.innerHTML = `${brand} <span>Admin</span>`;
  const sbLogo = document.getElementById('brandSbLogo');
  if (sbLogo) sbLogo.innerHTML = brand;
  if (document.title.includes('Chakroun Cars')) document.title = document.title.replace(/Chakroun Cars/g, name);
}
applyAdminBranding();

/* ===== AUTH ===== */
function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const res = authCheckLogin(u, p);
  if (res.ok) {
    sessionStorage.setItem('md_admin','1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    init();
  } else if (res.locked) {
    document.getElementById('loginErr').textContent = `🔒 Trop de tentatives. Réessayez dans ${res.locked}s.`;
  } else {
    document.getElementById('loginErr').textContent = '❌ Identifiant ou mot de passe incorrect.';
  }
}

function doLogout() {
  sessionStorage.removeItem('md_admin');
  location.reload();
}

/* ===== FORGOT PASSWORD ===== */
function openForgot() {
  document.querySelector('.login-box').style.display = 'none';
  document.getElementById('forgotBox').style.display = 'block';
  document.getElementById('forgotStep1').style.display = 'block';
  document.getElementById('forgotStep2').style.display = 'none';
  document.getElementById('forgotErr').textContent = '';
  document.getElementById('forgotQuestionText').textContent = authHasQuestion()
    ? authQuestion()
    : 'Aucune question de sécurité configurée. Contactez un autre administrateur ou configurez-la depuis Paramètres > Sécurité.';
}
function closeForgot() {
  document.getElementById('forgotBox').style.display = 'none';
  document.querySelector('.login-box').style.display = 'block';
}
function checkForgotAnswer() {
  if (!authHasQuestion()) { document.getElementById('forgotErr').textContent = '❌ Pas de question configurée.'; return; }
  if (authCheckAnswer(document.getElementById('forgotAnswer').value)) {
    document.getElementById('forgotStep1').style.display = 'none';
    document.getElementById('forgotStep2').style.display = 'block';
    document.getElementById('forgotErr').textContent = '';
  } else {
    document.getElementById('forgotErr').textContent = '❌ Réponse incorrecte.';
  }
}
function submitForgotReset() {
  const u = document.getElementById('forgotNewUser').value.trim();
  const p = document.getElementById('forgotNewPass').value;
  if (!u || !p) { document.getElementById('forgotErr').textContent = '⚠️ Remplissez les deux champs.'; return; }
  authResetCreds(u, p);
  alert('✅ Identifiants réinitialisés. Connectez-vous avec vos nouveaux identifiants.');
  closeForgot();
}

function togglePass() {
  const i = document.getElementById('loginPass');
  i.type = i.type === 'password' ? 'text' : 'password';
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sb.classList.toggle('open');
    document.getElementById('sidebarBackdrop')?.classList.toggle('show', sb.classList.contains('open'));
  } else {
    sb.classList.toggle('collapsed');
  }
}

/* ===== DB ===== */
const PAGE_SOURCE = typeof window.PAGE_SOURCE !== 'undefined' ? window.PAGE_SOURCE : 'all';

function getAll() {
  const all = JSON.parse(localStorage.getItem('md_reservations')||'[]').map(r => ({ source:'web', amountPaid:0, ...r }));
  return PAGE_SOURCE === 'all' ? all : all.filter(r => r.source === PAGE_SOURCE);
}
function saveAll(data) {
  const all = JSON.parse(localStorage.getItem('md_reservations')||'[]');
  const merged = PAGE_SOURCE === 'all'
    ? data
    : all.filter(r => (r.source||'web') !== PAGE_SOURCE).concat(data);
  localStorage.setItem('md_reservations', JSON.stringify(merged));
  renderNotif();
}

/* ===== PAYMENT ===== */
function paymentInfo(r) {
  const total  = +r.total || 0;
  const paid   = Math.min(+r.amountPaid || 0, total);
  const due    = Math.max(total - paid, 0);
  return { total, paid, due, full: due <= 0 && total > 0 };
}
function paymentBadge(r) {
  const p = paymentInfo(r);
  if (p.total <= 0) return '';
  return p.full
    ? `<span class="badge" style="background:rgba(34,197,94,.15);color:var(--green)">✅ Payé complet</span>`
    : `<span class="badge" style="background:rgba(249,115,22,.15);color:#f97316">💳 Avance — reste ${fmtN(p.due)} MAD</span>`;
}
function sourceBadge(r) {
  return r.source === 'manual'
    ? `<span class="badge" style="background:rgba(96,165,250,.15);color:#60a5fa">📞 Manuel</span>`
    : `<span class="badge" style="background:rgba(230,51,41,.15);color:var(--red)">🌐 Site web</span>`;
}

function setPayment(id, amountPaid) {
  saveAll(getAll().map(r => r.id==id ? {...r, amountPaid: Math.max(0, +amountPaid||0)} : r));
  toast('💰 Paiement mis à jour');
  renderTable(); renderDashboard();
}

function addPayment(id, extra) {
  extra = +extra || 0;
  if (extra <= 0) { toast('⚠️ Montant invalide'); return; }
  const r = getAll().find(r=>r.id==id);
  if (!r) return;
  const p = paymentInfo(r);
  const newPaid = Math.min(p.paid + extra, p.total);
  setPayment(id, newPaid);
  showDetail(id);
}

function updateStatus(id, status) {
  saveAll(getAll().map(r => r.id==id ? {...r, status} : r));
  toast(`${STATUS[status].icon} Statut mis à jour : ${statusLabel(status)}`);
  renderTable(); renderDashboard();
}

function deleteRes(id) {
  if (!confirm('Supprimer cette réservation ?')) return;
  saveAll(getAll().filter(r => r.id!=id));
  toast('🗑️ Réservation supprimée');
  renderTable(); renderDashboard(); closeDetail();
}

function clearAll() {
  if (!confirm('Vider TOUTES les réservations ? Action irréversible.')) return;
  localStorage.removeItem('md_reservations');
  toast('🗑️ Toutes les réservations supprimées');
  renderTable(); renderDashboard();
}

/* ===== SECURITY: HTML-escape any visitor-supplied text before inserting via innerHTML ===== */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ===== UTILS ===== */
const fmt  = d => new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
const fmtN = n => Number(n).toLocaleString('fr-FR');
const initials = name => name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';

function statusLabel(k) { return (typeof T==='function' ? T('st-'+k) : null) || STATUS[k]?.label || k; }

function badge(s) {
  return `<span class="badge badge-${s}">${statusLabel(s)}</span>`;
}

function statusOptions(cur) {
  return Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${cur===k?'selected':''}>${v.icon} ${statusLabel(k)}</option>`).join('');
}

/* ===== TOAST ===== */
let _toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ===== NOTIF ===== */
function renderNotif() {
  const all = getAll();
  const n = all.filter(r=>r.status==='pending'||r.status==='payment_pending').length;
  const el = document.getElementById('notifBadge');
  if (!el) return;
  if (n) { el.textContent = n+' en attente'; el.style.display='block'; }
  else   { el.style.display='none'; }
}

/* ===== REAL-TIME NEW RESERVATION ALERT ===== */
let _lastResIds = new Set();
let _notifs     = []; // persists until dismissed

function _initBaseline() {
  getAll().forEach(r => _lastResIds.add(String(r.id)));
}

function checkNewReservations() {
  const all = getAll();
  const newOnes = all.filter(r => !_lastResIds.has(String(r.id)));
  newOnes.forEach(r => {
    _lastResIds.add(String(r.id));
    _addNotif(r);
  });
  if (newOnes.length) { renderDashboard(); renderTable(); }
}

function _addNotif(r) {
  _notifs.push({ id: r.id, name: r.name, car: r.car, total: r.total, city: r.city || '', ts: Date.now() });
  _renderBell();
  if (Notification?.permission === 'granted') {
    const agencyName = (JSON.parse(localStorage.getItem('md_site_settings') || '{}').name) || 'Chakroun Cars';
    new Notification(`🔔 Nouvelle réservation — ${agencyName}`, {
      body: `${r.name} · ${r.car} · ${fmtN(r.total)} MAD`
    });
  }
}

function _renderBell() {
  const wrap = document.getElementById('bellWrap');
  const count = document.getElementById('bellCount');
  const list  = document.getElementById('notifPanelList');
  if (!wrap) return;
  if (!_notifs.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  count.textContent  = _notifs.length;
  list.innerHTML = _notifs.map((n, i) => `
    <div class="notif-item">
      <div class="notif-item-icon">🔔</div>
      <div class="notif-item-body">
        <div class="notif-item-title">Nouvelle réservation #${n.id}</div>
        <div class="notif-item-sub">${esc(n.name)} · ${esc(n.car)} · ${fmtN(n.total)} MAD</div>
      </div>
      <button class="notif-item-close" onclick="dismissNotif(${i})">✕</button>
    </div>
  `).join('');
}

function toggleNotifPanel() {
  document.getElementById('notifPanel').classList.toggle('open');
}

function dismissNotif(i) {
  _notifs.splice(i, 1);
  _renderBell();
  if (!_notifs.length) document.getElementById('notifPanel').classList.remove('open');
}

function dismissAllNotifs() {
  _notifs = [];
  _renderBell();
  document.getElementById('notifPanel').classList.remove('open');
}

// close panel when clicking outside
document.addEventListener('click', e => {
  const wrap = document.getElementById('bellWrap');
  if (wrap && !wrap.contains(e.target)) document.getElementById('notifPanel')?.classList.remove('open');
});

function startRealtimeSync() {
  if (!window.SB_READY) return;
  setInterval(async () => {
    try {
      const data = await window.sbGetKV('md_reservations');
      if (!Array.isArray(data)) return;
      const cur = JSON.parse(localStorage.getItem('md_reservations')||'[]');
      if (JSON.stringify(data) !== JSON.stringify(cur)) {
        localStorage.setItem('md_reservations', JSON.stringify(data));
        checkNewReservations();
      }
    } catch(e) {}
  }, 30000);
}

function requestNotifPermission() {
  if (Notification?.permission === 'default') Notification.requestPermission();
}

/* ===== DASHBOARD ===== */
function renderDashboard() {
  const all = getAll();
  const total     = all.length;
  const pending         = all.filter(r=>r.status==='pending').length;
  const payment_pending = all.filter(r=>r.status==='payment_pending').length;
  const confirmed       = all.filter(r=>r.status==='confirmed').length;
  const cancelled       = all.filter(r=>r.status==='cancelled').length;
  const revenue         = all.filter(r=>r.status==='completed').reduce((s,r)=>s+ +r.total,0);
  const webCount        = all.filter(r=>r.source==='web').length;
  const manualCount     = all.filter(r=>r.source==='manual').length;
  const unpaidDue       = all.reduce((s,r)=>s+paymentInfo(r).due,0);

  // KPI
  document.getElementById('kpiGrid').innerHTML = `
    ${PAGE_SOURCE==='all'?`
    <div class="kpi-card c-blue">
      <div class="kpi-icon">🔀</div>
      <div class="kpi-val" style="font-size:1.3rem">🌐 ${webCount} · 📞 ${manualCount}</div>
      <div class="kpi-label">Web vs Manuel</div>
      <div class="kpi-sub up">Vue combinée</div>
    </div>`:''}
    <div class="kpi-card c-yellow">
      <div class="kpi-icon">💳</div>
      <div class="kpi-val" style="font-size:1.4rem;color:#f97316">${fmtN(unpaidDue)}</div>
      <div class="kpi-label">Restant à percevoir (MAD)</div>
      ${unpaidDue?'<div class="kpi-sub warn">Avances en attente</div>':'<div class="kpi-sub up">Tout payé ✓</div>'}
    </div>
    <div class="kpi-card c-red">
      <div class="kpi-icon">📋</div>
      <div class="kpi-val">${total}</div>
      <div class="kpi-label">Total réservations</div>
      ${pending?`<div class="kpi-sub warn">${pending} en attente</div>`:'<div class="kpi-sub up">Tout traité ✓</div>'}
    </div>
    <div class="kpi-card c-green">
      <div class="kpi-icon">💰</div>
      <div class="kpi-val" style="font-size:1.5rem">${fmtN(revenue)}</div>
      <div class="kpi-label">Chiffre d'affaires (MAD)</div>
      <div class="kpi-sub up">Réservations terminées uniquement</div>
    </div>
    <div class="kpi-card c-yellow">
      <div class="kpi-icon">⏳</div>
      <div class="kpi-val" style="color:var(--yellow)">${pending + payment_pending}</div>
      <div class="kpi-label">En attente</div>
      ${payment_pending?`<div class="kpi-sub" style="color:#f97316">💳 ${payment_pending} paiement en cours</div>`:
        pending?`<div class="kpi-sub warn">Action requise</div>`:'<div class="kpi-sub up">Aucune en attente</div>'}
    </div>
    <div class="kpi-card c-blue">
      <div class="kpi-icon">✅</div>
      <div class="kpi-val" style="color:var(--green)">${confirmed}</div>
      <div class="kpi-label">Confirmées</div>
      ${cancelled?`<div class="kpi-sub" style="color:var(--red)">${cancelled} annulée(s)</div>`:'<div class="kpi-sub up">0 annulation</div>'}
    </div>
  `;

  // Recent
  const recent = all.slice(0,6);
  document.getElementById('recentList').innerHTML = recent.length
    ? recent.map(r=>`
      <div class="res-item" onclick="showDetail(${r.id})">
        <div class="res-avatar">${esc(initials(r.name))}</div>
        <div class="res-info">
          <div class="res-name">${esc(r.name)}</div>
          <div class="res-sub">${esc(r.car)} · ${esc(r.city)||'—'}</div>
        </div>
        <div class="res-right">
          <div class="res-amount">${fmtN(r.total)} MAD</div>
          <div class="res-date">${badge(r.status)}</div>
        </div>
      </div>`).join('')
    : '<p style="color:var(--muted);font-size:.82rem;padding:10px 0">Aucune réservation</p>';

  // Pending quick actions
  const pends = all.filter(r=>r.status==='pending').slice(0,5);
  document.getElementById('pendingList').innerHTML = pends.length
    ? pends.map(r=>`
      <div class="pending-item">
        <div class="pending-name">${esc(r.name)}</div>
        <div class="pending-car">🚗 ${esc(r.car)} · ${fmtN(r.total)} MAD</div>
        <div class="pending-btns">
          <button class="p-btn confirm" onclick="updateStatus(${r.id},'confirmed')">✅ Confirmer</button>
          <button class="p-btn cancel"  onclick="updateStatus(${r.id},'cancelled')">❌ Annuler</button>
          <button class="p-btn wa"      onclick="sendWA(${r.id})">📲</button>
        </div>
      </div>`).join('')
    : '<p style="color:var(--muted);font-size:.82rem;padding:10px 0">Aucune en attente ✓</p>';

  // Status bars
  const counts = { pending, confirmed, completed:all.filter(r=>r.status==='completed').length, cancelled };
  document.getElementById('statusBars').innerHTML = Object.entries(STATUS).map(([k,v])=>{
    const n   = counts[k]||0;
    const pct = total ? Math.round(n/total*100) : 0;
    return `<div class="sbar">
      <div class="sbar-val" style="color:${v.color}">${n}</div>
      <div class="sbar-label">${v.label}</div>
      <div class="sbar-track"><div class="sbar-fill" style="width:${pct}%;background:${v.color}"></div></div>
      <div class="sbar-pct">${pct}%</div>
    </div>`;
  }).join('');
}

/* ===== TABLE ===== */
function renderTable() {
  const search = (document.getElementById('searchInput')?.value||'').toLowerCase();
  const status = document.getElementById('filterStatus')?.value||'';
  const sourceF = document.getElementById('filterSource')?.value||'';
  let data = getAll();
  if (search) data = data.filter(r =>
    r.name?.toLowerCase().includes(search)||r.car?.toLowerCase().includes(search)||
    r.city?.toLowerCase().includes(search)||r.phone?.includes(search)
  );
  if (status) data = data.filter(r=>r.status===status);
  if (sourceF) data = data.filter(r=>r.source===sourceF);

  const tbody = document.getElementById('resBody');
  const empty = document.getElementById('emptyState');
  if (!data.length) { tbody.innerHTML=''; empty.style.display='flex'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = data.map((r,i)=>`
    <tr>
      <td style="color:var(--muted);font-size:.72rem">#${String(i+1).padStart(3,'0')}</td>
      <td>
        <div class="td-name">${esc(r.name)}</div>
        <div class="td-phone">${esc(r.phone)}</div>
      </td>
      <td style="font-weight:600">${esc(r.car)}</td>
      <td style="font-size:.78rem;color:var(--muted);max-width:130px">${esc(r.city)||'—'}</td>
      <td style="font-size:.78rem;line-height:1.6">
        📅 ${fmt(r.start)}<br><span style="color:var(--muted)">→ ${fmt(r.end)}</span>
      </td>
      <td style="color:var(--muted)">${r.days}j</td>
      <td class="td-price">${fmtN(r.total)} <span style="color:var(--red);font-size:.7rem">MAD</span></td>
      ${PAGE_SOURCE==='all'?`<td>${sourceBadge(r)}</td>`:''}
      <td>${paymentBadge(r)||'—'}</td>
      <td><select class="status-select" onchange="updateStatus(${r.id},this.value)">${statusOptions(r.status)}</select></td>
      <td>
        <div class="actions">
          <button class="act-btn" onclick="showDetail(${r.id})" title="Détails">👁</button>
          <button class="act-btn wa" onclick="sendWA(${r.id})" title="WhatsApp">📲</button>
          ${r.status==='pending'?`<button class="act-btn ok" onclick="updateStatus(${r.id},'confirmed')" title="Confirmer">✅</button>`:''}
          ${r.status!=='cancelled'&&r.status!=='completed'?`<button class="act-btn no" onclick="updateStatus(${r.id},'cancelled')" title="Annuler">❌</button>`:''}
          <button class="act-btn del" onclick="deleteRes(${r.id})" title="Supprimer">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ===== DETAIL MODAL ===== */
function showDetail(id) {
  const r = getAll().find(r=>r.id==id);
  if (!r) return;
  document.getElementById('detailModal').innerHTML = `
    <div class="modal-title">
      <span>📋 Réservation</span>
      <button class="modal-close-btn" onclick="closeDetail()">✕</button>
    </div>
    <div style="margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap">${badge(r.status)}${sourceBadge(r)}</div>
    <div class="detail-row"><span class="dk">👤 Client</span><span class="dv">${esc(r.name)}</span></div>
    <div class="detail-row"><span class="dk">📞 Téléphone</span><span class="dv">${esc(r.phone)}</span></div>
    ${r.email?`<div class="detail-row"><span class="dk">✉️ Email</span><span class="dv">${esc(r.email)}</span></div>`:''}
    <div class="detail-row"><span class="dk">🚗 Véhicule</span><span class="dv">${esc(r.car)}</span></div>
    <div class="detail-row"><span class="dk">📍 Lieu</span><span class="dv">${esc(r.city)||'—'}</span></div>
    <div class="detail-row"><span class="dk">📅 Départ</span><span class="dv">${fmt(r.start)}</span></div>
    <div class="detail-row"><span class="dk">📅 Retour</span><span class="dv">${fmt(r.end)}</span></div>
    <div class="detail-row"><span class="dk">⏱ Durée</span><span class="dv">${r.days} jour${r.days>1?'s':''}</span></div>
    <div class="detail-row"><span class="dk">💵 Prix/jour</span><span class="dv">${fmtN(r.carPrice)} MAD</span></div>
    <div class="detail-total-row">
      <span>💰 Total à payer</span>
      <span class="detail-total-val">${fmtN(r.total)} MAD</span>
    </div>
    <div class="detail-row"><span class="dk">💳 Paiement</span><span class="dv">${paymentBadge(r)||'—'}</span></div>
    <div class="detail-row"><span class="dk">✅ Déjà payé</span><span class="dv">${fmtN(paymentInfo(r).paid)} MAD</span></div>
    <div class="detail-row"><span class="dk">⏳ Reste</span><span class="dv">${fmtN(paymentInfo(r).due)} MAD</span></div>
    <div class="detail-row"><span class="dk">🔒 Caution</span><span class="dv">${r.hasCaution ? fmtN(r.caution)+' MAD' : 'Non prise'} <button class="act-btn" onclick="toggleCautionEdit(${r.id})">✏️</button></span></div>
    <div id="caution_wrap_${r.id}"></div>
    ${paymentInfo(r).due > 0 ? `
    <div class="form-group">
      <label>💰 Le client paie maintenant (MAD)</label>
      <div style="display:flex;gap:8px">
        <input id="addpay_${r.id}" type="number" min="0" max="${paymentInfo(r).due}" placeholder="Ex: 500"/>
        <button class="btn-sm" onclick="addPayment(${r.id}, document.getElementById('addpay_${r.id}').value)">➕ Ajouter</button>
      </div>
      <button class="btn-sm" style="margin-top:6px;width:100%" onclick="addPayment(${r.id}, ${paymentInfo(r).due})">✅ Tout payer maintenant (${fmtN(paymentInfo(r).due)} MAD)</button>
    </div>` : ''}
    <button class="modal-btn-wa" style="margin-top:10px;width:100%" onclick="downloadInvoice(${r.id})">🧾 Télécharger la facture</button>
    <div class="detail-row"><span class="dk">🕐 Créé le</span><span class="dv">${new Date(r.createdAt).toLocaleString('fr-FR')}</span></div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn-sm" style="width:100%" onclick="openEditReservation(${r.id})">✏️ Modifier toute la réservation</button>
      ${r.status==='pending'?`<button class="modal-btn-confirm" onclick="updateStatus(${r.id},'confirmed');closeDetail()">✅ Confirmer</button>`:''}
      ${r.status!=='cancelled'&&r.status!=='completed'?`<button class="modal-btn-cancel" onclick="updateStatus(${r.id},'cancelled');closeDetail()">❌ Annuler</button>`:''}
      <button class="modal-btn-wa" onclick="sendWA(${r.id})">📲 WhatsApp</button>
      <button class="act-btn del" onclick="deleteRes(${r.id})">🗑️ Supprimer</button>
      <button class="modal-btn-close" onclick="closeDetail()">Fermer</button>
    </div>
  `;
  document.getElementById('detailOverlay').classList.add('open');
}

function toggleCautionEdit(id) {
  const r = getAll().find(r=>r.id==id);
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
    <button class="act-btn ok" style="margin-top:6px" onclick="setCaution(${id}, document.getElementById('cau_has_${id}').checked, document.getElementById('cau_amt_${id}').value)">💾 Enregistrer</button>`;
}

function setCaution(id, hasCaution, amount) {
  saveAll(getAll().map(r => r.id==id ? {...r, hasCaution, caution: hasCaution ? Math.max(0,+amount||0) : 0} : r));
  toast('🔒 Caution mise à jour');
  showDetail(id);
}

function openEditReservation(id) {
  const r = getAll().find(r=>r.id==id);
  if (!r) return;
  document.getElementById('detailModal').innerHTML = `
    <div class="modal-title"><span>✏️ Modifier la réservation</span><button class="modal-close-btn" onclick="closeDetail()">✕</button></div>
    <div class="form-group"><label>Nom du client</label><input id="er_name" type="text" value="${esc(r.name)}"/></div>
    <div class="form-group"><label>Téléphone</label><input id="er_phone" type="text" value="${esc(r.phone)}"/></div>
    <div class="form-group"><label>Email (optionnel)</label><input id="er_email" type="email" value="${esc(r.email||'')}"/></div>
    <div class="form-group"><label>Véhicule</label>
      <select id="er_car">${getVehicles().map(v=>`<option value="${esc(v.name)}" ${v.name===r.car?'selected':''}>${esc(v.name)}</option>`).join('')}
        ${!getVehicles().some(v=>v.name===r.car)?`<option value="${esc(r.car)}" selected>${esc(r.car)}</option>`:''}
      </select>
    </div>
    <div class="form-group"><label>Lieu de livraison</label><input id="er_city" type="text" value="${esc(r.city||'')}"/></div>
    <div class="form-group"><label>Date départ</label><input id="er_start" type="date" value="${r.start}"/></div>
    <div class="form-group"><label>Date retour</label><input id="er_end" type="date" value="${r.end}"/></div>
    <div class="form-group"><label>Total (MAD)</label><input id="er_total" type="number" min="0" value="${r.total}"/></div>
    <div class="form-group"><label>Déjà payé (MAD)</label><input id="er_paid" type="number" min="0" value="${r.amountPaid||0}"/></div>
    <div class="form-group">
      <label><input id="er_hasCaution" type="checkbox" ${r.hasCaution?'checked':''} onchange="document.getElementById('er_caution_wrap').style.display=this.checked?'':'none'"/> Caution / Garantie prise</label>
    </div>
    <div class="form-group" id="er_caution_wrap" style="display:${r.hasCaution?'':'none'}"><label>Montant de la caution (MAD)</label><input id="er_caution" type="number" min="0" value="${r.caution||0}"/></div>
    <div class="form-group"><label>Statut</label>
      <select id="er_status">${Object.entries(STATUS).map(([k,s])=>`<option value="${k}" ${r.status===k?'selected':''}>${s.icon} ${statusLabel(k)}</option>`).join('')}</select>
    </div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="modal-btn-confirm" onclick="submitEditReservation(${id})">💾 Enregistrer</button>
      <button class="modal-btn-close" onclick="showDetail(${id})">Annuler</button>
    </div>`;
}

function submitEditReservation(id) {
  const v = vid => document.getElementById(vid).value.trim();
  const start = v('er_start'), end = v('er_end');
  const days = Math.max(1, Math.round((new Date(end)-new Date(start))/86400000));
  const total = +v('er_total')||0;
  const hasCaution = document.getElementById('er_hasCaution').checked;
  saveAll(getAll().map(r => r.id==id ? {...r,
    name: v('er_name'), phone: v('er_phone'), email: v('er_email'),
    car: v('er_car'), city: v('er_city'), start, end, days, total,
    carPrice: days?Math.round(total/days):total,
    amountPaid: +v('er_paid')||0,
    hasCaution, caution: hasCaution ? (+v('er_caution')||0) : 0,
    status: v('er_status'),
  } : r));
  toast('✅ Réservation mise à jour');
  showDetail(id);
  renderTable(); renderDashboard();
}

function closeDetail(e) {
  if (!e || e.target===document.getElementById('detailOverlay'))
    document.getElementById('detailOverlay').classList.remove('open');
}

/* ===== STATS ===== */
function renderStats() {
  const all = getAll();
  const revenue   = all.filter(r=>r.status!=='cancelled').reduce((s,r)=>s+ +r.total,0);
  const avg       = all.length ? Math.round(revenue/all.length) : 0;
  const completed = all.filter(r=>r.status==='completed').length;
  const pending   = all.filter(r=>r.status==='pending').length;

  document.getElementById('statsKpi').innerHTML = `
    <div class="kpi-card c-red"><div class="kpi-icon">📋</div><div class="kpi-val">${all.length}</div><div class="kpi-label">Total réservations</div></div>
    <div class="kpi-card c-green"><div class="kpi-icon">💰</div><div class="kpi-val" style="font-size:1.4rem">${fmtN(revenue)}</div><div class="kpi-label">CA total (MAD)</div></div>
    <div class="kpi-card c-yellow"><div class="kpi-icon">🧮</div><div class="kpi-val">${fmtN(avg)}</div><div class="kpi-label">Panier moyen (MAD)</div></div>
    <div class="kpi-card c-blue"><div class="kpi-icon">🏁</div><div class="kpi-val" style="color:var(--blue)">${completed}</div><div class="kpi-label">Terminées</div></div>
  `;

  // Status chart
  const counts = {};
  const cars   = {};
  const cities = {};
  all.forEach(r=>{
    counts[r.status] = (counts[r.status]||0)+1;
    if(r.car)  cars[r.car]   = (cars[r.car]  ||0)+1;
    if(r.city) cities[r.city]= (cities[r.city]||0)+1;
  });

  const max = Math.max(...Object.values(counts),1);
  document.getElementById('statusChart').innerHTML = Object.entries(STATUS).map(([k,v])=>{
    const n = counts[k]||0;
    return `<div class="bar-row">
      <span class="bar-label">${v.icon} ${v.label}</span>
      <div class="bar-bg"><div class="bar-fill" style="width:${Math.round(n/max*100)}%;background:${v.color}"></div></div>
      <span class="bar-val">${n}</span>
    </div>`;
  }).join('');

  const topList = (obj, max=5) => {
    const sorted = Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,max);
    const mx = sorted[0]?.[1]||1;
    return sorted.map(([k,v])=>`<div class="bar-row">
      <span class="bar-label">${k}</span>
      <div class="bar-bg"><div class="bar-fill" style="width:${Math.round(v/mx*100)}%;background:var(--red)"></div></div>
      <span class="bar-val">${v}</span>
    </div>`).join('') || '<p style="color:var(--muted);font-size:.82rem">Aucune donnée</p>';
  };

  document.getElementById('topCars').innerHTML   = topList(cars);
  document.getElementById('topCities').innerHTML = topList(cities);

  // Revenue chart (last 10 reservations)
  const recent = all.slice(0,10).reverse();
  const maxRev = Math.max(...recent.map(r=>+r.total),1);
  document.getElementById('revenueChart').innerHTML = recent.length
    ? recent.map(r=>`
      <div class="rev-bar-wrap" title="${esc(r.name)} · ${fmtN(r.total)} MAD">
        <div class="rev-bar" style="height:${Math.round(+r.total/maxRev*100)}%;background:${r.status==='cancelled'?'var(--border)':'var(--red)'}"></div>
        <div class="rev-label">${esc(r.car?.split(' ')[0])}</div>
        <div class="rev-val">${Math.round(+r.total/1000)}k</div>
      </div>`).join('')
    : '<p style="color:var(--muted);font-size:.82rem">Aucune donnée</p>';
}

/* ===== FACTURE ===== */
function downloadInvoice(id) {
  const r = getAll().find(r=>r.id==id);
  if (!r) return;
  const p = paymentInfo(r);
  const cfg = JSON.parse(localStorage.getItem('md_site_settings') || '{}');
  const agencyName = cfg.name || 'Chakroun Cars';
  const isImgLogo = /^(https?:|data:)/.test(cfg.logo || '');
  const logoHtml = isImgLogo
    ? `<img src="${cfg.logo}" alt="${esc(agencyName)}" style="height:48px;max-width:200px;object-fit:contain;display:block;margin:0 auto 10px"/>`
    : '';
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Facture #${r.id}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#111}
    h1{color:#e63329;text-align:center}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    td{padding:8px 0;border-bottom:1px solid #eee}
    td:first-child{color:#666;width:45%}
    .total{font-size:1.3rem;font-weight:bold;color:#e63329;margin-top:20px}
    .badge{display:inline-block;padding:4px 12px;border-radius:100px;font-size:.8rem;font-weight:bold}
  </style></head><body>
    ${logoHtml}
    <h1>${esc(agencyName)} — Facture</h1>
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
      <tr><td>Statut</td><td>${p.full?'Payé complet':'Avance'} · ${statusLabel(r.status)}</td></tr>
      ${r.hasCaution?`<tr><td>🔒 Caution</td><td>${fmtN(r.caution)} MAD</td></tr>`:''}
    </table>
    <p class="total">Total : ${fmtN(p.total)} MAD</p>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Facture_${agencyName.replace(/\s+/g,'_')}_${r.id}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('🧾 Facture téléchargée');
}

/* ===== WHATSAPP ===== */
function sendWA(id) {
  const r = getAll().find(r=>r.id==id);
  if (!r) return;
  const phone = (r.phone || '').replace(/\D/g,'');
  const dest  = phone.startsWith('0') ? '212' + phone.slice(1) : phone || WA;
  const agencyName = (JSON.parse(localStorage.getItem('md_site_settings') || '{}').name) || 'Chakroun Cars';
  const msg = `🚗 *Réservation ${agencyName}*\n\n👤 *Nom :* ${r.name}\n📞 *Tél :* ${r.phone}${r.email?'\n✉️ *Email :* '+r.email:''}\n📍 *Lieu :* ${r.city||'—'}\n🚘 *Véhicule :* ${r.car}\n📅 *Départ :* ${fmt(r.start)}\n📅 *Retour :* ${fmt(r.end)}\n⏱ *Durée :* ${r.days} jour${r.days>1?'s':''}\n💰 *Total :* ${fmtN(r.total)} MAD\n${STATUS[r.status].icon} *Statut :* ${STATUS[r.status].label}`;
  window.open(`https://wa.me/${dest}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ===== EXPORT EXCEL ===== */
function openExportModal() { document.getElementById('exportOverlay').style.display='flex'; }
function closeExportModal() { document.getElementById('exportOverlay').style.display='none'; }

function filterByPeriod(data, period) {
  if (period === 'all') return data;
  const from = new Date();
  if      (period==='week')    from.setDate(from.getDate()-7);
  else if (period==='month')   from.setDate(from.getDate()-30);
  else if (period==='3months') from.setMonth(from.getMonth()-3);
  else if (period==='6months') from.setMonth(from.getMonth()-6);
  else if (period==='year')    from.setFullYear(from.getFullYear()-1);
  return data.filter(r => new Date(r.createdAt) >= from);
}

function doExport() {
  const all = getAll();
  if (!all.length) { toast('⚠️ Aucune réservation'); return; }
  const period = document.querySelector('input[name="expPeriod"]:checked')?.value || 'all';
  const data   = filterByPeriod(all, period);
  if (!data.length) { toast('⚠️ Aucune donnée pour cette période'); return; }

  const WB = XLSX.utils.book_new();
  const fmt   = d => d ? new Date(d).toLocaleDateString('fr-FR') : '';
  const fmtDT = d => d ? new Date(d).toLocaleString('fr-FR') : '';
  const sLabel = s => STATUS[s]?.label || s;
  const num = n => Number(n) || 0;
  const PERIOD_LABELS = { week:'Cette semaine', month:'Ce mois (30j)', '3months':'3 derniers mois', '6months':'6 derniers mois', year:'Cette année', all:'Toutes les données' };

  const confirmed = data.filter(r=>r.status==='confirmed');
  const pending   = data.filter(r=>r.status==='pending');
  const cancelled = data.filter(r=>r.status==='cancelled');
  const totalRev  = confirmed.reduce((s,r)=>s+num(r.total),0);
  const byCar = {};
  confirmed.forEach(r=>{ byCar[r.car]=(byCar[r.car]||0)+num(r.total); });
  const topCars = Object.entries(byCar).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // ── Résumé ──
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['📊 RAPPORT CHAKROUN CARS','',''],
    ['Période', PERIOD_LABELS[period],''],
    ['Généré le', fmtDT(new Date()),''],
    ['','',''],
    ['INDICATEURS CLÉS','',''],
    ['Total réservations', data.length,''],
    ['Confirmées', confirmed.length,''],
    ['En attente', pending.length,''],
    ['Annulées', cancelled.length,''],
    ['Taux confirmation', confirmed.length ? Math.round(confirmed.length/data.length*100)+'%':'0%',''],
    ['','',''],
    ['CHIFFRE D\'AFFAIRES','',''],
    ['Revenu total (MAD)', totalRev,''],
    ['Panier moyen (MAD)', confirmed.length ? Math.round(totalRev/confirmed.length):0,''],
    ['Total jours loués', confirmed.reduce((s,r)=>s+num(r.days),0),''],
    ['','',''],
    ['TOP 5 VÉHICULES','',''],
    ['Véhicule','Revenu MAD',''],
    ...topCars.map(([c,v])=>[c,v,'']),
  ]);
  ws1['!cols']=[{wch:28},{wch:22},{wch:10}];
  XLSX.utils.book_append_sheet(WB, ws1, '📊 Résumé');

  // ── Réservations ──
  const hdrs = ['ID','Nom','Téléphone','Email','Véhicule','Ville','Date départ','Date retour','Jours','Total MAD','Payé MAD','Reste MAD','Source','Statut','Créé le'];
  const ws2 = XLSX.utils.aoa_to_sheet([hdrs, ...data.map(r=>{
    const p = paymentInfo(r);
    return [r.id, r.name, r.phone, r.email||'', r.car, r.city||'',
    fmt(r.start), fmt(r.end), num(r.days), num(r.total), p.paid, p.due,
    r.source==='manual'?'Manuel':'Site web', sLabel(r.status), fmtDT(r.createdAt)];
  })]);
  ws2['!cols']=[{wch:14},{wch:20},{wch:16},{wch:22},{wch:18},{wch:18},{wch:13},{wch:13},{wch:7},{wch:12},{wch:10},{wch:10},{wch:10},{wch:12},{wch:18}];
  XLSX.utils.book_append_sheet(WB, ws2, '📋 Réservations');

  // ── Par véhicule ──
  const cs={};
  data.forEach(r=>{ if(!cs[r.car])cs[r.car]={tot:0,conf:0,ann:0,rev:0,days:0}; cs[r.car].tot++; if(r.status==='confirmed'){cs[r.car].conf++;cs[r.car].rev+=num(r.total);cs[r.car].days+=num(r.days);} if(r.status==='cancelled')cs[r.car].ann++; });
  const ws3 = XLSX.utils.aoa_to_sheet([['Véhicule','Total','Confirmées','Annulées','Revenu MAD','Jours','Panier moy.'],
    ...Object.entries(cs).sort((a,b)=>b[1].rev-a[1].rev).map(([c,s])=>[c,s.tot,s.conf,s.ann,s.rev,s.days,s.conf?Math.round(s.rev/s.conf):0])]);
  ws3['!cols']=[{wch:20},{wch:8},{wch:12},{wch:11},{wch:12},{wch:8},{wch:13}];
  XLSX.utils.book_append_sheet(WB, ws3, '🚗 Par véhicule');

  // ── Par ville ──
  const cv={};
  data.forEach(r=>{ const c=r.city||'Non précisé'; if(!cv[c])cv[c]={tot:0,rev:0}; cv[c].tot++; if(r.status==='confirmed')cv[c].rev+=num(r.total); });
  const ws4 = XLSX.utils.aoa_to_sheet([['Ville','Réservations','Revenu MAD'],
    ...Object.entries(cv).sort((a,b)=>b[1].tot-a[1].tot).map(([c,s])=>[c,s.tot,s.rev])]);
  ws4['!cols']=[{wch:22},{wch:14},{wch:13}];
  XLSX.utils.book_append_sheet(WB, ws4, '📍 Par ville');

  // ── Par mois ──
  const cm={};
  data.forEach(r=>{ const k=new Date(r.createdAt).toLocaleDateString('fr-FR',{year:'numeric',month:'long'}); if(!cm[k])cm[k]={tot:0,rev:0}; cm[k].tot++; if(r.status==='confirmed')cm[k].rev+=num(r.total); });
  const ws5 = XLSX.utils.aoa_to_sheet([['Mois','Réservations','Revenu MAD'],
    ...Object.entries(cm).map(([m,s])=>[m,s.tot,s.rev])]);
  ws5['!cols']=[{wch:20},{wch:14},{wch:13}];
  XLSX.utils.book_append_sheet(WB, ws5, '📅 Par mois');

  const pLabel={week:'semaine',month:'mois','3months':'3mois','6months':'6mois',year:'annee',all:'complet'}[period];
  const agencyName = (JSON.parse(localStorage.getItem('md_site_settings') || '{}').name) || 'Chakroun Cars';
  XLSX.writeFile(WB, `${agencyName.replace(/\s+/g,'_')}_${pLabel}_${new Date().toISOString().slice(0,10)}.xlsx`);
  closeExportModal();
  toast('✅ Fichier Excel téléchargé');
}

/* ===== TABS ===== */
function showTab(tab, el) {
  document.querySelectorAll('.sb-link').forEach(a=>a.classList.remove('active'));
  el.classList.add('active');
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarBackdrop')?.classList.remove('show');
  }
  ['Dashboard','Reservations','Stats','Chats'].forEach(t=>{
    const el2 = document.getElementById('tab'+t);
    if (el2) el2.style.display = 'none';
  });
  const map = {dashboard:'Dashboard',reservations:'Reservations',stats:'Stats',chats:'Chats'};
  const elTab = document.getElementById('tab' + map[tab]);
  if (elTab) elTab.style.display = 'block';
  window.currentAdminTab = tab;
  const L = PANEL_LANGS[localStorage.getItem('md_panel_lang') || 'fr'];
  document.getElementById('pageTitle').textContent = (L.titles && L.titles[tab]) || tab;
  if (tab==='reservations') renderTable();
  if (tab==='stats') renderStats();
  if (tab==='chats') { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; renderChats(); markChatsSeen(); }
}

/* ===== CHAT CONVERSATIONS ===== */
function getChats() { return JSON.parse(localStorage.getItem('md_chat_conversations')||'[]'); }
function clearChats() { if(confirm('Vider toutes les conversations ?')){ localStorage.removeItem('md_chat_conversations'); renderChats(); toast('🗑 Conversations supprimées'); } }

function toggleChatbot() {
  const cfg = JSON.parse(localStorage.getItem('md_chat_config')||'{}');
  cfg.active = !cfg.active;
  localStorage.setItem('md_chat_config', JSON.stringify(cfg));
  updateChatToggleUI(cfg.active);
  toast(cfg.active ? '🤖 Chatbot activé' : '🔕 Chatbot désactivé');
}
function updateChatToggleUI(active) {
  const track = document.getElementById('chatToggleTrack');
  if (!track) return;
  track.classList.toggle('on', active);
}
function initChatToggle() {
  const cfg = JSON.parse(localStorage.getItem('md_chat_config')||'{"active":true}');
  updateChatToggleUI(cfg.active !== false);
}

/* ===== CHAT NOTIFICATIONS ===== */
function totalChatMsgCount() { return getChats().reduce((s,c) => s + c.messages.length, 0); }
function checkNewChats(showToast) {
  const seen = +localStorage.getItem('md_chat_seen_count') || 0;
  const total = totalChatMsgCount();
  const dot = document.getElementById('chatBadgeDot');
  if (total > seen) {
    if (dot) dot.style.display = 'block';
    if (showToast) toast('💬 Nouveau message dans le chatbot');
  } else if (dot) dot.style.display = 'none';
}
function markChatsSeen() { localStorage.setItem('md_chat_seen_count', totalChatMsgCount()); checkNewChats(false); }

function renderChats() {
  const all = getChats();
  const list = document.getElementById('chatList');
  const detail = document.getElementById('chatDetail');
  if (!all.length) {
    list.innerHTML = '<div class="chat-empty">💬<br/>Aucune conversation pour le moment.</div>';
    detail.innerHTML = '';
    return;
  }
  const fmt = d => new Date(d).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  list.innerHTML = all.map((s,i) => `
    <div class="chat-item" onclick="showChatDetail(${s.id})" id="ci_${s.id}" style="animation-delay:${i*40}ms">
      <div class="chat-item-num">#${i+1}</div>
      <div class="chat-item-body">
        <div class="chat-item-top"><strong>Session ${i+1}</strong><span>${s.messages.length} msgs</span></div>
        <div class="chat-item-date">${fmt(s.startedAt)}</div>
        <div class="chat-item-preview">${esc((s.messages.find(m=>m.role==='user')?.content||'—').slice(0,60))}</div>
      </div>
    </div>`).join('');
  if (all.length) showChatDetail(all[0].id);
}

function showChatDetail(id) {
  document.querySelectorAll('.chat-item').forEach(el=>el.classList.remove('active'));
  const el = document.getElementById('ci_'+id);
  if (el) el.classList.add('active');
  const s = getChats().find(x=>x.id===id);
  if (!s) return;
  const idx = getChats().findIndex(x=>x.id===id);
  const fmt = d => new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const detail = document.getElementById('chatDetail');
  detail.classList.remove('chat-detail-anim');
  detail.innerHTML = `
    <div class="chat-detail-card">
      <div class="chat-detail-header">Session #${idx+1} · démarrée le ${new Date(s.startedAt).toLocaleString('fr-FR')}</div>
      <div class="chat-detail-msgs">
        ${s.messages.map((m,i)=>`
          <div class="chat-detail-msg ${m.role}" style="animation-delay:${i*45}ms">
            <div class="chat-detail-bubble">${esc(m.content).replace(/\n/g,'<br/>')}</div>
            <div class="chat-detail-time">${m.role==='user'?'Client':'Bot'} · ${fmt(m.time)}</div>
          </div>`).join('')}
      </div>
    </div>`;
  requestAnimationFrame(()=>detail.classList.add('chat-detail-anim'));
}

/* ===== DEMO DATA ===== */
/* ===== FACTORY RESET ===== */
function factoryReset() {
  if (!confirm('⚠️ Ceci va supprimer TOUTES les données (réservations, voitures, offres, blocages, conversations, paramètres). Le site repartira à zéro. Continuer ?')) return;
  ['md_reservations','md_cars','md_offers','md_blocks','md_car_settings','md_site_settings','md_chat_conversations','md_chat_config'].forEach(k=>localStorage.removeItem(k));
  alert('✅ Toutes les données ont été supprimées. La page va se recharger.');
  location.reload();
}

/* ===== INIT ===== */
function init() {
  applyAdminBranding();
  renderDashboard();
  renderNotif();
  initChatToggle();
  _initBaseline();
  startRealtimeSync();
  requestNotifPermission();
  checkNewChats(false);

  // detect new reservations from any tab (cross-tab)
  window.addEventListener('storage', e => {
    if (e.key === 'md_reservations') checkNewReservations();
    if (e.key === 'md_chat_conversations') checkNewChats(true);
    if (e.key === 'md_site_settings') applyAdminBranding();
  });

  // detect new reservations same-tab (when admin itself saves)
  const _orig = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, val) {
    _orig(key, val);
    if (key === 'md_reservations') checkNewReservations();
  };
}

/* ===== VEHICLES (read-only helpers used by the reservation form; management lives in CRM System) ===== */
function getVehicles() { return JSON.parse(localStorage.getItem('md_vehicles')||'[]'); }

function vehicleReservations(name) {
  return getAll().filter(r => r.car===name && r.status!=='cancelled' && r.start && r.end)
    .sort((a,b)=> new Date(a.start) - new Date(b.start));
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

if (sessionStorage.getItem('md_admin')==='1') {
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='flex';
  init();
}

// Re-render after Firebase sync
window.addEventListener('db-synced', () => {
  if (sessionStorage.getItem('md_admin') === '1') init();
});
