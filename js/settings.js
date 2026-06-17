'use strict';

const CARS_DEFAULT = (typeof SITE !== 'undefined' && SITE.cars) ? SITE.cars : [];

const CATEGORIES = { economy:'Économique', suv:'SUV', premium:'Premium', electric:'Électrique' };
const BADGES_LIST = ['','popular','bestseller','premium','eco','hybrid','luxury'];
const BADGE_LABELS = { '':'Aucun', popular:'Populaire', bestseller:'Best Seller', premium:'Premium', eco:'Éco', hybrid:'Hybride', luxury:'Luxe' };
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

/* ===== DB ===== */
function getCars() {
  const s = localStorage.getItem('md_cars');
  if (!s) return JSON.parse(JSON.stringify(CARS_DEFAULT));
  const cars = JSON.parse(s);
  cars.forEach(c => { if (!c.photo) { const d = CARS_DEFAULT.find(x => x.id === c.id); if (d) c.photo = d.photo; } });
  return cars;
}
function saveCars(arr) { localStorage.setItem('md_cars', JSON.stringify(arr)); }

/* ===== AUTH ===== */
function sLogin() {
  const u = document.getElementById('sUser').value.trim();
  const p = document.getElementById('sPass').value.trim();
  const res = authCheckLogin(u, p);
  if (res.ok) {
    sessionStorage.setItem('md_settings','1');
    document.getElementById('sLoginWrap').style.display = 'none';
    document.getElementById('sPanel').style.display = 'flex';
    init();
  } else if (res.locked) {
    document.getElementById('sErr').textContent = `🔒 Trop de tentatives. Réessayez dans ${res.locked}s.`;
  } else {
    document.getElementById('sErr').textContent = 'Identifiant ou mot de passe incorrect.';
  }
}
function sLogout() { sessionStorage.removeItem('md_settings'); location.reload(); }

/* ===== FORGOT PASSWORD ===== */
function sOpenForgot() {
  document.querySelector('.s-login-box').style.display = 'none';
  document.getElementById('sForgotBox').style.display = 'block';
  document.getElementById('sForgotStep1').style.display = 'block';
  document.getElementById('sForgotStep2').style.display = 'none';
  document.getElementById('sForgotErr').textContent = '';
  document.getElementById('sForgotQuestionText').textContent = authHasQuestion()
    ? authQuestion()
    : 'Aucune question de sécurité configurée. Configurez-la depuis l\'onglet Sécurité une fois connecté.';
}
function sCloseForgot() {
  document.getElementById('sForgotBox').style.display = 'none';
  document.querySelector('.s-login-box').style.display = 'block';
}
function sCheckForgotAnswer() {
  if (!authHasQuestion()) { document.getElementById('sForgotErr').textContent = 'Pas de question configurée.'; return; }
  if (authCheckAnswer(document.getElementById('sForgotAnswer').value)) {
    document.getElementById('sForgotStep1').style.display = 'none';
    document.getElementById('sForgotStep2').style.display = 'block';
    document.getElementById('sForgotErr').textContent = '';
  } else {
    document.getElementById('sForgotErr').textContent = 'Réponse incorrecte.';
  }
}
function sSubmitForgotReset() {
  const u = document.getElementById('sForgotNewUser').value.trim();
  const p = document.getElementById('sForgotNewPass').value;
  if (!u || !p) { document.getElementById('sForgotErr').textContent = 'Remplissez les deux champs.'; return; }
  authResetCreds(u, p);
  alert('✅ Identifiants réinitialisés. Connectez-vous avec vos nouveaux identifiants.');
  sCloseForgot();
}

/* ===== SECURITY TAB ===== */
function loadSecurityTab() {
  const c = authCreds();
  document.getElementById('secUser').value = c.user;
  document.getElementById('secQuestion').value = c.q;
  document.getElementById('secAnswer').value = c.a;
}
function saveSecurity() {
  const newPass = document.getElementById('secNewPass').value;
  const c = authCreds();
  const updated = {
    user: document.getElementById('secUser').value.trim() || c.user,
    pass: newPass ? newPass : c.pass,
    q: document.getElementById('secQuestion').value.trim(),
    a: document.getElementById('secAnswer').value.trim(),
  };
  authSaveCreds(updated);
  document.getElementById('secNewPass').value = '';
  const msg = document.getElementById('secMsg');
  msg.textContent = '✅ Sécurité mise à jour';
  setTimeout(() => msg.textContent = '', 3000);
}

