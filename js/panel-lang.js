'use strict';
/* ===== ADMIN/SETTINGS PANEL UI LANGUAGE ===== */
const PANEL_LANGS = {
  fr: { dir:'ltr', brand:'Paramètres', 'nav-cars':'Voitures', 'nav-res':'Réservations', 'nav-chatbot':'Chatbot',
    'nav-offers':'Offres & Promos', 'nav-site':'Paramètres site', 'nav-security':'Sécurité',
    'view-site':'Voir le site', dashboard:'Dashboard', settings:'Paramètres', logout:'Déconnexion',
    'nav-dash':'Dashboard', 'nav-stats':'Statistiques', 'nav-chats':'Conversations', 'chatbot-label':'Chatbot',
    'nav-vehicles':'Véhicules', 'nav-vidange':'Vidange',
    'h-cars-t':'Gestion des véhicules', 'h-cars-s':'Modifiez les photos, prix et informations de chaque véhicule',
    'h-res-t':'Gestion des réservations', 'h-res-s':'Bloquez ou libérez des dates pour chaque véhicule',
    'h-cb-t':'🤖 Paramètres Chatbot', 'h-cb-s':'Configurez et contrôlez le chatbot de votre site',
    'h-of-t':'Offres & Promotions', 'h-of-s':'Créez des offres spéciales sur tous les véhicules ou sur un véhicule précis',
    'h-site-t':'Paramètres du site', 'h-site-s':'Configurez les informations générales de votre site',
    'h-sec-t':'🔐 Sécurité', 'h-sec-s':"Identifiants d'accès et question de récupération en cas de mot de passe oublié",
    'st-pending':'En attente','st-payment_pending':'Paiement en cours','st-confirmed':'Confirmé','st-completed':'Terminé','st-cancelled':'Annulé',
    'veh-available':'Disponible','veh-reserved':'Réservé','veh-maintenance':'Chez le mécanicien','veh-accident':'Accidenté',
    'vf-name':'Nom du véhicule','vf-plate':'Plaque','vf-brand':'Marque','vf-model':'Modèle','vf-year':'Année',
    'vf-color':'Couleur','vf-fuel':'Carburant','vf-gearbox':'Boîte','vf-price':'Prix/jour (MAD)','vf-mileage':'Kilométrage actuel',
    'vf-lastvidange':'Dernière vidange (km)','vf-interval':'Intervalle vidange (km)','vf-insurance':'Assurance — échéance','vf-visit':'Visite technique — échéance',
    titles:{dashboard:'Dashboard',reservations:'Réservations',vehicles:'🚙 Véhicules',vidange:'🛢️ Vidange',stats:'Statistiques',chats:'Conversations'} },
  en: { dir:'ltr', brand:'Settings', 'nav-cars':'Cars', 'nav-res':'Reservations', 'nav-chatbot':'Chatbot',
    'nav-offers':'Offers & Promos', 'nav-site':'Site settings', 'nav-security':'Security',
    'view-site':'View site', dashboard:'Dashboard', settings:'Settings', logout:'Log out',
    'nav-dash':'Dashboard', 'nav-stats':'Statistics', 'nav-chats':'Conversations', 'chatbot-label':'Chatbot',
    'nav-vehicles':'Vehicles', 'nav-vidange':'Oil change',
    'h-cars-t':'Vehicle management', 'h-cars-s':'Edit photos, prices and info for each vehicle',
    'h-res-t':'Reservation management', 'h-res-s':'Block or free up dates for each vehicle',
    'h-cb-t':'🤖 Chatbot settings', 'h-cb-s':'Configure and control your site chatbot',
    'h-of-t':'Offers & Promotions', 'h-of-s':'Create special offers on all vehicles or a specific one',
    'h-site-t':'Site settings', 'h-site-s':'Configure your site general information',
    'h-sec-t':'🔐 Security', 'h-sec-s':'Login credentials and recovery question in case you forget your password',
    'st-pending':'Pending','st-payment_pending':'Payment in progress','st-confirmed':'Confirmed','st-completed':'Completed','st-cancelled':'Cancelled',
    'veh-available':'Available','veh-reserved':'Reserved','veh-maintenance':'At the mechanic','veh-accident':'In an accident',
    'vf-name':'Vehicle name','vf-plate':'Plate','vf-brand':'Brand','vf-model':'Model','vf-year':'Year',
    'vf-color':'Color','vf-fuel':'Fuel','vf-gearbox':'Gearbox','vf-price':'Price/day (MAD)','vf-mileage':'Current mileage',
    'vf-lastvidange':'Last oil change (km)','vf-interval':'Oil change interval (km)','vf-insurance':'Insurance — due date','vf-visit':'Technical inspection — due date',
    titles:{dashboard:'Dashboard',reservations:'Reservations',vehicles:'🚙 Vehicles',vidange:'🛢️ Oil change',stats:'Statistics',chats:'Conversations'} },
  es: { dir:'ltr', brand:'Ajustes', 'nav-cars':'Vehículos', 'nav-res':'Reservas', 'nav-chatbot':'Chatbot',
    'nav-offers':'Ofertas y Promos', 'nav-site':'Ajustes del sitio', 'nav-security':'Seguridad',
    'view-site':'Ver el sitio', dashboard:'Panel', settings:'Ajustes', logout:'Cerrar sesión',
    'nav-dash':'Panel', 'nav-stats':'Estadísticas', 'nav-chats':'Conversaciones', 'chatbot-label':'Chatbot',
    'nav-vehicles':'Vehículos', 'nav-vidange':'Cambio de aceite',
    'h-cars-t':'Gestión de vehículos', 'h-cars-s':'Edita fotos, precios e información de cada vehículo',
    'h-res-t':'Gestión de reservas', 'h-res-s':'Bloquea o libera fechas para cada vehículo',
    'h-cb-t':'🤖 Ajustes del Chatbot', 'h-cb-s':'Configura y controla el chatbot de tu sitio',
    'h-of-t':'Ofertas y Promociones', 'h-of-s':'Crea ofertas especiales en todos los vehículos o en uno específico',
    'h-site-t':'Ajustes del sitio', 'h-site-s':'Configura la información general de tu sitio',
    'h-sec-t':'🔐 Seguridad', 'h-sec-s':'Credenciales de acceso y pregunta de recuperación por si olvidas tu contraseña',
    titles:{dashboard:'Panel',reservations:'Reservas',vehicles:'🚙 Vehículos',vidange:'🛢️ Cambio de aceite',stats:'Estadísticas',chats:'Conversaciones'} },
  ar: { dir:'rtl', brand:'الإعدادات', 'nav-cars':'السيارات', 'nav-res':'الحجوزات', 'nav-chatbot':'الشات بوت',
    'nav-offers':'العروض والترويجات', 'nav-site':'إعدادات الموقع', 'nav-security':'الأمان',
    'view-site':'عرض الموقع', dashboard:'لوحة التحكم', settings:'الإعدادات', logout:'تسجيل الخروج',
    'nav-dash':'لوحة التحكم', 'nav-stats':'الإحصائيات', 'nav-chats':'المحادثات', 'chatbot-label':'الشات بوت',
    'nav-vehicles':'السيارات', 'nav-vidange':'الفيدانج',
    'h-cars-t':'إدارة السيارات', 'h-cars-s':'عدّل الصور والأسعار ومعلومات كل سيارة',
    'h-res-t':'إدارة الحجوزات', 'h-res-s':'حظر أو تحرير التواريخ لكل سيارة',
    'h-cb-t':'🤖 إعدادات الشات بوت', 'h-cb-s':'تحكم في الشات بوت الخاص بموقعك',
    'h-of-t':'العروض والترويجات', 'h-of-s':'أنشئ عروضاً خاصة على جميع السيارات أو على سيارة محددة',
    'h-site-t':'إعدادات الموقع', 'h-site-s':'تحكم في المعلومات العامة لموقعك',
    'h-sec-t':'🔐 الأمان', 'h-sec-s':'معلومات تسجيل الدخول وسؤال الاسترجاع في حال نسيان كلمة المرور',
    'st-pending':'فالانتظار','st-payment_pending':'الدفع جاري','st-confirmed':'مؤكد','st-completed':'منتهي','st-cancelled':'ملغى',
    'veh-available':'متاحة','veh-reserved':'محجوزة','veh-maintenance':'عند المكانيك','veh-accident':'حادثة',
    'vf-name':'اسم السيارة','vf-plate':'الماتريكول','vf-brand':'الماركة','vf-model':'الموديل','vf-year':'السنة',
    'vf-color':'الكولور','vf-fuel':'الكاربوران','vf-gearbox':'البواط','vf-price':'السعر/اليوم (MAD)','vf-mileage':'الكيلومتراج الحالي',
    'vf-lastvidange':'آخر فيدانج (km)','vf-interval':'إنترفال الفيدانج (km)','vf-insurance':'التأمين — تاريخ الانتهاء','vf-visit':'الزيارة التقنية — تاريخ الانتهاء',
    titles:{dashboard:'لوحة التحكم',reservations:'الحجوزات',vehicles:'🚙 السيارات',vidange:'🛢️ الفيدانج',stats:'الإحصائيات',chats:'المحادثات'} },
};

