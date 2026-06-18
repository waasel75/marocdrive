'use strict';

/* ===== SITE CONFIG (from settings panel) ===== */
function getSiteConfig() {
  const cfg = JSON.parse(localStorage.getItem('md_site_settings') || '{}');
  return {
    phone: cfg.phone || '+212 634 829 085',
    wa: (r => r.startsWith('0') ? '212' + r.slice(1) : r)((cfg.wa || '212634829085').replace(/\D/g,'')),
    social: cfg.social || {},
    mapsLink: cfg.mapsLink || '',
    name: cfg.name || 'MarocDrive',
    logo: cfg.logo || '',
    aboutImages: (cfg.aboutImages || []).filter(Boolean),
    heroBg: cfg.heroBg || '',
    heroCar: cfg.heroCar || '',
    email: cfg.email || '',
    address: cfg.address || '',
  };
}

let aboutSlideTimer = null;
function applyAboutImages(images) {
  const card = document.getElementById('aboutCardBig');
  if (!card) return;
  const placeholder = document.getElementById('aboutImgPlaceholder');
  card.querySelectorAll('.about-img-slide, .about-img-dots').forEach(el => el.remove());
  if (aboutSlideTimer) { clearInterval(aboutSlideTimer); aboutSlideTimer = null; }
  if (!images.length) { if (placeholder) placeholder.style.display = 'flex'; return; }
  if (placeholder) placeholder.style.display = 'none';
  images.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'about-img-slide' + (i === 0 ? ' active' : '');
    card.appendChild(img);
  });
  if (images.length > 1) {
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'about-img-dots';
    dotsWrap.innerHTML = images.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('');
    card.appendChild(dotsWrap);

    let current = 0;
    const slides = card.querySelectorAll('.about-img-slide');
    const dots = dotsWrap.querySelectorAll('span');
    aboutSlideTimer = setInterval(() => {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }, 4000);
  }
}

function applyBranding(cfg) {
  const words = cfg.name.trim().split(' ');
  const last = words.pop();
  const textHtml = (words.length ? words.join(' ') + ' ' : '') + `<strong>${last}</strong>`;
  const isImg = /^(https?:|data:)/.test(cfg.logo);
  ['Header','Footer'].forEach(pos => {
    const icon = document.getElementById('logoIcon'+pos);
    const text = document.getElementById('logoText'+pos);
    if (icon) icon.innerHTML = isImg ? `<img src="${cfg.logo}" style="max-height:40px;max-width:160px;width:auto;height:auto;object-fit:contain;vertical-align:middle;display:block;"/>` : (cfg.logo || '🚗');
    if (text) text.innerHTML = textHtml;
  });
}

function applyBookingConfig() {
  const bc = JSON.parse(localStorage.getItem('md_booking_config') || '{"mode":"delivery","cities":[],"airports":[]}');
  const pickupSel = document.querySelector('[data-t="pickup-select"]');
  const mCitySel  = document.getElementById('mCity');
  [pickupSel, mCitySel].forEach(sel => {
    if (!sel) return;
    const saved = sel.value;
    sel.innerHTML = '<option value="">Choisir un lieu</option>';
    if (bc.mode === 'pickup') {
      const addr = bc.pickupAddress || 'Notre agence';
      sel.innerHTML += `<option value="${addr}">${addr}</option>`;
    } else {
      if (bc.cities?.length)   sel.innerHTML += `<optgroup label="🏙️ Villes">${bc.cities.map(c=>`<option>${c}</option>`).join('')}</optgroup>`;
      if (bc.airports?.length) sel.innerHTML += `<optgroup label="✈️ Aéroports">${bc.airports.map(a=>`<option>✈️ ${a}</option>`).join('')}</optgroup>`;
      if (bc.hotels?.length)   sel.innerHTML += `<optgroup label="🏨 Hôtels / Riads">${bc.hotels.map(h=>`<option>🏨 ${h}</option>`).join('')}</optgroup>`;
    }
    if (saved) sel.value = saved;
  });
}

function applySiteConfig() {
  const cfg = getSiteConfig();
  applyBranding(cfg);
  applyBookingConfig();
  applyAboutImages(cfg.aboutImages);
  const heroBg = document.getElementById('heroBg');
  if (heroBg && cfg.heroBg) heroBg.style.backgroundImage = `url('${cfg.heroBg}')`;
  const heroCarImg = document.getElementById('heroCarImg');
  if (heroCarImg && cfg.heroCar) heroCarImg.src = cfg.heroCar;
  const phoneTel = cfg.phone.replace(/[^\d+]/g,'');

  const waBtn = document.getElementById('waFloatBtn');
  if (waBtn) waBtn.href = `https://wa.me/${cfg.wa}`;
  const cpCall = document.getElementById('cpCallBtn');
  if (cpCall) { cpCall.href = `tel:${phoneTel}`; cpCall.textContent = cfg.phone; }
  const cpWa = document.getElementById('cpWaBtn');
  if (cpWa) cpWa.href = `https://wa.me/${cfg.wa}?text=${encodeURIComponent('Bonjour, je voudrais réserver une voiture.')}`;
  const phoneText = document.getElementById('contactPhoneText');
  if (phoneText) phoneText.textContent = cfg.phone;
  const emailText = document.getElementById('contactEmailText');
  if (emailText && cfg.email) emailText.textContent = cfg.email;
  const addrText = document.getElementById('contactAddrText');
  if (addrText && cfg.address) addrText.textContent = cfg.address;

  const SOCIAL_ICONS = {
    socialFb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94Z"/></svg>',
    socialIg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>',
    socialTt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 2h-3.2v13.7a3.1 3.1 0 1 1-2.2-3v-3.3a6.4 6.4 0 1 0 5.4 6.3V8.4a6.9 6.9 0 0 0 4.4 1.6V6.8a3.9 3.9 0 0 1-4.4-4.1V2Z"/></svg>',
  };
  const socials = { socialFb: cfg.social.facebook, socialIg: cfg.social.instagram, socialTt: cfg.social.tiktok };
  Object.entries(socials).forEach(([id, s]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (s && s.enabled && s.url) { el.href = s.url; el.innerHTML = SOCIAL_ICONS[id]; el.style.display = 'flex'; }
    else el.style.display = 'none';
  });

  const mapsSection = document.getElementById('mapsSection');
  const mapsFrame = document.getElementById('mapsFrame');
  if (mapsSection && mapsFrame) {
    const src = buildMapsEmbedSrc(cfg.mapsLink);
    if (src) { mapsFrame.src = src; mapsSection.style.display = 'block'; }
    else mapsSection.style.display = 'none';
  }
}

/* Converts a pasted Google Maps link (or plain address) into a working embed URL. */
function buildMapsEmbedSrc(link) {
  if (!link) return '';
  link = link.trim();
  if (link.includes('/maps/embed')) return link;
  if (!/^https?:\/\//.test(link)) return `https://www.google.com/maps?q=${encodeURIComponent(link)}&output=embed`;
  const coordMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
  const placeMatch = link.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) return `https://www.google.com/maps?q=${encodeURIComponent(decodeURIComponent(placeMatch[1]).replace(/\+/g,' '))}&output=embed`;
  try {
    const q = new URL(link).searchParams.get('q');
    if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  } catch (e) {}
  return link.includes('output=embed') ? link : link + (link.includes('?') ? '&' : '?') + 'output=embed';
}