/* ===== TABS ===== */
function sTab(name, btn) {
  document.querySelectorAll('.s-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.s-nav-btn').forEach(b => b.classList.remove('active'));
  const key = name.charAt(0).toUpperCase() + name.slice(1);
  document.getElementById('tab' + key).style.display = 'block';
  btn.classList.add('active');
  if (name === 'offers') initOffersTab();
  if (name === 'chatbot') initChatbotTab();
  if (name === 'security') loadSecurityTab();
}

/* ===== INIT ===== */
function init() {
  renderCarsGrid();
  renderResCarSelect();
  loadSiteSettings();
  loadBookingConfig();
}

window.addEventListener('db-synced', () => {
  if (sessionStorage.getItem('md_settings') === '1') init();
});

/* ===================== CARS TAB ===================== */
function renderCarsGrid() {
  const cars = getCars();
  const grid = document.getElementById('sCarsGrid');
  grid.innerHTML = '';

  // Add-car button row
  const addRow = document.createElement('div');
  addRow.className = 's-add-row';
  addRow.innerHTML = `<button class="s-btn-add" onclick="showAddForm()">＋ Ajouter un véhicule</button>`;
  grid.appendChild(addRow);

  // Add form (hidden by default)
  const formWrap = document.createElement('div');
  formWrap.id = 'sAddFormWrap';
  formWrap.style.display = 'none';
  formWrap.innerHTML = buildCarForm(null);
  grid.appendChild(formWrap);

  // Existing cars
  cars.forEach(car => {
    const card = document.createElement('div');
    card.className = 's-car-card';
    card.id = 'card_' + car.id;
    card.innerHTML = buildCarCard(car);
    grid.appendChild(card);
  });
}

function buildCarCard(car) {
  const photoHtml = car.photo
    ? `<img src="${car.photo}" alt="${car.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;"/><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:2rem;">${car.emoji}</span>`
    : `<span style="font-size:2rem;">${car.emoji}</span>`;
  return `
    <div class="s-car-top">
      <div class="s-car-emoji" id="prev_${car.id}">${photoHtml}</div>
      <div style="flex:1">
        <div class="s-car-title">${car.name}</div>
        <div class="s-car-model">${car.model}</div>
        <span class="s-cat-badge">${CATEGORIES[car.category]||car.category}</span>
      </div>
      <div class="s-card-top-actions">
        <span class="s-price-tag">${car.price} MAD/j</span>
      </div>
    </div>
    <div class="s-car-btns">
      <button class="s-btn-edit" onclick="toggleEdit(${car.id})">✏️ Modifier</button>
      <button class="s-btn-del"  onclick="deleteCar(${car.id})">🗑 Supprimer</button>
    </div>
    <div class="s-edit-form" id="edit_${car.id}" style="display:none">
      ${buildCarForm(car)}
    </div>
  `;
}

const galleryState = {};

