'use strict';
/* MarocDrive ChatBot v3 — n8n + ChatGPT, auto-context */

const CHAT_KEY    = 'md_chat_conversations';
const CHAT_CFG    = 'md_chat_config';
const N8N_WEBHOOK = 'https://waasel75.app.n8n.cloud/webhook/marocdrive-chat';

let chatOpen = false, chatSession = null;
let _ctxCache = null; // invalidated on any data change

/* ── CONTEXT (compact text, rebuilt on change) ── */
function buildContext() {
  const now = new Date();

  // Cars — name:price(category)
  const rawCars = localStorage.getItem('md_cars');
  const cars = (rawCars ? JSON.parse(rawCars) : (typeof SITE !== 'undefined' ? SITE.cars : []))
    .map(c => `${c.name}:${c.price}MAD(${c.category})`).join('|');

  // Active offers only
  const offers = JSON.parse(localStorage.getItem('md_offers') || '[]')
    .filter(o => o.active && (!o.exp || new Date(o.exp) >= now))
    .map(o => `-${o.discount}% "${o.title}" sur ${o.car === 'all' ? 'tous' : o.car}`)
    .join('|') || 'aucune';

  // Site settings (name, phone, whatsapp, address)
  const s  = JSON.parse(localStorage.getItem('md_site_settings') || '{}');
  const sc = typeof SITE !== 'undefined' ? SITE : {};
  const phone = s.phone   || sc.phone    || '+212 634 829 085';
  const wa    = s.wa      || sc.whatsapp || '212634829085';
  const name  = s.name    || sc.name     || 'MarocDrive';
  const addr  = s.address || '';

  // Booking config (mode, cities, airports, pickup address)
  const bc       = JSON.parse(localStorage.getItem('md_booking_config') || '{}');
  const cities   = (bc.cities?.length   ? bc.cities   : ['Casablanca','Marrakech','Agadir','Fès','Tanger','Rabat']).join(',');
  const airports = (bc.airports?.length ? bc.airports : ['CMN','RAK','AGA','TNG']).join('/');
  const mode     = bc.mode || 'delivery';
  const pickup   = bc.pickupAddress || '';

  return [
    `AGENCE:${name}|TEL:${phone}|WA:${wa}${addr ? '|ADDR:' + addr : ''}`,
    `VOITURES:${cars}`,
    `OFFRES:${offers}`,
    `BOOKING:${mode}|VILLES:${cities}|AEROPORTS:${airports}${pickup ? '|RETRAIT:' + pickup : ''}`
  ].join('\n');
}

function getCtx() {
  if (!_ctxCache) _ctxCache = buildContext();
  return _ctxCache;
}

/* ── SEND TO n8n ── */
async function askGPT(message) {
  const res = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: chatSession?.id || 'default',
      message,
      ctx: getCtx()
    })
  });
  if (!res.ok) throw new Error('n8n ' + res.status);
  const data = await res.json();
  return data.reply || '...';
}

/* ── UI ── */
function buildChatWidget() {
  const cfg = JSON.parse(localStorage.getItem(CHAT_CFG) || '{"active":true}');
  if (cfg.active === false) return;
  if (document.getElementById('chatWidget')) return;

  const w = document.createElement('div');
  w.id = 'chatWidget';
  w.innerHTML = `
    <button class="chat-fab" id="chatFab" onclick="toggleChat()" aria-label="Chat">
      <svg class="chat-icon-open" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
      <svg class="chat-icon-close" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      <span class="chat-notif" id="chatNotif">1</span>
    </button>
    <div class="chat-window" id="chatWindow">
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="chat-avatar">🤖</div>
          <div>
            <div class="chat-agent-name">${cfg.agentName || 'Assistant MarocDrive'}</div>
            <div class="chat-status"><span class="chat-dot"></span> En ligne</div>
          </div>
        </div>
        <button class="chat-close-btn" onclick="toggleChat()">✕</button>
      </div>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-row">
        <input type="text" id="chatInput" placeholder="Écrivez votre message..." onkeydown="if(event.key==='Enter')sendChat()"/>
        <button class="chat-send-btn" onclick="sendChat()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>`;
  document.body.appendChild(w);
  chatSession = { id: Date.now(), startedAt: new Date().toISOString(), messages: [] };
  setTimeout(() => {
    addBotMsg(cfg.welcomeMsg || 'Bonjour ! 😊 Je suis votre assistant **MarocDrive**. Comment puis-je vous aider ?');
    document.getElementById('chatNotif').style.display = 'flex';
  }, 1800);
}

function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chatWindow').classList.toggle('open', chatOpen);
  document.querySelector('.chat-icon-open').style.display = chatOpen ? 'none' : 'block';
  document.querySelector('.chat-icon-close').style.display = chatOpen ? 'block' : 'none';
  if (chatOpen) {
    document.getElementById('chatNotif').style.display = 'none';
    document.getElementById('chatInput').focus();
  }
}

function chatEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function addMsg(content, role) {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.innerHTML = `<div class="chat-bubble">${chatEsc(content)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    .replace(/\n/g, '<br/>')
  }</div><div class="chat-time">${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  if (chatSession) {
    chatSession.messages.push({ role, content, time: new Date().toISOString() });
    const all = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    const idx = all.findIndex(s => s.id === chatSession.id);
    if (idx >= 0) all[idx] = chatSession; else all.unshift(chatSession);
    localStorage.setItem(CHAT_KEY, JSON.stringify(all.slice(0, 200)));
  }
}
function addBotMsg(t) { addMsg(t, 'bot'); }

function showTyping() {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = 'chat-msg bot'; div.id = 'chatTyping';
  div.innerHTML = '<div class="chat-bubble" style="opacity:.55;letter-spacing:3px">•••</div>';
  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
}
function hideTyping() { document.getElementById('chatTyping')?.remove(); }

async function sendChat() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = ''; input.disabled = true;
  addMsg(text, 'user');
  showTyping();
  try {
    addBotMsg(await askGPT(text));
  } catch {
    addBotMsg('Désolé, une erreur est survenue. Contactez-nous sur WhatsApp 😊');
  } finally {
    hideTyping(); input.disabled = false; input.focus();
  }
}

/* ── AUTO-REFRESH CONTEXT on data change ── */
const DATA_KEYS = new Set(['md_cars','md_offers','md_site_settings','md_booking_config']);
window.addEventListener('storage', e => {
  if (DATA_KEYS.has(e.key)) _ctxCache = null;         // invalidate context
  if (e.key === CHAT_CFG) {                            // chatbot toggled
    document.getElementById('chatWidget')?.remove();
    chatSession = null; buildChatWidget();
  }
});
window.addEventListener('db-synced', () => { _ctxCache = null; }); // Firebase sync

/* ── BOOT ── */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildChatWidget);
else buildChatWidget();