/* ===== TRANSLATIONS ===== */
const LANGS = {
  fr: {
    code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr',
    nav: { fleet:'Notre Flotte', how:'Comment ça marche', about:'À propos', contact:'Contact', book:'Réserver' },
    hero: {
      badge: 'Location de voitures — Maroc',
      title1: 'Voyagez libre,',
      title2: 'partout au Maroc',
      sub: 'Flotte moderne, prix transparents, livraison à votre hôtel.\nCasablanca · Marrakech · Agadir · Fès · Tanger',
      pickup: '📍 Lieu de prise en charge',
      pickupPh: 'Choisir une ville',
      dateStart: '📅 Date de début',
      dateEnd: '📅 Date de fin',
      searchBtn: 'Rechercher',
      stats: ['Véhicules', 'Villes', 'Clients satisfaits', "Ans d'expérience"],
    },
    features: [
      { icon:'🛡️', title:'Assurance complète', text:'Tous nos véhicules sont couverts par une assurance tous risques incluse dans le prix.' },
      { icon:'🚀', title:'Livraison gratuite', text:"Nous livrons votre voiture à l'aéroport ou à votre hôtel sans frais supplémentaires." },
      { icon:'💳', title:'Paiement flexible', text:"Payez en ligne ou en espèces. Annulation gratuite 48h avant la prise en charge." },
      { icon:'📞', title:'Support 24/7', text:"Notre équipe est disponible 24h/24 en français, arabe et anglais." },
    ],
    fleet: {
      badge: 'Notre Flotte', title: 'Choisissez votre véhicule',
      sub: 'Des citadines économiques aux SUV premium, nous avons le véhicule qu\'il vous faut.',
      filters: ['Tous','Économique','SUV','Premium','Électrique'],
      perDay: 'par jour · TTC', bookBtn: 'Réserver',
    },
    how: {
      badge: 'Simple & Rapide', title: 'Comment ça marche ?', sub: 'Réserver votre voiture en 3 étapes simples.',
      steps: [
        { num:'01', icon:'🔍', title:'Choisissez', text:'Sélectionnez votre ville, vos dates et le véhicule qui correspond à vos besoins.' },
        { num:'02', icon:'📋', title:'Réservez', text:'Remplissez le formulaire en ligne — simple et sécurisé. Confirmation immédiate.' },
        { num:'03', icon:'🗝️', title:'Profitez', text:'Nous livrons votre voiture où vous êtes. Prenez la route et explorez le Maroc !' },
      ],
    },
    testimonials: { badge:'Avis Clients', title:'Ce que disent nos clients' },
    about: {
      badge: 'À propos de nous', title: 'Leader de la location de voitures au Maroc',
      p1: 'Depuis 2016, MarocDrive accompagne les voyageurs et les professionnels dans leurs déplacements au Maroc. Notre flotte de plus de 500 véhicules couvre toutes les grandes villes du royaume.',
      p2: 'Notre mission : vous offrir une expérience de location sans stress, transparente et mémorable.',
      list: ['Prix toujours affichés, sans frais cachés','Véhicules récents < 3 ans','Kilomètres illimités inclus','Assistance routière 24/7'],
      cta: 'Réserver maintenant',
    },
    contact: {
      badge: 'Contactez-nous', title: 'Nous sommes là pour vous',
      items: [['📞','Téléphone / WhatsApp','+212 6XX XXX XXX'],['✉️','Email','contact@marocdrive.ma'],['📍','Adresse','Casablanca, Maroc']],
      form: { fname:'Prénom', lname:'Nom', email:'Email', phone:'Téléphone', msg:'Message',
        fnamePh:'Mohammed', lnamePh:'Alami', emailPh:'vous@example.com', phonePh:'+212 6XX XXX XXX', msgPh:'Votre message...', send:'Envoyer le message' },
    },
    footer: { desc:"La référence de la location de voitures au Maroc depuis 2016.", nav:'Navigation', cities:'Villes', legal:'Légal',
      navLinks:['Notre Flotte','Comment ça marche','À propos','Contact'],
      cityLinks:['Casablanca','Marrakech','Agadir','Fès','Tanger'],
      legalLinks:['Conditions générales','Politique de confidentialité','Mentions légales'],
      copy:'© 2026 MarocDrive. Tous droits réservés.',
    },
    toast: { search:'🔍 Recherche en cours… Redirection vers les résultats.', contact:"✅ Message envoyé ! Nous vous répondrons dans les 24h.", book:(n)=>`✅ "${n}" sélectionné ! Complétez votre réservation ci-dessus.` },
    cities: ['Tétouan','Martil',"M'Diq",'Fnideq','Tanger','Chefchaouen','Rabat','Casablanca','Marrakech','✈️ Aéroport Tanger Ibn Batouta','✈️ Aéroport Casablanca CMN','✈️ Aéroport Marrakech RAK','🏨 Hôtel / Riad (préciser à la réservation)'],
  },

  en: {
    code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr',
    nav: { fleet:'Our Fleet', how:'How it works', about:'About', contact:'Contact', book:'Book Now' },
    hero: {
      badge: 'Car Rental — Morocco',
      title1: 'Travel free,',
      title2: 'anywhere in Morocco',
      sub: 'Modern fleet, transparent prices, delivery to your hotel.\nCasablanca · Marrakech · Agadir · Fès · Tangier',
      pickup: '📍 Pickup Location',
      pickupPh: 'Choose a city',
      dateStart: '📅 Start Date',
      dateEnd: '📅 End Date',
      searchBtn: 'Search',
      stats: ['Vehicles', 'Cities', 'Happy Clients', 'Years Experience'],
    },
    features: [
      { icon:'🛡️', title:'Full Insurance', text:'All our vehicles come with comprehensive all-risk insurance included in the price.' },
      { icon:'🚀', title:'Free Delivery', text:'We deliver your car to the airport or your hotel at no extra charge.' },
      { icon:'💳', title:'Flexible Payment', text:'Pay online or in cash. Free cancellation 48h before pickup.' },
      { icon:'📞', title:'24/7 Support', text:'Our team is available around the clock in French, Arabic and English.' },
    ],
    fleet: {
      badge: 'Our Fleet', title: 'Choose your vehicle',
      sub: 'From economical city cars to premium SUVs, we have the vehicle you need.',
      filters: ['All','Economy','SUV','Premium','Electric'],
      perDay: 'per day · VAT incl.', bookBtn: 'Book',
    },
    how: {
      badge: 'Simple & Fast', title: 'How does it work?', sub: 'Book your car in 3 simple steps.',
      steps: [
        { num:'01', icon:'🔍', title:'Choose', text:'Select your city, dates and the vehicle that fits your needs.' },
        { num:'02', icon:'📋', title:'Book', text:'Fill in the online form — simple and secure. Instant confirmation.' },
        { num:'03', icon:'🗝️', title:'Enjoy', text:'We deliver your car wherever you are. Hit the road and explore Morocco!' },
      ],
    },
    testimonials: { badge:'Client Reviews', title:'What our clients say' },
    about: {
      badge: 'About Us', title: 'Morocco\'s leading car rental company',
      p1: 'Since 2016, MarocDrive has been supporting travellers and professionals in their journeys across Morocco. Our fleet of 500+ vehicles covers all major cities in the kingdom.',
      p2: 'Our mission: to offer you a stress-free, transparent and memorable rental experience.',
      list: ['Prices always shown, no hidden fees','Recent vehicles < 3 years old','Unlimited mileage included','24/7 roadside assistance'],
      cta: 'Book Now',
    },
    contact: {
      badge: 'Contact Us', title: 'We\'re here for you',
      items: [['📞','Phone / WhatsApp','+212 6XX XXX XXX'],['✉️','Email','contact@marocdrive.ma'],['📍','Address','Casablanca, Morocco']],
      form: { fname:'First Name', lname:'Last Name', email:'Email', phone:'Phone', msg:'Message',
        fnamePh:'Mohammed', lnamePh:'Alami', emailPh:'you@example.com', phonePh:'+212 6XX XXX XXX', msgPh:'Your message...', send:'Send Message' },
    },
    footer: { desc:'Morocco\'s reference for car rental since 2016.', nav:'Navigation', cities:'Cities', legal:'Legal',
      navLinks:['Our Fleet','How it works','About','Contact'],
      cityLinks:['Casablanca','Marrakech','Agadir','Fès','Tangier'],
      legalLinks:['Terms & Conditions','Privacy Policy','Legal Notice'],
      copy:'© 2026 MarocDrive. All rights reserved.',
    },
    toast: { search:'🔍 Searching… Redirecting to results.', contact:'✅ Message sent! We\'ll reply within 24h.', book:(n)=>`✅ "${n}" selected! Complete your booking above.` },
    cities: ['Casablanca — CMN Airport','Marrakech — RAK Airport','Agadir — AGA Airport','Fès — FEZ Airport','Tangier — TNG Airport'],
  },

  es: {
    code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr',
    nav: { fleet:'Nuestra Flota', how:'Cómo funciona', about:'Nosotros', contact:'Contacto', book:'Reservar' },
    hero: {
      badge: 'Alquiler de coches — Marruecos',
      title1: 'Viaja libre,',
      title2: 'por todo Marruecos',
      sub: 'Flota moderna, precios transparentes, entrega en tu hotel.\nCasablanca · Marrakech · Agadir · Fès · Tánger',
      pickup: '📍 Lugar de recogida',
      pickupPh: 'Elegir una ciudad',
      dateStart: '📅 Fecha de inicio',
      dateEnd: '📅 Fecha de fin',
      searchBtn: 'Buscar',
      stats: ['Vehículos', 'Ciudades', 'Clientes satisfechos', 'Años de experiencia'],
    },
    features: [
      { icon:'🛡️', title:'Seguro completo', text:'Todos nuestros vehículos tienen seguro a todo riesgo incluido en el precio.' },
      { icon:'🚀', title:'Entrega gratuita', text:'Entregamos su coche en el aeropuerto o en su hotel sin cargos adicionales.' },
      { icon:'💳', title:'Pago flexible', text:'Pague en línea o en efectivo. Cancelación gratuita 48h antes de la recogida.' },
      { icon:'📞', title:'Soporte 24/7', text:'Nuestro equipo está disponible las 24h en francés, árabe e inglés.' },
    ],
    fleet: {
      badge: 'Nuestra Flota', title: 'Elige tu vehículo',
      sub: 'Desde utilitarios económicos hasta SUV premium, tenemos el vehículo que necesitas.',
      filters: ['Todos','Económico','SUV','Premium','Eléctrico'],
      perDay: 'por día · IVA incl.', bookBtn: 'Reservar',
    },
    how: {
      badge: 'Simple y Rápido', title: '¿Cómo funciona?', sub: 'Reserva tu coche en 3 simples pasos.',
      steps: [
        { num:'01', icon:'🔍', title:'Elige', text:'Selecciona tu ciudad, fechas y el vehículo que se adapta a tus necesidades.' },
        { num:'02', icon:'📋', title:'Reserva', text:'Rellena el formulario en línea — simple y seguro. Confirmación inmediata.' },
        { num:'03', icon:'🗝️', title:'Disfruta', text:'Entregamos tu coche donde estés. ¡Pon rumbo y explora Marruecos!' },
      ],
    },
    testimonials: { badge:'Opiniones', title:'Lo que dicen nuestros clientes' },
    about: {
      badge: 'Sobre nosotros', title: 'Líder del alquiler de coches en Marruecos',
      p1: 'Desde 2016, MarocDrive acompaña a viajeros y profesionales en sus desplazamientos por Marruecos. Nuestra flota de más de 500 vehículos cubre todas las grandes ciudades del reino.',
      p2: 'Nuestra misión: ofrecerle una experiencia de alquiler sin estrés, transparente y memorable.',
      list: ['Precios siempre visibles, sin cargos ocultos','Vehículos recientes < 3 años','Kilómetros ilimitados incluidos','Asistencia en carretera 24/7'],
      cta: 'Reservar ahora',
    },
    contact: {
      badge: 'Contáctanos', title: 'Estamos aquí para ti',
      items: [['📞','Teléfono / WhatsApp','+212 6XX XXX XXX'],['✉️','Email','contact@marocdrive.ma'],['📍','Dirección','Casablanca, Marruecos']],
      form: { fname:'Nombre', lname:'Apellido', email:'Email', phone:'Teléfono', msg:'Mensaje',
        fnamePh:'Mohammed', lnamePh:'Alami', emailPh:'tu@ejemplo.com', phonePh:'+212 6XX XXX XXX', msgPh:'Tu mensaje...', send:'Enviar mensaje' },
    },
    footer: { desc:'La referencia del alquiler de coches en Marruecos desde 2016.', nav:'Navegación', cities:'Ciudades', legal:'Legal',
      navLinks:['Nuestra Flota','Cómo funciona','Nosotros','Contacto'],
      cityLinks:['Casablanca','Marrakech','Agadir','Fès','Tánger'],
      legalLinks:['Términos y condiciones','Política de privacidad','Aviso legal'],
      copy:'© 2026 MarocDrive. Todos los derechos reservados.',
    },
    toast: { search:'🔍 Buscando… Redirigiendo a los resultados.', contact:'✅ ¡Mensaje enviado! Te responderemos en 24h.', book:(n)=>`✅ "${n}" seleccionado. ¡Completa tu reserva arriba!` },
    cities: ['Casablanca — Aeropuerto CMN','Marrakech — Aeropuerto RAK','Agadir — Aeropuerto AGA','Fès — Aeropuerto FEZ','Tánger — Aeropuerto TNG'],
  },

  ar: {
    code: 'ar', label: 'العربية', flag: '🇲🇦', dir: 'rtl',
    nav: { fleet:'أسطولنا', how:'كيف يعمل', about:'من نحن', contact:'اتصل بنا', book:'احجز الآن' },
    hero: {
      badge: 'تأجير السيارات — المغرب',
      title1: 'سافر بحرية،',
      title2: 'في كل مكان بالمغرب',
      sub: 'أسطول حديث، أسعار شفافة، توصيل إلى فندقك.\nالدار البيضاء · مراكش · أكادير · فاس · طنجة',
      pickup: '📍 مكان الاستلام',
      pickupPh: 'اختر مدينة',
      dateStart: '📅 تاريخ البداية',
      dateEnd: '📅 تاريخ النهاية',
      searchBtn: 'بحث',
      stats: ['مركبة', 'مدينة', 'عميل راضٍ', 'سنوات خبرة'],
    },
    features: [
      { icon:'🛡️', title:'تأمين شامل', text:'جميع مركباتنا مؤمنة تأميناً شاملاً مدرجاً في السعر.' },
      { icon:'🚀', title:'توصيل مجاني', text:'نوصل سيارتك إلى المطار أو فندقك دون رسوم إضافية.' },
      { icon:'💳', title:'دفع مرن', text:'ادفع عبر الإنترنت أو نقداً. إلغاء مجاني قبل 48 ساعة.' },
      { icon:'📞', title:'دعم 24/7', text:'فريقنا متاح على مدار الساعة بالفرنسية والعربية والإنجليزية.' },
    ],
    fleet: {
      badge: 'أسطولنا', title: 'اختر مركبتك',
      sub: 'من السيارات الاقتصادية إلى سيارات الدفع الرباعي الفاخرة، لدينا ما تحتاج.',
      filters: ['الكل','اقتصادية','دفع رباعي','فاخرة','كهربائية'],
      perDay: 'في اليوم · شامل الضريبة', bookBtn: 'احجز',
    },
    how: {
      badge: 'بسيط وسريع', title: 'كيف يعمل؟', sub: 'احجز سيارتك في 3 خطوات بسيطة.',
      steps: [
        { num:'01', icon:'🔍', title:'اختر', text:'حدد مدينتك وتواريخك والمركبة المناسبة لاحتياجاتك.' },
        { num:'02', icon:'📋', title:'احجز', text:'أكمل النموذج عبر الإنترنت — بسيط وآمن. تأكيد فوري.' },
        { num:'03', icon:'🗝️', title:'استمتع', text:'نوصل سيارتك أينما كنت. انطلق واكتشف المغرب!' },
      ],
    },
    testimonials: { badge:'آراء العملاء', title:'ما يقوله عملاؤنا' },
    about: {
      badge: 'من نحن', title: 'الرائد في تأجير السيارات بالمغرب',
      p1: 'منذ عام 2016، يرافق MarocDrive المسافرين والمهنيين في تنقلاتهم عبر المغرب. يغطي أسطولنا المؤلف من أكثر من 500 مركبة جميع المدن الكبرى في المملكة.',
      p2: 'مهمتنا: تقديم تجربة إيجار خالية من التوتر، شفافة ولا تُنسى.',
      list: ['أسعار واضحة دائماً، بدون رسوم خفية','مركبات حديثة أقل من 3 سنوات','كيلومترات غير محدودة مشمولة','مساعدة على الطريق 24/7'],
      cta: 'احجز الآن',
    },
    contact: {
      badge: 'اتصل بنا', title: 'نحن هنا من أجلك',
      items: [['📞','هاتف / واتساب','+212 6XX XXX XXX'],['✉️','البريد الإلكتروني','contact@marocdrive.ma'],['📍','العنوان','الدار البيضاء، المغرب']],
      form: { fname:'الاسم', lname:'اللقب', email:'البريد الإلكتروني', phone:'الهاتف', msg:'الرسالة',
        fnamePh:'محمد', lnamePh:'العلمي', emailPh:'أنت@مثال.com', phonePh:'+212 6XX XXX XXX', msgPh:'رسالتك...', send:'إرسال الرسالة' },
    },
    footer: { desc:'المرجع في تأجير السيارات بالمغرب منذ 2016.', nav:'التنقل', cities:'المدن', legal:'قانوني',
      navLinks:['أسطولنا','كيف يعمل','من نحن','اتصل بنا'],
      cityLinks:['الدار البيضاء','مراكش','أكادير','فاس','طنجة'],
      legalLinks:['الشروط العامة','سياسة الخصوصية','الإشعار القانوني'],
      copy:'© 2026 MarocDrive. جميع الحقوق محفوظة.',
    },
    toast: { search:'🔍 جارٍ البحث… إعادة التوجيه إلى النتائج.', contact:'✅ تم إرسال الرسالة! سنرد خلال 24 ساعة.', book:(n)=>`✅ تم اختيار "${n}"! أكمل حجزك أعلاه.` },
    cities: ['الدار البيضاء — مطار CMN','مراكش — مطار RAK','أكادير — مطار AGA','فاس — مطار FEZ','طنجة — مطار TNG'],
  },
};