/* Clés supplémentaires (CRM) fusionnées sans toucher aux tables de base */
Object.assign(PANEL_LANGS.fr, {'nav-clients':'Clients','nav-availability':'Disponibilité','admin-panel':'Admin Panel','crm-h':'Connexion CRM','crm-sub':'Accès réservé aux administrateurs'});
Object.assign(PANEL_LANGS.en, {'nav-clients':'Clients','nav-availability':'Availability','admin-panel':'Admin Panel','crm-h':'CRM Login','crm-sub':'Administrators only'});
Object.assign(PANEL_LANGS.es, {'nav-clients':'Clientes','nav-availability':'Disponibilidad','admin-panel':'Panel Admin','crm-h':'Acceso CRM','crm-sub':'Solo administradores'});
Object.assign(PANEL_LANGS.ar, {'nav-clients':'العملاء','nav-availability':'التوفر','admin-panel':'لوحة الأدمين','crm-h':'دخول CRM','crm-sub':'مخصص للمشرفين فقط'});
PANEL_LANGS.fr.titles = Object.assign({clients:'Clients',availability:'Disponibilité'}, PANEL_LANGS.fr.titles);
PANEL_LANGS.en.titles = Object.assign({clients:'Clients',availability:'Availability'}, PANEL_LANGS.en.titles);
PANEL_LANGS.es.titles = Object.assign({clients:'Clientes',availability:'Disponibilidad'}, PANEL_LANGS.es.titles);
PANEL_LANGS.ar.titles = Object.assign({clients:'العملاء',availability:'التوفر'}, PANEL_LANGS.ar.titles);