function buildCarForm(car) {
  const isNew = !car;
  const id    = car ? car.id : 'new';
  galleryState[id] = car?.gallery ? car.gallery.map(g => typeof g === 'string' ? {url:g, active:true} : g) : [];
  const cats  = Object.entries(CATEGORIES).map(([v,l]) =>
    `<option value="${v}" ${car?.category===v?'selected':''}>${l}</option>`).join('');
  const badgeOpts = BADGES_LIST.map(b =>
    `<option value="${b}" ${(car?.badgeKey||'')=== b?'selected':''}>${BADGE_LABELS[b]}</option>`).join('');

  return `
    <div class="s-form-section">
      <div class="s-ff-row">
        <div class="s-ff">
          <label>Nom du véhicule *</label>
          <input class="s-input" id="f_name_${id}" value="${car?.name||''}" placeholder="ex: Dacia Logan"/>
        </div>
        <div class="s-ff">
          <label>Modèle / Année</label>
          <input class="s-input" id="f_model_${id}" value="${car?.model||''}" placeholder="ex: 2024 — 1.0 TCe"/>
        </div>
      </div>
      <div class="s-ff-row">
        <div class="s-ff">
          <label>Catégorie</label>
          <select class="s-input s-select" id="f_cat_${id}">${cats}</select>
        </div>
        <div class="s-ff">
          <label>Prix / jour (MAD)</label>
          <input class="s-input" type="number" id="f_price_${id}" value="${car?.price||''}" placeholder="300" min="0"/>
        </div>
        <div class="s-ff">
          <label>Badge</label>
          <select class="s-input s-select" id="f_badge_${id}">${badgeOpts}</select>
        </div>
      </div>

      <div class="s-photo-section">
        <label>📸 Photo extérieure (principale)</label>
        <div class="s-photo-tabs">
          <button class="s-photo-tab active" onclick="switchPhotoTab('url','${id}',this)">🔗 Lien URL</button>
          <button class="s-photo-tab" onclick="switchPhotoTab('upload','${id}',this)">⬆️ Uploader</button>
        </div>
        <div id="ptab_url_${id}">
          <input class="s-input" id="f_photo_${id}" value="${car?.photo||''}" placeholder="https://images.unsplash.com/..." oninput="previewPhoto('${id}')"/>
        </div>
        <div id="ptab_upload_${id}" style="display:none">
          <label class="s-upload-label">
            <input type="file" accept="image/*" id="f_file_${id}" onchange="handleFileUpload('${id}')"/>
            <span>Cliquez ou glissez une image ici</span>
          </label>
        </div>
        <div class="s-photo-preview" id="fpreview_${id}">
          ${car?.photo ? `<img src="${car.photo}" onerror="this.style.display='none'"/>` : '<span class="s-no-photo">Aucune photo</span>'}
        </div>
      </div>

      <div class="s-photo-section">
        <label>🪑 Photos intérieur (jusqu'à 3)</label>
        <div class="s-gallery-grid" id="gallery_${id}">${renderGalleryHtml(id)}</div>
        <button class="s-btn-add-gallery" id="gallery_add_${id}" onclick="addGalleryItem('${id}')" style="${galleryState[id].length>=3?'display:none':''}">＋ Ajouter une photo intérieur</button>
      </div>

      <div class="s-form-actions">
        ${isNew
          ? `<button class="s-btn-save-car" onclick="saveNewCar()">💾 Ajouter le véhicule</button>
             <button class="s-btn-cancel" onclick="hideAddForm()">Annuler</button>`
          : `<button class="s-btn-save-car" onclick="saveEditCar(${car.id})">💾 Enregistrer</button>
             <button class="s-btn-cancel" onclick="toggleEdit(${car.id})">Annuler</button>`
        }
      </div>
    </div>
  `;
}

function switchPhotoTab(mode, id, btn) {
  btn.closest('.s-photo-tabs').querySelectorAll('.s-photo-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('ptab_url_' + id).style.display = mode === 'url' ? 'block' : 'none';
  document.getElementById('ptab_upload_' + id).style.display = mode === 'upload' ? 'block' : 'none';
}

function previewPhoto(id) {
  const url = document.getElementById('f_photo_' + id)?.value.trim();
  const prev = document.getElementById('fpreview_' + id);
  if (!prev) return;
  prev.innerHTML = url ? `<img src="${url}" onerror="this.outerHTML='<span class=s-no-photo>URL invalide</span>'"/>` : '<span class="s-no-photo">Aucune photo</span>';
}

function handleFileUpload(id) {
  const file = document.getElementById('f_file_' + id)?.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const b64 = e.target.result;
    const photoInput = document.getElementById('f_photo_' + id);
    if (photoInput) photoInput.value = b64;
    const prev = document.getElementById('fpreview_' + id);
    if (prev) prev.innerHTML = `<img src="${b64}"/>`;
    showToast('✅ Image chargée');
  };
  reader.readAsDataURL(file);
}