/* ===== CAR DATA ===== */
const CARS_DEFAULT = [
  { id:1, name:'Dacia Logan', model:'2024 — 1.0 TCe', category:'economy', emoji:'🚗', price:250, photo:'images/cars/1.jpg', specsKey:['seats5','manual','clim','gps'], badgeKey:'popular' },
  { id:2, name:'Hyundai Tucson', model:'2024 — 1.6 CRDi', category:'suv', emoji:'🚙', price:490, photo:'images/cars/2.jpg', specsKey:['seats5','auto','clim','4x4'], badgeKey:'bestseller' },
  { id:3, name:'Renault Clio', model:'2024 — 1.0 TCe', category:'economy', emoji:'🚘', price:280, photo:'images/cars/3.jpg', specsKey:['seats5','manual','clim','bt'], badgeKey:null },
  { id:4, name:'BMW X3', model:'2024 — 2.0d', category:'premium', emoji:'🏎️', price:950, photo:'images/cars/4.jpg', specsKey:['seats5','auto','full','gps'], badgeKey:'premium' },
  { id:5, name:'Tesla Model 3', model:'2024 — Long Range', category:'electric', emoji:'⚡', price:750, photo:'images/cars/5.jpg', specsKey:['seats5','auto','autopilot','super'], badgeKey:'eco' },
  { id:6, name:'Peugeot 208', model:'2024 — 1.2 PureTech', category:'economy', emoji:'🚖', price:300, photo:'images/cars/6.jpg', specsKey:['seats5','manual','clim','usb'], badgeKey:null },
  { id:7, name:'Toyota RAV4', model:'2024 — 2.5 Hybrid', category:'suv', emoji:'🛻', price:620, photo:'images/cars/7.jpg', specsKey:['seats5','auto','hybrid','gps'], badgeKey:'hybrid' },
  { id:8, name:'Mercedes Classe E', model:'2024 — 2.0d', category:'premium', emoji:'🚀', price:1200, photo:'images/cars/8.jpg', specsKey:['seats5','auto','leather','massage'], badgeKey:'luxury' },
  { id:9, name:'Volkswagen Polo', model:'2024 — 1.0 TSI', category:'economy', emoji:'🚗', price:260, photo:'images/cars/9.jpg', specsKey:['seats5','manual','clim','bt'], badgeKey:null },
];
function getCarsData() {
  const saved = localStorage.getItem('md_cars');
  if (!saved) return CARS_DEFAULT;
  const cars = JSON.parse(saved);
  cars.forEach(c => { if (!c.photo) { const d = CARS_DEFAULT.find(x => x.id === c.id); if (d) c.photo = d.photo; } });
  return cars;
}
let CARS_DATA = getCarsData();
function refreshCarsData() { CARS_DATA = getCarsData(); }