function curLang() { return localStorage.getItem('md_panel_lang') || 'fr'; }
function T(key) { const L = PANEL_LANGS[curLang()] || PANEL_LANGS.fr; return L[key] != null ? L[key] : (PANEL_LANGS.fr[key] || key); }

function applyPanelLang(code) {
  const L = PANEL_LANGS[code] || PANEL_LANGS.fr;
  localStorage.setItem('md_panel_lang', code);
  document.documentElement.lang = code;
  document.documentElement.dir = L.dir;
  document.querySelectorAll('[data-pt]').forEach(el => {
    const v = L[el.dataset.pt];
    if (v) el.textContent = v;
  });
  document.querySelectorAll('#panelLangSel, .panelLangSel').forEach(sel => { sel.value = code; });
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle && window.currentAdminTab) pageTitle.textContent = (L.titles && L.titles[window.currentAdminTab]) || pageTitle.textContent;
  // Titre de la barre du CRM (section active)
  const crmTitle = document.getElementById('topbarTitle');
  if (crmTitle && window.currentCrmSection && L.titles && L.titles[window.currentCrmSection]) crmTitle.textContent = L.titles[window.currentCrmSection];
  if (window.currentAdminTab && typeof showTab === 'function' && document.getElementById('app')?.style.display !== 'none') {
    const activeLink = document.querySelector('.sb-link.active');
    if (activeLink) showTab(window.currentAdminTab, activeLink);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyPanelLang(localStorage.getItem('md_panel_lang') || 'fr');
});

// Synchronisation live entre panneaux ouverts : changer la langue dans un
// panneau l'applique instantanément dans tous les autres onglets ouverts.
window.addEventListener('storage', e => {
  if (e.key === 'md_panel_lang' && e.newValue) applyPanelLang(e.newValue);
});