function renderGalleryHtml(id) {
  return (galleryState[id] || []).map((g, i) => {
    const url = g.url || '';
    const active = g.active !== false;
    return `
    <div class="s-gallery-item" style="opacity:${active?1:.5}">
      <div class="s-gallery-preview">${url ? `<img src="${url}" onerror="this.style.display='none'"/>` : '<span class="s-no-photo">—</span>'}</div>
      <input class="s-input s-gallery-input" value="${url}" placeholder="URL photo intérieur" oninput="updateGalleryUrl('${id}',${i},this.value)"/>
      <label class="s-gallery-upload-btn">⬆️<input type="file" accept="image/*" onchange="handleGalleryFileUpload('${id}',${i},this)"/></label>
      <label class="s-gallery-toggle" title="${active?'Désactiver':'Activer'}">
        <input type="checkbox" ${active?'checked':''} onchange="toggleGalleryItem('${id}',${i},this.checked)" style="display:none"/>
        <span style="cursor:pointer;font-size:1.1rem">${active?'👁':'🚫'}</span>
      </label>
      <button class="s-gallery-remove" type="button" onclick="removeGalleryItem('${id}',${i})">✕</button>
    </div>`;
  }).join('');
}
function refreshGallery(id) {
  const c = document.getElementById('gallery_' + id);
  if (c) c.innerHTML = renderGalleryHtml(id);
  const addBtn = document.getElementById('gallery_add_' + id);
  if (addBtn) addBtn.style.display = (galleryState[id]||[]).length >= 3 ? 'none' : 'inline-block';
}
function addGalleryItem(id) {
  if (!galleryState[id]) galleryState[id] = [];
  if (galleryState[id].length >= 3) return;
  galleryState[id].push({url:'', active:true});
  refreshGallery(id);
}
function removeGalleryItem(id, idx) {
  galleryState[id].splice(idx, 1);
  refreshGallery(id);
}
function updateGalleryUrl(id, idx, val) {
  if (!galleryState[id][idx]) galleryState[id][idx] = {url:'', active:true};
  galleryState[id][idx] = {...galleryState[id][idx], url: val};
  refreshGallery(id);
}
function toggleGalleryItem(id, idx, checked) {
  galleryState[id][idx] = {...galleryState[id][idx], active: checked};
  refreshGallery(id);
}
function handleGalleryFileUpload(id, idx, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    galleryState[id][idx] = {url: e.target.result, active: true};
    refreshGallery(id);
    showToast('✅ Photo intérieur chargée');
  };
  reader.readAsDataURL(file);
}

function getFormData(id) {
  const name  = document.getElementById('f_name_'  + id)?.value.trim();
  const model = document.getElementById('f_model_' + id)?.value.trim();
  const cat   = document.getElementById('f_cat_'   + id)?.value;
  const price = parseInt(document.getElementById('f_price_' + id)?.value) || 0;
  const emoji = document.getElementById('f_emoji_' + id)?.value.trim() || '🚗';
  const badge = document.getElementById('f_badge_' + id)?.value || null;
  const photo = document.getElementById('f_photo_' + id)?.value.trim() || '';
  const gallery = (galleryState[id] || []).filter(g => g && g.url);
  if (!name) { showToast('⚠️ Le nom est obligatoire'); return null; }
  return { name, model, category: cat, price, emoji, badgeKey: badge||null, photo, gallery, specsKey:['seats5','clim','gps'] };
}

function showAddForm()  { document.getElementById('sAddFormWrap').style.display = 'block'; }
function hideAddForm()  { document.getElementById('sAddFormWrap').style.display = 'none'; }

function saveNewCar() {
  const data = getFormData('new');
  if (!data) return;
  const cars = getCars();
  const newId = Date.now();
  cars.push({ id: newId, ...data });
  saveCars(cars);
  renderCarsGrid();
  showToast('✅ Véhicule ajouté');
}

function toggleEdit(id) {
  const form = document.getElementById('edit_' + id);
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveEditCar(id) {
  const data = getFormData(id);
  if (!data) return;
  const cars = getCars();
  const idx  = cars.findIndex(c => c.id === id);
  if (idx === -1) return;
  cars[idx] = { ...cars[idx], ...data };
  saveCars(cars);
  renderCarsGrid();
  showToast('✅ Véhicule mis à jour');
}

function deleteCar(id) {
  if (!confirm('Supprimer ce véhicule ?')) return;
  const cars = getCars().filter(c => c.id !== id);
  saveCars(cars);
  renderCarsGrid();
  showToast('🗑 Véhicule supprimé');
}

/* ===================== RESERVATIONS TAB ===================== */
let resYear, resMonth;

function renderResCarSelect() {
  const sel = document.getElementById('sResCar');
  sel.innerHTML = '<option value="">-- Choisir un véhicule --</option>';
  getCars().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name; opt.textContent = (c.emoji||'🚗') + ' ' + c.name;
    sel.appendChild(opt);
  });
}

function renderResCalendar() {
  const car = document.getElementById('sResCar').value;
  document.getElementById('sBlockForm').style.display  = car ? 'flex' : 'none';
  document.getElementById('sResContent').style.display = car ? 'block' : 'none';
  if (!car) return;
  const now = new Date();
  resYear = now.getFullYear(); resMonth = now.getMonth();
  drawResCal();
}