const CAR_SPECS_LABELS = {
  fr: { seats5:'5 places', manual:'Manuelle', auto:'Automatique', clim:'Climatisation', gps:'GPS', '4x4':'4x4', bt:'Bluetooth', full:'Full options', autopilot:'Autopilot', super:'Supercharge', usb:'USB', hybrid:'Hybride', leather:'Cuir', massage:'Massage' },
  en: { seats5:'5 seats', manual:'Manual', auto:'Automatic', clim:'A/C', gps:'GPS', '4x4':'4x4', bt:'Bluetooth', full:'Full options', autopilot:'Autopilot', super:'Supercharge', usb:'USB', hybrid:'Hybrid', leather:'Leather', massage:'Massage' },
  es: { seats5:'5 plazas', manual:'Manual', auto:'Automático', clim:'Aire acond.', gps:'GPS', '4x4':'4x4', bt:'Bluetooth', full:'Full options', autopilot:'Autopilot', super:'Supercharge', usb:'USB', hybrid:'Híbrido', leather:'Cuero', massage:'Masaje' },
  ar: { seats5:'5 مقاعد', manual:'يدوي', auto:'أوتوماتيك', clim:'تكييف', gps:'GPS', '4x4':'دفع رباعي', bt:'بلوتوث', full:'خيارات كاملة', autopilot:'طيار آلي', super:'شحن سريع', usb:'USB', hybrid:'هجين', leather:'جلد', massage:'مساج' },
};

const CAR_BADGES = {
  fr: { popular:'Populaire', bestseller:'Best Seller', premium:'Premium', eco:'Éco', hybrid:'Hybride', luxury:'Luxe' },
  en: { popular:'Popular', bestseller:'Best Seller', premium:'Premium', eco:'Eco', hybrid:'Hybrid', luxury:'Luxury' },
  es: { popular:'Popular', bestseller:'Más Vendido', premium:'Premium', eco:'Eco', hybrid:'Híbrido', luxury:'Lujo' },
  ar: { popular:'الأكثر طلباً', bestseller:'الأكثر مبيعاً', premium:'بريميوم', eco:'صديق البيئة', hybrid:'هجين', luxury:'فاخر' },
};

const TESTIMONIALS_DATA = [
  { name:'Karim B.', city:{ fr:'Casablanca', en:'Casablanca', es:'Casablanca', ar:'الدار البيضاء' }, stars:5, text:{ fr:'Service impeccable ! La voiture était propre et livrée à l\'aéroport à l\'heure. Je recommande vivement MarocDrive.', en:'Impeccable service! The car was clean and delivered to the airport on time. I highly recommend MarocDrive.', es:'¡Servicio impecable! El coche estaba limpio y entregado en el aeropuerto a tiempo. Recomiendo MarocDrive.', ar:'خدمة لا تشوبها شائبة! كانت السيارة نظيفة وسُلِّمت في المطار في الوقت المحدد. أوصي بـ MarocDrive.' } },
  { name:'Sophie M.', city:{ fr:'Paris → Marrakech', en:'Paris → Marrakech', es:'París → Marrakech', ar:'باريس ← مراكش' }, stars:5, text:{ fr:'J\'ai loué un SUV pour 10 jours. Excellent état, prix honnête, l\'équipe m\'a aidée à chaque étape.', en:'I rented an SUV for 10 days. Excellent condition, fair price, the team helped me every step of the way.', es:'Alquilé un SUV por 10 días. Excelente estado, precio justo, el equipo me ayudó en cada paso.', ar:'استأجرت سيارة SUV لمدة 10 أيام. حالة ممتازة، سعر عادل، الفريق ساعدني في كل خطوة.' } },
  { name:'Ahmed R.', city:{ fr:'Agadir', en:'Agadir', es:'Agadir', ar:'أكادير' }, stars:5, text:{ fr:'Déjà 3 fois que je loue chez eux. Tarifs compétitifs, véhicules récents, le support WhatsApp est ultra-réactif.', en:'Already rented 3 times. Competitive rates, recent vehicles, WhatsApp support is ultra-responsive.', es:'Ya he alquilado 3 veces. Tarifas competitivas, vehículos recientes, el soporte de WhatsApp es muy rápido.', ar:'ثلاث مرات تعاملت معهم. أسعار تنافسية، مركبات حديثة، ودعم الواتساب سريع الاستجابة جداً.' } },
  { name:'Fatima Z.', city:{ fr:'Fès', en:'Fès', es:'Fès', ar:'فاس' }, stars:5, text:{ fr:'Réservation facile en ligne, confirmation immédiate. La voiture m\'attendait à la sortie de l\'aéroport.', en:'Easy online booking, instant confirmation. The car was waiting for me at the airport exit.', es:'Reserva fácil en línea, confirmación inmediata. El coche me esperaba a la salida del aeropuerto.', ar:'حجز سهل عبر الإنترنت، تأكيد فوري. كانت السيارة تنتظرني عند مخرج المطار.' } },
  { name:'Lucas D.', city:{ fr:'Lyon → Tanger', en:'Lyon → Tangier', es:'Lyon → Tánger', ar:'ليون ← طنجة' }, stars:4, text:{ fr:'Très bonne expérience globale. Le personnel parle français, la voiture était confortable et bien entretenue.', en:'Very good overall experience. The staff speaks French, the car was comfortable and well maintained.', es:'Muy buena experiencia en general. El personal habla francés, el coche era cómodo y bien mantenido.', ar:'تجربة إجمالية جيدة جداً. الموظفون يتحدثون العربية، والسيارة كانت مريحة وصيانتها جيدة.' } },
  { name:'Nadia H.', city:{ fr:'Casablanca', en:'Casablanca', es:'Casablanca', ar:'الدار البيضاء' }, stars:5, text:{ fr:'Prix imbattables ! J\'ai comparé 5 agences et MarocDrive était la meilleure option. Assurance incluse sans frais cachés.', en:'Unbeatable prices! I compared 5 agencies and MarocDrive was the best option. Insurance included, no hidden fees.', es:'¡Precios imbatibles! Comparé 5 agencias y MarocDrive fue la mejor opción. Seguro incluido sin cargos ocultos.', ar:'أسعار لا تُقاوم! قارنت 5 وكالات وكانت MarocDrive الخيار الأفضل. التأمين مشمول بدون رسوم خفية.' } },
];

/* ===== STATE ===== */
let currentLang = localStorage.getItem('md_lang') || 'fr';

/* ===== APPLY LANGUAGE ===== */
function applyLang(code) {
  const L = LANGS[code];
  if (!L) return;
  currentLang = code;
  localStorage.setItem('md_lang', code);

  // dir + lang on html
  document.documentElement.lang = code;
  document.documentElement.dir = L.dir;

  // nav links
  document.querySelector('[data-t="nav-fleet"]').textContent   = L.nav.fleet;
  document.querySelector('[data-t="nav-how"]').textContent     = L.nav.how;
  document.querySelector('[data-t="nav-about"]').textContent   = L.nav.about;
  document.querySelector('[data-t="nav-contact"]').textContent = L.nav.contact;
  document.querySelectorAll('[data-t="nav-book"]').forEach(el => el.textContent = L.nav.book);

  // hero
  document.querySelector('[data-t="hero-badge"]').textContent  = L.hero.badge;
  document.querySelector('[data-t="hero-title1"]').textContent = L.hero.title1;
  document.querySelector('[data-t="hero-title2"]').innerHTML   = L.hero.title2;
  document.querySelector('[data-t="hero-sub"]').innerHTML      = L.hero.sub.replace('\n','<br>');
  document.querySelector('[data-t="pickup-label"]').textContent  = L.hero.pickup;
  document.querySelector('[data-t="pickup-select"]').options[0].text = L.hero.pickupPh;
  // repopulate city options
  const sel = document.querySelector('[data-t="pickup-select"]');
  const villes = L.cities.slice(0,9).map(c=>`<option>${c}</option>`).join('');
  const aeroports = L.cities.slice(9,12).map(c=>`<option>${c}</option>`).join('');
  const hotel = `<option>${L.cities[12]}</option>`;
  sel.innerHTML = `<option value="">${L.hero.pickupPh}</option>
    <optgroup label="🏙️ ${L.code==='ar'?'المدن':'Villes'}">${villes}</optgroup>
    <optgroup label="✈️ ${L.code==='ar'?'المطارات':'Aéroports'}">${aeroports}</optgroup>
    <optgroup label="🏨 ${L.code==='ar'?'الفنادق':'Hôtels'}">${hotel}</optgroup>`;
  document.querySelector('[data-t="date-start-label"]').textContent = L.hero.dateStart;
  document.querySelector('[data-t="date-end-label"]').textContent   = L.hero.dateEnd;
  document.querySelector('[data-t="search-btn"]').childNodes[0].textContent = L.hero.searchBtn + ' ';

  const statLabels = document.querySelectorAll('.stat-label');
  L.hero.stats.forEach((s,i) => { if(statLabels[i]) statLabels[i].textContent = s; });

  // features
  document.querySelectorAll('.feature-card').forEach((card, i) => {
    const f = L.features[i];
    if (!f) return;
    card.querySelector('.feature-icon').textContent = f.icon;
    card.querySelector('h3').textContent = f.title;
    card.querySelector('p').textContent  = f.text;
  });

  // fleet
  document.querySelector('[data-t="fleet-badge"]').textContent = L.fleet.badge;
  document.querySelector('[data-t="fleet-title"]').textContent = L.fleet.title;
  document.querySelector('[data-t="fleet-sub"]').textContent   = L.fleet.sub;
  const filterBtns = document.querySelectorAll('.filter-btn');
  L.fleet.filters.forEach((f,i) => { if(filterBtns[i]) filterBtns[i].textContent = f; });

  // how
  document.querySelector('[data-t="how-badge"]').textContent = L.how.badge;
  document.querySelector('[data-t="how-title"]').textContent = L.how.title;
  document.querySelector('[data-t="how-sub"]').textContent   = L.how.sub;
  document.querySelectorAll('.step-card').forEach((card, i) => {
    const s = L.how.steps[i];
    if (!s) return;
    card.querySelector('.step-num').textContent  = s.num;
    card.querySelector('.step-icon').textContent = s.icon;
    card.querySelector('h3').textContent = s.title;
    card.querySelector('p').textContent  = s.text;
  });

  // testimonials section labels
  document.querySelector('[data-t="t-badge"]').textContent = L.testimonials.badge;
  document.querySelector('[data-t="t-title"]').textContent = L.testimonials.title;

  // about
  document.querySelector('[data-t="about-badge"]').textContent = L.about.badge;
  document.querySelector('[data-t="about-title"]').textContent = L.about.title;
  document.querySelector('[data-t="about-p1"]').textContent    = L.about.p1;
  document.querySelector('[data-t="about-p2"]').textContent    = L.about.p2;
  document.querySelectorAll('[data-t="about-list"] li').forEach((li, i) => {
    li.textContent = '✅ ' + L.about.list[i];
  });
  document.querySelector('[data-t="about-cta"]').textContent = L.about.cta;

  // contact
  document.querySelector('[data-t="contact-badge"]').textContent = L.contact.badge;
  document.querySelector('[data-t="contact-title"]').textContent = L.contact.title;
  document.querySelectorAll('.contact-item').forEach((item, i) => {
    const d = L.contact.items[i];
    if (!d) return;
    item.querySelector('.contact-icon').textContent = d[0];
    item.querySelector('strong').textContent = d[1];
    item.querySelector('p').textContent = d[2];
  });
  // footer
  const ft = L.footer;
  document.querySelector('[data-t="footer-desc"]').textContent     = ft.desc;
  document.querySelector('[data-t="footer-nav-h"]').textContent    = ft.nav;
  document.querySelector('[data-t="footer-cities-h"]').textContent = ft.cities;
  document.querySelector('[data-t="footer-legal-h"]').textContent  = ft.legal;
  document.querySelectorAll('[data-t="footer-nav-links"] a').forEach((a,i) => { if(ft.navLinks[i]) a.textContent = ft.navLinks[i]; });
  document.querySelectorAll('[data-t="footer-city-links"] a').forEach((a,i) => { if(ft.cityLinks[i]) a.textContent = ft.cityLinks[i]; });
  document.querySelectorAll('[data-t="footer-legal-links"] a').forEach((a,i) => { if(ft.legalLinks[i]) a.textContent = ft.legalLinks[i]; });
  document.querySelector('[data-t="footer-copy"]').textContent = ft.copy;

  // re-render cars and testimonials with new lang
  renderCars(currentFilter);
  renderTestimonials();

  // update lang switcher UI
  updateLangUI(code);
}