function resCalNav(dir) {
  resMonth += dir;
  if (resMonth > 11) { resMonth = 0; resYear++; }
  if (resMonth < 0)  { resMonth = 11; resYear--; }
  drawResCal();
}

function getReservedDates(carName) {
  const set = new Set();
  JSON.parse(localStorage.getItem('md_reservations')||'[]')
    .filter(r => r.car === carName && r.status !== 'cancelled')
    .forEach(r => {
      for (let d = new Date(r.start); d < new Date(r.end); d.setDate(d.getDate()+1))
        set.add(d.toISOString().split('T')[0]);
    });
  return set;
}

function getBlocks(carName) {
  return (JSON.parse(localStorage.getItem('md_blocks')||'{}')[carName]) || [];
}

function getBlockedDates(carName) {
  const set = new Set();
  getBlocks(carName).forEach(b => {
    for (let d = new Date(b.start); d <= new Date(b.end); d.setDate(d.getDate()+1))
      set.add(d.toISOString().split('T')[0]);
  });
  return set;
}

function drawResCal() {
  const car      = document.getElementById('sResCar').value;
  const today    = new Date().toISOString().split('T')[0];
  const reserved = getReservedDates(car);
  const blocked  = getBlockedDates(car);
  document.getElementById('sResMonthLabel').textContent = MONTHS_FR[resMonth] + ' ' + resYear;
  const grid = document.getElementById('sResGrid');
  grid.innerHTML = '';
  DAYS_FR.forEach(d => { const el = document.createElement('div'); el.className = 's-cal-day-name'; el.textContent = d; grid.appendChild(el); });
  const firstDay = new Date(resYear, resMonth, 1).getDay();
  const offset   = firstDay === 0 ? 6 : firstDay - 1;
  const total    = new Date(resYear, resMonth+1, 0).getDate();
  for (let i = 0; i < offset; i++) { const el = document.createElement('div'); grid.appendChild(el); }
  for (let d = 1; d <= total; d++) {
    const ds  = resYear + '-' + String(resMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const el  = document.createElement('div');
    el.className = 's-cal-day';
    el.textContent = d;
    if      (ds === today)       el.classList.add('today');
    else if (ds < today)         el.classList.add('past');
    else if (reserved.has(ds))   el.classList.add('reserved');
    else if (blocked.has(ds))    el.classList.add('blocked');
    else                         el.classList.add('avail');
    grid.appendChild(el);
  }
  renderBlocksList(car);
}

function addBlock() {
  const car   = document.getElementById('sResCar').value;
  const start = document.getElementById('sBlockStart').value;
  const end   = document.getElementById('sBlockEnd').value;
  if (!car || !start || !end) { showToast('⚠️ Sélectionnez les dates'); return; }
  if (end < start) { showToast('⚠️ Date de fin invalide'); return; }
  const all = JSON.parse(localStorage.getItem('md_blocks')||'{}');
  if (!all[car]) all[car] = [];
  all[car].push({ id: Date.now(), start, end });
  localStorage.setItem('md_blocks', JSON.stringify(all));
  document.getElementById('sBlockStart').value = '';
  document.getElementById('sBlockEnd').value   = '';
  drawResCal();
  showToast('✅ Période bloquée');
}

function removeBlock(car, id) {
  const all = JSON.parse(localStorage.getItem('md_blocks')||'{}');
  if (all[car]) all[car] = all[car].filter(b => b.id !== id);
  localStorage.setItem('md_blocks', JSON.stringify(all));
  drawResCal();
}

function renderBlocksList(car) {
  const blocks = getBlocks(car);
  const el = document.getElementById('sBlocksList');
  const fmt = d => new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
  el.innerHTML = blocks.length
    ? `<div class="s-blocks-title">Périodes bloquées :</div>` +
      blocks.map(b => `
        <div class="s-block-item">
          <span class="s-block-dates">📅 ${fmt(b.start)} → ${fmt(b.end)}</span>
          <button class="s-block-del" onclick="removeBlock('${car}',${b.id})">🗑</button>
        </div>`).join('')
    : '';
}

/* ===================== OFFERS ===================== */
function getOffers() { return JSON.parse(localStorage.getItem('md_offers') || '[]'); }
function saveOffers(arr) { localStorage.setItem('md_offers', JSON.stringify(arr)); }

function initOffersTab() {
  const sel = document.getElementById('of_car');
  sel.innerHTML = '<option value="all">🚗 Tous les véhicules</option>';
  getCars().forEach(c => {
    const o = document.createElement('option');
    o.value = c.name; o.textContent = (c.emoji||'🚗') + ' ' + c.name;
    sel.appendChild(o);
  });
  renderOffersList();
}

function saveOffer() {
  const title    = document.getElementById('of_title').value.trim();
  const discount = parseInt(document.getElementById('of_discount').value) || 0;
  const desc     = document.getElementById('of_desc').value.trim();
  const car      = document.getElementById('of_car').value;
  const exp      = document.getElementById('of_exp').value;
  if (!title) { showToast('⚠️ Le titre est obligatoire'); return; }
  if (!discount || discount < 1 || discount > 99) { showToast('⚠️ Réduction invalide (1-99%)'); return; }
  const offers = getOffers();
  offers.push({ id: Date.now(), title, discount, desc, car, exp, active: true });
  saveOffers(offers);
  // reset form
  ['of_title','of_desc','of_exp'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('of_discount').value = '';
  document.getElementById('of_car').value = 'all';
  document.getElementById('sOfferFormBox').style.display = 'none';
  document.getElementById('sAddOfferBtn').style.display = 'block';
  renderOffersList();
  showToast('✅ Offre créée');
}

function toggleOffer(id) {
  const offers = getOffers();
  const o = offers.find(x => x.id === id);
  if (o) o.active = !o.active;
  saveOffers(offers);
  renderOffersList();
}

function deleteOffer(id) {
  saveOffers(getOffers().filter(o => o.id !== id));
  renderOffersList();
  showToast('🗑 Offre supprimée');
}

function renderOffersList() {
  const offers = getOffers();
  const el = document.getElementById('sOffersList');
  if (!offers.length) {
    el.innerHTML = '<div class="s-empty-offers">Aucune offre créée pour le moment.</div>';
    return;
  }
  const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) : '∞';
  const expired = o => o.exp && new Date(o.exp) < new Date();
  el.innerHTML = offers.map(o => `
    <div class="s-offer-card ${o.active && !expired(o) ? 'active' : 'inactive'}">
      <div class="s-offer-left">
        <div class="s-offer-badge">-${o.discount}%</div>
        <div>
          <div class="s-offer-title">${o.title}</div>
          ${o.desc ? `<div class="s-offer-desc">${o.desc}</div>` : ''}
          <div class="s-offer-meta">
            <span>${o.car === 'all' ? '🚗 Tous les véhicules' : '🚘 ' + o.car}</span>
            <span>📅 Expire: ${fmt(o.exp)}</span>
            ${expired(o) ? '<span class="s-expired-tag">Expirée</span>' : ''}
          </div>
        </div>
      </div>
      <div class="s-offer-actions">
        <label class="s-toggle" title="${o.active ? 'Désactiver' : 'Activer'}">
          <input type="checkbox" ${o.active ? 'checked' : ''} onchange="toggleOffer(${o.id})"/>
          <span class="s-toggle-slider"></span>
        </label>
        <button class="s-block-del" onclick="deleteOffer(${o.id})">🗑</button>
      </div>
    </div>
  `).join('');
}

/* ===================== SITE SETTINGS ===================== */
function loadSiteSettings() {
  const cfg = JSON.parse(localStorage.getItem('md_site_settings')||'{}');
  document.getElementById('cfgPhone').value   = cfg.phone   || (typeof SITE!=='undefined' ? SITE.phone    : '+212 6XX XXX XXX');
  document.getElementById('cfgWA').value      = cfg.wa      || (typeof SITE!=='undefined' ? SITE.whatsapp : '');
  document.getElementById('cfgName').value    = cfg.name    || 'MarocDrive';
  document.getElementById('cfgLogo').value    = cfg.logo    || '';
  document.getElementById('cfgEmail').value   = cfg.email   || '';
  document.getElementById('cfgAddr').value    = cfg.address || '';
  document.getElementById('cfgHeroBg').value  = cfg.heroBg  || '';
  document.getElementById('cfgHeroCar').value = cfg.heroCar || '';
  const aboutImages = cfg.aboutImages || [];
  document.getElementById('cfgAboutImg1').value = aboutImages[0] || '';
  document.getElementById('cfgAboutImg2').value = aboutImages[1] || '';
  document.getElementById('cfgAboutImg3').value = aboutImages[2] || '';
  const social = cfg.social || {};
  document.getElementById('cfgFbUrl').value = social.facebook?.url || '';
  document.getElementById('cfgFbOn').checked = !!social.facebook?.enabled;
  document.getElementById('cfgIgUrl').value = social.instagram?.url || '';
  document.getElementById('cfgIgOn').checked = !!social.instagram?.enabled;
  document.getElementById('cfgTtUrl').value = social.tiktok?.url || '';
  document.getElementById('cfgTtOn').checked = !!social.tiktok?.enabled;
  document.getElementById('cfgMapsLink').value = cfg.mapsLink || '';
}

function uploadToField(event, fieldId) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { document.getElementById(fieldId).value = reader.result; };
  reader.readAsDataURL(file);
}
function aboutImgUpload(event, slot) { uploadToField(event, 'cfgAboutImg' + slot); }