function updateLangUI(code) {
  const L = LANGS[code];
  document.querySelector('.lang-current-flag').textContent  = L.flag;
  document.querySelector('.lang-current-label').textContent = L.label;
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === code);
  });
}

/* ===== NAVBAR SCROLL ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ===== MOBILE MENU ===== */
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinksEl.classList.toggle('open');
});

navLinksEl.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinksEl.classList.remove('open');
  });
});

/* ===== LANG SWITCHER TOGGLE ===== */
const langBtn      = document.getElementById('langBtn');
const langDropdown = document.getElementById('langDropdown');

langBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  langDropdown.classList.toggle('open');
});

document.addEventListener('click', () => langDropdown.classList.remove('open'));
langDropdown.addEventListener('click', e => e.stopPropagation());

document.querySelectorAll('.lang-option').forEach(opt => {
  opt.addEventListener('click', () => {
    applyLang(opt.dataset.lang);
    applySiteConfig();
    langDropdown.classList.remove('open');
  });
});

/* ===== ANIMATE ON SCROLL ===== */
const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('aos-visible');
      aosObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));

/* ===== HERO ANIMATE DELAYS ===== */
document.querySelectorAll('.animate-fade-up[data-delay]').forEach(el => {
  el.style.animationDelay = el.dataset.delay + 'ms';
});

/* ===== COUNTER ANIMATION ===== */
function animateCounter(el) {
  const target = +el.dataset.target;
  const duration = 1800;
  const step = target / (duration / 16);
  let c = 0;
  const timer = setInterval(() => {
    c = Math.min(c + step, target);
    el.textContent = Math.round(c).toLocaleString('fr-FR');
    if (c >= target) clearInterval(timer);
  }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target.querySelector('.stat-num'));
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-box').forEach(el => statsObserver.observe(el));

/* ===== DATES ===== */
const today = new Date().toISOString().split('T')[0];
const startDate = document.getElementById('startDate');
const endDate   = document.getElementById('endDate');
if (startDate) {
  startDate.min = today;
  startDate.value = today;
  startDate.addEventListener('change', () => { endDate.min = startDate.value; });
}
if (endDate) endDate.min = today;

/* ===== BOOKING METHOD SWITCH ===== */
function switchBooking(method, el) {
  document.querySelectorAll('.bm-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('bookingOnline').style.display = method === 'online'    ? 'flex'  : 'none';
  document.getElementById('bookingCall').style.display   = method === 'call'      ? 'block' : 'none';
  document.getElementById('bookingWA').style.display     = method === 'whatsapp'  ? 'block' : 'none';
}

/* ===== SEARCH ===== */
let searchStart = null, searchEnd = null;

function handleSearch() {
  const s = document.getElementById('startDate').value;
  const e = document.getElementById('endDate').value;
  if (!s || !e) { showToast('⚠️ Veuillez sélectionner les deux dates.'); return; }
  if (new Date(e) <= new Date(s)) { showToast('⚠️ La date de fin doit être après la date de début.'); return; }
  searchStart = s; searchEnd = e;
  renderCars(currentFilter);
  document.getElementById('fleet').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function isCarAvailable(carName, s, e) {
  if (!s || !e) return true;
  const sD = new Date(s), eD = new Date(e);
  const reservations = JSON.parse(localStorage.getItem('md_reservations') || '[]');
  const blocks = JSON.parse(localStorage.getItem('md_blocks') || '{}')[carName] || [];
  const reservedConflict = reservations.some(r =>
    r.car === carName && r.status !== 'cancelled' &&
    new Date(r.start) < eD && new Date(r.end) > sD
  );
  const blockedConflict = blocks.some(b =>
    new Date(b.start) <= eD && new Date(b.end) >= sD
  );
  return !reservedConflict && !blockedConflict;
}

/* ===== FLEET ===== */
const carsGrid = document.getElementById('carsGrid');
let currentFilter = 'all';

const WA_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`;
const CALL_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.45 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>`;

function getActiveGallery(car) {
  return (car.gallery || [])
    .map(g => typeof g === 'string' ? { url: g, active: true } : g)
    .filter(g => g.active !== false && g.url)
    .map(g => g.url);
}

function renderCars(filter) {
  refreshCarsData();
  const siteCfg = getSiteConfig();
  const phoneTel = siteCfg.phone.replace(/[^\d+]/g,'');
  currentFilter = filter || 'all';
  const L = LANGS[currentLang];
  const specs = CAR_SPECS_LABELS[currentLang];
  const badges = CAR_BADGES[currentLang];
  const filtered = currentFilter === 'all' ? CARS_DATA : CARS_DATA.filter(c => c.category === currentFilter);

  carsGrid.innerHTML = '';
  filtered.forEach((car, i) => {
    const offer = getCarOffer(car.name);
    const price = car.price;
    const discountedPrice = offer ? Math.round(price * (1 - offer.discount / 100)) : null;
    const photo = car.photo || '';
    const badgeText = offer ? `-${offer.discount}% ${offer.title}` : (car.badgeKey ? badges[car.badgeKey] : null);
    const available = isCarAvailable(car.name, searchStart, searchEnd);
    const activeGallery = getActiveGallery(car);
    const totalPhotos = (photo ? 1 : 0) + activeGallery.length;
    const card = document.createElement('div');
    card.className = 'car-card' + (available ? '' : ' car-unavailable');
    card.innerHTML = `
      <div class="car-img" ${totalPhotos > 1 ? `onclick="openPhotoModal('${car.name.replace(/'/g,"\\'")}')" style="cursor:pointer"` : ''}>
        ${photo ? `<img src="${photo}" alt="${car.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0;" onerror="this.outerHTML='<span>${car.emoji}</span>'"/>` : `<span>${car.emoji}</span>`}
        ${!available
          ? `<span class="car-badge avail-badge">❌ Non disponible</span>`
          : offer
            ? `<div class="promo-ribbon">-${offer.discount}%<span>${discountedPrice} MAD</span></div>`
            : car.badgeKey ? `<span class="car-badge">${badges[car.badgeKey]}</span>` : ''}
        ${totalPhotos > 1 ? `<span class="car-photo-count">📷 ${totalPhotos}</span>` : ''}
      </div>
      <div class="car-body">
        <div class="car-name">${car.name}</div>
        <div class="car-model">${car.model}</div>
        <div class="car-specs">
          ${car.specsKey.map(k=>`<span class="car-spec">✓ ${specs[k]||k}</span>`).join('')}
        </div>
        <div class="car-price">
          ${discountedPrice
            ? `<span class="price-original">${price} MAD</span>
               <span class="price-num price-offer"><span>${discountedPrice}</span> MAD</span>`
            : `<span class="price-num"><span>${price}</span> MAD</span>`}
          <span class="price-label">${L.fleet.perDay}</span>
        </div>
        <div class="car-actions">
          ${available
            ? `<button class="car-btn-reserve" onclick="bookCar('${car.name}')">${L.fleet.bookBtn}</button>
               <a class="car-btn-call" href="tel:${phoneTel}">${CALL_SVG}</a>
               <button class="car-btn-wa" onclick="bookCar('${car.name}')">${WA_SVG}</button>`
            : `<button class="car-btn-unavail" disabled>Non disponible pour ces dates</button>`
          }
          <button class="car-btn-cal" onclick="openCal('${car.name}')" title="Voir disponibilité">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
        </div>
      </div>
    `;
    carsGrid.appendChild(card);
    setTimeout(() => card.classList.add('visible'), i * 80);
  });
}

/* ===== CITIES TICKER ===== */
const CITIES_DATA = [
  { name:'Tétouan',    emoji:'🏙️' },
  { name:'Martil',     emoji:'🏖️' },
  { name:'M\'Diq',     emoji:'🌊' },
  { name:'Fnideq',     emoji:'⚓' },
  { name:'Tanger',     emoji:'🛳️' },
  { name:'Chefchaouen',emoji:'💙' },
  { name:'Rabat',      emoji:'🏰' },
  { name:'Casablanca', emoji:'🏙️' },
  { name:'Marrakech',  emoji:'🕌' },
  { name:'Aéroport Tanger Ibn Batouta', emoji:'✈️' },
  { name:'Aéroport Casablanca CMN',     emoji:'✈️' },
  { name:'Aéroport Marrakech RAK',      emoji:'✈️' },
  { name:'Hôtels & Riads',             emoji:'🏨' },
];

(function renderTicker() {
  function makePill(city) {
    const el = document.createElement('div');
    el.className = 'city-pill';
    el.innerHTML = `<span class="city-pill-emoji">${city.emoji}</span><span class="city-pill-name">${city.name}</span><span class="city-pill-dot"></span>`;
    el.addEventListener('click', () => {
      const sel = document.querySelector('[data-t="pickup-select"]');
      if (sel) { const opt = [...sel.options].find(o => o.text.includes(city.name)); if (opt) sel.value = opt.value || opt.text; }
      document.getElementById('booking').scrollIntoView({ behavior:'smooth' });
      showToast(`📍 ${city.name} sélectionné`);
    });
    return el;
  }

  const t1 = document.getElementById('tickerTrack');
  const t2 = document.getElementById('tickerTrack2');
  const row1 = CITIES_DATA;
  const row2 = [...CITIES_DATA].reverse();

  // duplicate for seamless loop
  [...row1, ...row1].forEach(c => t1.appendChild(makePill(c)));
  [...row2, ...row2].forEach(c => t2.appendChild(makePill(c)));
})();

renderCars('all');

document.querySelectorAll('.filter-btn').forEach((btn, i) => {
  const filterKeys = ['all','economy','suv','premium','electric'];
  btn.dataset.filter = filterKeys[i] || 'all';
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCars(btn.dataset.filter);
  });
});

/* ===== BOOKING MODAL ===== */
let activeCarData = null;

function bookCar(name) {
  const car = CARS_DATA.find(c => c.name === name);
  if (!car) return;
  activeCarData = car;

  document.getElementById('modalCarEmoji').textContent    = car.emoji;
  document.getElementById('modalCarName').textContent     = car.name;
  document.getElementById('modalCarPriceDay').textContent = car.price;

  // prefill dates from hero search bar if set
  const s = document.getElementById('startDate')?.value;
  const e = document.getElementById('endDate')?.value;
  const ms = document.getElementById('mStartDate');
  const me = document.getElementById('mEndDate');
  const today = new Date().toISOString().split('T')[0];
  ms.min = today;
  me.min = today;
  if (s) ms.value = s;
  if (e) me.value = e;

  goStep(1);
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  calcTotal();
}

function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) closeBookingModal();
}

function closeBookingModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function goStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById('mStep' + i).style.display = i === n ? 'block' : 'none';
    const si = document.getElementById('msi' + i);
    if (!si) return;
    si.classList.remove('active','done');
    if (i < n) si.classList.add('done');
    else if (i === n) si.classList.add('active');
  });

  if (n === 2 && !validateStep1()) { goStep(1); return; }
  if (n === 3 && !validateStep2()) { goStep(2); return; }
  if (n === 3) buildConfirmation();
}

function validateStep1() {
  const s = document.getElementById('mStartDate').value;
  const e = document.getElementById('mEndDate').value;
  const c = document.getElementById('mCity').value;
  if (!s || !e || !c) { showToast('⚠️ Veuillez remplir tous les champs obligatoires.'); return false; }
  if (new Date(e) <= new Date(s)) { showToast('⚠️ La date de fin doit être après la date de début.'); return false; }
  return true;
}

function validateStep2() {
  const name  = document.getElementById('mName').value.trim();
  const phone = document.getElementById('mPhone').value.trim();
  if (!name)  { showToast('⚠️ Veuillez entrer votre nom complet.'); return false; }
  if (!phone) { showToast('⚠️ Veuillez entrer votre numéro de téléphone.'); return false; }
  return true;
}

function calcTotal() {
  if (!activeCarData) return;
  const s = document.getElementById('mStartDate').value;
  const e = document.getElementById('mEndDate').value;
  const preview = document.getElementById('totalPreview');
  if (!s || !e || new Date(e) <= new Date(s)) { preview.style.display = 'none'; return; }

  const days  = Math.ceil((new Date(e) - new Date(s)) / 86400000);
  const total = days * activeCarData.price;
  document.getElementById('totalDays').textContent    = days + ' jour' + (days > 1 ? 's' : '');
  document.getElementById('totalPerDay').textContent  = activeCarData.price + ' MAD';
  document.getElementById('totalAmount').textContent  = total.toLocaleString('fr-FR') + ' MAD';
  preview.style.display = 'block';

  // sync endDate min
  document.getElementById('mEndDate').min = document.getElementById('mStartDate').value;
}

function buildConfirmation() {
  const s     = document.getElementById('mStartDate').value;
  const e     = document.getElementById('mEndDate').value;
  const days  = Math.ceil((new Date(e) - new Date(s)) / 86400000);
  const total = days * activeCarData.price;
  const fmt   = d => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
  const name  = document.getElementById('mName').value.trim();
  const phone = document.getElementById('mPhone').value.trim();
  const email = document.getElementById('mEmail').value.trim();
  const city  = document.getElementById('mCity').value;

  document.getElementById('confirmSummary').innerHTML = `
    <div class="confirm-row"><span>🚗 Véhicule</span><span>${activeCarData.name}</span></div>
    <div class="confirm-row"><span>👤 Nom</span><span>${name}</span></div>
    <div class="confirm-row"><span>📞 Téléphone</span><span>${phone}</span></div>
    ${email ? `<div class="confirm-row"><span>✉️ Email</span><span>${email}</span></div>` : ''}
    <div class="confirm-row"><span>📍 Lieu</span><span>${city}</span></div>
    <div class="confirm-row"><span>📅 Départ</span><span>${fmt(s)}</span></div>
    <div class="confirm-row"><span>📅 Retour</span><span>${fmt(e)}</span></div>
    <div class="confirm-row"><span>⏱ Durée</span><span>${days} jour${days > 1 ? 's' : ''}</span></div>
    <div class="confirm-row highlight"><span>💰 Total</span><span>${total.toLocaleString('fr-FR')} MAD</span></div>
  `;

  // Build WhatsApp message
  const msg = `🚗 *Nouvelle Réservation — MarocDrive*

👤 *Nom :* ${name}
📞 *Téléphone :* ${phone}${email ? `\n✉️ *Email :* ${email}` : ''}
📍 *Lieu de prise en charge :* ${city}
🚘 *Véhicule :* ${activeCarData.name}
📅 *Départ :* ${fmt(s)}
📅 *Retour :* ${fmt(e)}
⏱ *Durée :* ${days} jour${days > 1 ? 's' : ''}
💰 *Total :* ${total.toLocaleString('fr-FR')} MAD

_Envoyé depuis le site MarocDrive_`;

  const waUrl = `https://wa.me/${getSiteConfig().wa}?text=` + encodeURIComponent(msg);

  saveReservation({ id: Date.now(), car: activeCarData.name, carPrice: activeCarData.price,
    name, phone, email, city, start: s, end: e, days, total, status:'pending', createdAt: new Date().toISOString() });

  const waBtn = document.getElementById('confirmWABtn');
  if (waBtn) waBtn.href = waUrl;
}

/* ===== PHOTO MODAL ===== */
function openPhotoModal(carName) {
  const car = CARS_DATA.find(c => c.name === carName);
  if (!car) return;
  const activeGallery = getActiveGallery(car);
  const allPhotos = [car.photo, ...activeGallery].filter(Boolean);
  if (allPhotos.length < 2) return;

  let overlay = document.getElementById('photoModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'photoModalOverlay';
    overlay.className = 'photo-modal-overlay';
    overlay.addEventListener('click', e => { if (e.target === overlay) closePhotoModal(); });
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="photo-modal">
      <button class="photo-modal-close" onclick="closePhotoModal()">✕</button>
      <div class="photo-modal-name">🚗 ${car.name}</div>
      <div class="photo-modal-body">
        <div class="photo-modal-main">
          <img id="photoModalMainImg" src="${allPhotos[0]}" alt="${car.name}"/>
        </div>
        <div class="photo-modal-side">
          ${allPhotos.map((p, i) => `<img src="${p}" class="photo-thumb ${i===0?'active':''}" onclick="switchPhoto('${p}',this)" alt=""/>`).join('')}
        </div>
      </div>
    </div>`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function switchPhoto(src, el) {
  document.getElementById('photoModalMainImg').src = src;
  document.querySelectorAll('.photo-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function closePhotoModal() {
  const overlay = document.getElementById('photoModalOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ===== LOCAL DB ===== */
function saveReservation(r) {
  const all = JSON.parse(localStorage.getItem('md_reservations') || '[]');
  all.unshift(r);
  localStorage.setItem('md_reservations', JSON.stringify(all));
}

/* ===== TESTIMONIALS ===== */
const track  = document.getElementById('testimonialsTrack');
const dotsEl = document.getElementById('testimonialsDots');
let tCurrent = 0;
let autoplay;

function renderTestimonials() {
  const L = LANGS[currentLang];
  track.innerHTML = '';
  dotsEl.innerHTML = '';

  TESTIMONIALS_DATA.forEach(t => {
    const card = document.createElement('div');
    card.className = 'testimonial-card';
    card.innerHTML = `
      <div class="t-stars">${'★'.repeat(t.stars)}${'☆'.repeat(5-t.stars)}</div>
      <p class="t-text">"${t.text[currentLang]}"</p>
      <div class="t-author">
        <div class="t-avatar">${t.name[0]}</div>
        <div>
          <div class="t-name">${t.name}</div>
          <div class="t-city">${t.city[currentLang]}</div>
        </div>
      </div>
    `;
    track.appendChild(card);
  });

  const perView = window.innerWidth <= 768 ? 1 : 3;
  const totalSlides = Math.ceil(TESTIMONIALS_DATA.length / perView);
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.className = 't-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  }

  clearInterval(autoplay);
  tCurrent = 0;
  startAutoplay(perView, totalSlides);
}

function goTo(idx, perView, totalSlides) {
  const pv = perView || (window.innerWidth <= 768 ? 1 : 3);
  const ts = totalSlides || Math.ceil(TESTIMONIALS_DATA.length / pv);
  tCurrent = ((idx % ts) + ts) % ts;
  const cardWidth = (track.children[0]?.offsetWidth || 0) + 20;
  track.style.transform = `translateX(${document.documentElement.dir==='rtl'?'':'-'}${tCurrent * cardWidth * pv}px)`;
  dotsEl.querySelectorAll('.t-dot').forEach((d, i) => d.classList.toggle('active', i === tCurrent));
}

function startAutoplay(pv, ts) {
  autoplay = setInterval(() => goTo(tCurrent + 1, pv, ts), 4200);
}

track.addEventListener('mouseenter', () => clearInterval(autoplay));
track.addEventListener('mouseleave', () => {
  const pv = window.innerWidth <= 768 ? 1 : 3;
  const ts = Math.ceil(TESTIMONIALS_DATA.length / pv);
  startAutoplay(pv, ts);
});

renderTestimonials();

/* ===== CONTACT FORM ===== */
function handleContactForm(e) {
  e.preventDefault();
  showToast(LANGS[currentLang].toast.contact);
  e.target.reset();
}

/* ===== TOAST ===== */
let toastTimer;
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ===== FEATURE CARDS AOS ===== */
const featureObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('aos-visible'), i * 100);
      featureObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.feature-card').forEach(el => featureObserver.observe(el));

/* ===== ACTIVE NAV ===== */
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
  let cur = '';
  sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - 120) cur = sec.id; });
  navLinkEls.forEach(a => { a.style.color = a.getAttribute('href') === '#' + cur ? 'var(--red-light)' : ''; });
}, { passive: true });

/* ===== SETTINGS SECRET ACCESS (5 clicks on any car card) ===== */
let carClicks = 0, carTimer = null;
document.getElementById('carsGrid').addEventListener('click', e => {
  if (e.target.closest('button') || e.target.closest('a')) return; // ignore action buttons
  carClicks++;
  clearTimeout(carTimer);
  if (carClicks >= 5) { carClicks = 0; sessionStorage.removeItem('md_settings'); window.location.href = 'settings.html'; return; }
  carTimer = setTimeout(() => { carClicks = 0; }, 2000);
});

/* ===== ADMIN SECRET ACCESS (3 clicks on logo) ===== */
let logoClicks = 0, logoTimer = null;
document.querySelector('.logo').addEventListener('click', e => {
  e.preventDefault();
  logoClicks++;
  clearTimeout(logoTimer);
  if (logoClicks >= 5) { logoClicks = 0; sessionStorage.removeItem('md_admin'); window.location.href = 'admin.html'; return; }
  logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);
});

/* ===== AVAILABILITY CALENDAR ===== */
let calCar = null, calYear, calMonth;
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function openCal(carName) {
  calCar = carName;
  const now = new Date();
  calYear = now.getFullYear(); calMonth = now.getMonth();
  document.getElementById('calCarName').textContent = '🗓 ' + carName;
  document.getElementById('calOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCal();
}
function closeCal() {
  document.getElementById('calOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function calNav(dir) { calMonth += dir; if (calMonth > 11) { calMonth = 0; calYear++; } if (calMonth < 0) { calMonth = 11; calYear--; } renderCal(); }

function getCarBusyDates(carName) {
  const reservations = JSON.parse(localStorage.getItem('md_reservations') || '[]');
  const busy = new Set();
  reservations.filter(r => r.car === carName && r.status !== 'cancelled').forEach(r => {
    const s = new Date(r.start), e = new Date(r.end);
    for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
      busy.add(d.toISOString().split('T')[0]);
    }
  });
  return busy;
}

function renderCal() {
  const busy = getCarBusyDates(calCar);
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('calMonthLabel').textContent = MONTHS_FR[calMonth] + ' ' + calYear;
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  DAYS_FR.forEach(d => { const el = document.createElement('div'); el.className = 'cal-day-name'; el.textContent = d; grid.appendChild(el); });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  for (let i = 0; i < offset; i++) { const el = document.createElement('div'); el.className = 'cal-day empty'; grid.appendChild(el); }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;
    if (dateStr === today) el.classList.add('today');
    else if (dateStr < today) el.classList.add('past');
    else if (busy.has(dateStr)) el.classList.add('busy');
    else el.classList.add('avail');
    grid.appendChild(el);
  }
}

/* ===== OFFERS ===== */
function getActiveOffers() {
  const now = new Date();
  return JSON.parse(localStorage.getItem('md_offers') || '[]')
    .filter(o => o.active && (!o.exp || new Date(o.exp) >= now));
}

function getCarOffer(carName) {
  const offers = getActiveOffers();
  return offers.find(o => o.car === 'all' || o.car === carName) || null;
}

function renderOffersBanner() {
  const offers = getActiveOffers();
  const banner = document.getElementById('offersBanner');
  if (!offers.length) { banner.style.display = 'none'; return; }
  banner.style.display = 'block';
  const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'long'}) : null;
  banner.innerHTML = `
    <div class="offers-section">
      <div class="container">
        <div class="offers-header"><span class="offers-tag">🏷️ Offres Spéciales</span></div>
        <div class="offers-grid">
          ${offers.map(o => `
            <div class="offer-card">
              <div class="offer-discount">-${o.discount}%</div>
              <div class="offer-info">
                <div class="offer-title">${o.title}</div>
                ${o.desc ? `<div class="offer-desc">${o.desc}</div>` : ''}
                <div class="offer-target">${o.car === 'all' ? '🚗 Tous les véhicules' : '🚘 ' + o.car}${o.exp ? ' · Jusqu\'au ' + fmt(o.exp) : ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ===== AUTO-SYNC from settings ===== */
window.addEventListener('storage', e => {
  if (e.key === 'md_cars') renderCars(currentFilter);
  if (e.key === 'md_offers') { renderOffersBanner(); renderCars(currentFilter); }
  if (e.key === 'md_site_settings') applySiteConfig();
});

/* Re-sync when the tab regains focus — covers cases where the 'storage'
   event doesn't fire reliably between tabs (e.g. file:// pages). */
function resyncFromStorage() {
  applySiteConfig();
  renderCars(currentFilter);
  renderOffersBanner();
}
window.addEventListener('focus', resyncFromStorage);
document.addEventListener('visibilitychange', () => { if (!document.hidden) resyncFromStorage(); });
window.addEventListener('pageshow', resyncFromStorage);

renderOffersBanner();

/* ===== INIT ===== */
applyLang(currentLang);
applySiteConfig();

// Re-render after Firebase sync
window.addEventListener('db-synced', () => {
  refreshCarsData();
  applySiteConfig();
  renderCars(currentFilter);
  renderOffersBanner();
});