function saveSiteSettings() {
  const cfg = {
    phone:   document.getElementById('cfgPhone').value.trim(),
    wa:      document.getElementById('cfgWA').value.trim(),
    name:    document.getElementById('cfgName').value.trim(),
    logo:    document.getElementById('cfgLogo').value.trim(),
    email:   document.getElementById('cfgEmail').value.trim(),
    address: document.getElementById('cfgAddr').value.trim(),
    heroBg:  document.getElementById('cfgHeroBg').value.trim(),
    heroCar: document.getElementById('cfgHeroCar').value.trim(),
    aboutImages: [
      document.getElementById('cfgAboutImg1').value.trim(),
      document.getElementById('cfgAboutImg2').value.trim(),
      document.getElementById('cfgAboutImg3').value.trim(),
    ].filter(Boolean),
    social: {
      facebook:  { url: document.getElementById('cfgFbUrl').value.trim(), enabled: document.getElementById('cfgFbOn').checked },
      instagram: { url: document.getElementById('cfgIgUrl').value.trim(), enabled: document.getElementById('cfgIgOn').checked },
      tiktok:    { url: document.getElementById('cfgTtUrl').value.trim(), enabled: document.getElementById('cfgTtOn').checked },
    },
    mapsLink: document.getElementById('cfgMapsLink').value.trim(),
  };
  localStorage.setItem('md_site_settings', JSON.stringify(cfg));
  document.getElementById('sSaveMsg').textContent = '✅ Paramètres enregistrés !';
  setTimeout(() => document.getElementById('sSaveMsg').textContent = '', 3000);
}

function factoryReset() {
  if (!confirm('⚠️ Ceci va supprimer TOUTES les données (réservations, voitures, offres, blocages, conversations, paramètres). Le site repartira à zéro. Continuer ?')) return;
  ['md_reservations','md_cars','md_offers','md_blocks','md_car_settings','md_site_settings','md_chat_conversations','md_chat_config'].forEach(k=>localStorage.removeItem(k));
  alert('✅ Toutes les données ont été supprimées. La page va se recharger.');
  location.reload();
}

/* ===== CHATBOT SETTINGS ===== */
function initChatbotTab() {
  const cfg = JSON.parse(localStorage.getItem('md_chat_config') || '{"active":true,"agentName":"Assistant MarocDrive","welcomeMsg":""}');
  document.getElementById('cbActive').checked  = cfg.active !== false;
  document.getElementById('cbName').value      = cfg.agentName || '';
  document.getElementById('cbWelcome').value   = cfg.welcomeMsg || '';
  renderCbStats();
}

function saveChatbotConfig() {
  const cfg = {
    active:     document.getElementById('cbActive').checked,
    agentName:  document.getElementById('cbName').value.trim() || 'Assistant MarocDrive',
    welcomeMsg: document.getElementById('cbWelcome').value.trim()
  };
  localStorage.setItem('md_chat_config', JSON.stringify(cfg));
  const msg = document.getElementById('cbMsg');
  msg.textContent = '✅ Sauvegardé';
  setTimeout(() => msg.textContent = '', 1500);
}

function renderCbStats() {
  const convs = JSON.parse(localStorage.getItem('md_chat_conversations') || '[]');
  const msgs  = convs.reduce((s,c) => s + c.messages.length, 0);
  const users = convs.reduce((s,c) => s + c.messages.filter(m=>m.role==='user').length, 0);
  document.getElementById('cbStats').innerHTML = [
    ['💬', 'Conversations', convs.length],
    ['✉️', 'Messages total', msgs],
    ['👤', 'Messages clients', users],
  ].map(([ic,lb,val]) => `
    <div style="background:var(--dark3);border:1px solid var(--border);border-radius:12px;padding:14px 18px;min-width:120px;">
      <div style="font-size:1.4rem;">${ic}</div>
      <div style="font-size:1.3rem;font-weight:800;color:var(--white);margin:4px 0;">${val}</div>
      <div style="font-size:.75rem;color:var(--text-muted);">${lb}</div>
    </div>`).join('');
}

function clearChatData() {
  if (!confirm('Supprimer toutes les conversations chatbot ?')) return;
  localStorage.removeItem('md_chat_conversations');
  renderCbStats();
  showToast('🗑 Conversations supprimées');
}

/* ===== TOAST ===== */
function showToast(msg) {
  let t = document.getElementById('sToast');
  if (!t) {
    t = document.createElement('div'); t.id = 'sToast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e1e1e;border:1px solid rgba(255,255,255,0.12);color:#f5f5f5;padding:12px 20px;border-radius:10px;font-size:.85rem;z-index:9999;transition:opacity .3s;box-shadow:0 8px 32px rgba(0,0,0,.5);';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.opacity = '0', 2500);
}

/* ===== BOOT ===== */
if (sessionStorage.getItem('md_settings') === '1') {
  document.getElementById('sLoginWrap').style.display = 'none';
  document.getElementById('sPanel').style.display = 'flex';
  init();
}

/* ===== BOOKING CONFIG ===== */
let _bCities = [], _bAirports = [], _bHotels = [];

function loadBookingConfig() {
  const cfg = JSON.parse(localStorage.getItem('md_booking_config') || '{}');
  _bCities   = cfg.cities   || [];
  _bAirports = cfg.airports || [];
  _bHotels   = cfg.hotels   || [];
  setBookingMode(cfg.mode || 'delivery');
  document.getElementById('pickupAddress').value = cfg.pickupAddress || '';
  renderDeliveryTags();
}

function setBookingMode(mode) {
  document.getElementById('rmDelivery').checked = mode === 'delivery';
  document.getElementById('rmPickup').checked   = mode === 'pickup';
  document.getElementById('rcDelivery').classList.toggle('active', mode === 'delivery');
  document.getElementById('rcPickup').classList.toggle('active', mode === 'pickup');
  document.getElementById('deliverySection').style.display = mode === 'delivery' ? '' : 'none';
  document.getElementById('pickupSection').style.display   = mode === 'pickup'   ? '' : 'none';
}

function renderDeliveryTags() {
  const tag = (arr, key, i) =>
    `<span class="s-tag">${arr[i]}<button onclick="_b${key}.splice(${i},1);renderDeliveryTags()">×</button></span>`;
  document.getElementById('deliveryCityList').innerHTML    = _bCities.map((_,i)=>tag(_bCities,'Cities',i)).join('');
  document.getElementById('deliveryAirportList').innerHTML = _bAirports.map((_,i)=>tag(_bAirports,'Airports',i)).join('');
  document.getElementById('deliveryHotelList').innerHTML   = _bHotels.map((_,i)=>tag(_bHotels,'Hotels',i)).join('');
}

function addDeliveryItem(type) {
  const ids = { city:'inputCity', airport:'inputAirport', hotel:'inputHotel' };
  const arrs = { city:_bCities, airport:_bAirports, hotel:_bHotels };
  const inp = document.getElementById(ids[type]);
  const v = inp.value.trim();
  if (!v) return;
  arrs[type].push(v);
  inp.value = '';
  inp.focus();
  renderDeliveryTags();
}

function saveBookingConfig() {
  const mode = document.querySelector('input[name="bookingMode"]:checked')?.value || 'delivery';
  localStorage.setItem('md_booking_config', JSON.stringify({
    mode, cities: _bCities, airports: _bAirports, hotels: _bHotels,
    pickupAddress: document.getElementById('pickupAddress').value.trim()
  }));
  const msg = document.getElementById('bookingSaveMsg');
  msg.textContent = '✅ Enregistré !'; msg.style.opacity = '1';
  setTimeout(() => msg.style.opacity = '0', 2500);
}
