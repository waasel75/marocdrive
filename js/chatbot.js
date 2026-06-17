'use strict';
/* ============================================================
   MarocDrive SmartBot v2 — Natural + Data-aware + Darija
   ============================================================ */

const CHAT_KEY = 'md_chat_conversations';
const CHAT_CFG = 'md_chat_config';
let chatOpen = false, chatSession = null;
let chatLang = 'fr';
let ctx = { lastCar: null, lastCategory: null, turn: 0 };

/* ── LIVE DATA ── */
function liveOffers() {
  const now = new Date();
  return JSON.parse(localStorage.getItem('md_offers') || '[]')
    .filter(o => o.active && (!o.exp || new Date(o.exp) >= now));
}
function liveCars() {
  const s = localStorage.getItem('md_cars');
  return s ? JSON.parse(s) : [
    {name:'Dacia Logan',   model:'2024',category:'economy', emoji:'🚗',price:250},
    {name:'Renault Clio',  model:'2024',category:'economy', emoji:'🚘',price:280},
    {name:'Volkswagen Polo',model:'2024',category:'economy',emoji:'🚗',price:260},
    {name:'Peugeot 208',   model:'2024',category:'economy', emoji:'🚖',price:300},
    {name:'Hyundai Tucson',model:'2024',category:'suv',     emoji:'🚙',price:490},
    {name:'Toyota RAV4',   model:'2024',category:'suv',     emoji:'🛻',price:620},
    {name:'BMW X3',        model:'2024',category:'premium', emoji:'🏎️',price:950},
    {name:'Mercedes Classe E',model:'2024',category:'premium',emoji:'🚀',price:1200},
    {name:'Tesla Model 3', model:'2024',category:'electric',emoji:'⚡',price:750},
  ];
}
function isAvailable(carName, s, e) {
  if (!s || !e) return true;
  const sD = new Date(s), eD = new Date(e);
  const res = JSON.parse(localStorage.getItem('md_reservations') || '[]');
  const blk = (JSON.parse(localStorage.getItem('md_blocks') || '{}')[carName]) || [];
  return !res.some(r => r.car===carName && r.status!=='cancelled' && new Date(r.start)<eD && new Date(r.end)>sD)
      && !blk.some(b => new Date(b.start)<=eD && new Date(b.end)>=sD);
}
function carWithOffer(car) {
  const offers = liveOffers();
  const o = offers.find(x => x.car==='all' || x.car===car.name);
  if (!o) return { price: car.price, offer: null };
  return { price: Math.round(car.price*(1-o.discount/100)), original: car.price, offer: o };
}

/* ── LANGUAGE DETECTION ── */
function detectLang(t) {
  const tx = t.toLowerCase();
  // Darija keywords (Latin script Moroccan Arabic)
  if (/\b(wach|kayen|bghit|chhal|fin\b|kifach|zwina|mezyan|sir|3andi|nta|nti|hna|kat3rف|darb|fach|mzyan|3lach|bach|la|iyeh|walo|gha|dyal|dial|ndir|tdir|3endo|khdam|safi|wakha|bslama|3afak|marhba|labas|bikhir|khouya|sahbi|sah|ghir|mn|3la|li\b|f\b|b\b|w\b|d\b|htta|smiya|tomobil|kra|lkra|bghit|bghina|kayn|ma\s*kayn|ach|shhal|nhar|simana|usbu3)\b/.test(tx)) return 'dz';
  if (/[؀-ۿ]/.test(t)) return 'ar';
  if (/hola|buenos|gracias|cuánto|cuanto|reservar|precio|disponible|coche/.test(tx)) return 'es';
  if (/\b(hello|hi|hey|how much|book|available|thank|cancel|need|want|what|price|car|rent)\b/.test(tx)) return 'en';
  return 'fr';
}

/* ── INTENT DETECTION ── */
function getIntent(tx) {
  const t = tx.toLowerCase();

  if (/\b(salam|salut|bonjour|bonsoir|hello|hi\b|hey\b|مرحبا|أهلا|السلام عليكم|hola|coucou|mrhba|labas|la bas|sbah|msa)\b/.test(t))
    return 'greeting';

  if (/\b(merci|shukran|شكرا|thank|gracias|bslama|au revoir|bye|bonne journée|وداع|مع السلامة|adiós)\b/.test(t))
    return 'farewell';

  if (/\b(disponib|available|libre|متاح|disponible|free|wach libre|mreserviye|foqach|disponible)\b/.test(t) || /men \d|du \d|from \d|\d.*[àal]\s*\d/.test(t))
    return 'availability';

  if (/\b(offre|promo|réduction|remise|discount|offer|عرض|تخفيض|promocion|solde|rédu|deal|chi offre|chi kra rzin)\b/.test(t))
    return 'offers';

  // specific car BEFORE generic price/fleet (min 4 chars to avoid single-letter matches like "E")
  const _cars = liveCars();
  if (_cars.some(c => {
    const full = c.name.toLowerCase();
    const last = c.name.split(' ').pop().toLowerCase();
    return t.includes(full) || (last.length >= 4 && t.includes(last));
  })) return 'car_detail';

  // category BEFORE generic fleet
  if (/\b(économ|econom|budget|pas cher|cheap|citycar|صغيرة|اقتصاد|económ)\b/.test(t)) return 'cat_economy';
  if (/\b(suv|4x4|tout.terrain|off.road|كبيرة|grande)\b/.test(t)) return 'cat_suv';
  if (/\b(premium|luxe|luxury|classe|haut.de.gamme|business|فاخر|luxos)\b/.test(t)) return 'cat_premium';
  if (/\b(électr|electric|hybrid|tesla|كهربائ|ecolog)\b/.test(t)) return 'cat_electric';

  if (/\b(prix|tarif|coût|combien|cher|price|cost|how much|rate|سعر|كم|precio|cuanto|chhal|bchhal|b chhal|b9ad|b qadd)\b/.test(t))
    return 'prices';

  if (/\b(voiture|vehicul|flotte|fleet|car\b|سيار|coche|auto|modèle|model|choix|tomobil|tiyara|les voiture)\b/.test(t))
    return 'fleet';

  if (/\b(réserv|louer|location|book|reserv|حجز|استئجار|alquilar|nreservi|nreserv|bghit nkri|kra|kifach nreserv|comment réserver)\b/.test(t))
    return 'booking';

  if (/\b(ville|city|where|où|livraison|deliver|airport|aéroport|مدينة|أين|توصيل|ciudad|dónde|fin|fin katkhdem|fin kayna)\b/.test(t))
    return 'cities';

  if (/\b(document|permis|licen|passport|passeport|pièce|identit|papier|وثيقة|رخصة|papye|rwaya)\b/.test(t))
    return 'docs';

  if (/\b(assur|insur|تأمين|couver|covered|accident|dommage|segur)\b/.test(t))
    return 'insurance';

  if (/\b(paiement|payer|carte|espèce|cash|pay|دفع|نقد|pago|kifach nkhallas|b cash|blcarte)\b/.test(t))
    return 'payment';

  if (/\b(annul|cancel|modif|changer|إلغاء|cancelar|bghit nbeddel|bghit nannuler)\b/.test(t))
    return 'cancel';

  if (/\b(contact|téléphone|phone|appel|whatsapp|numéro|number|تواصل|هاتف|rqm|tel)\b/.test(t))
    return 'contact';

  return null;
}

/* ── RESPONSE BUILDERS ── */
function r(responses) { return responses[chatLang] || responses.fr; }

function ctaBook() {
  return {
    fr: '\n\n👉 Pour réserver, cliquez sur **Réserver** sur la voiture qui vous intéresse !',
    dz: '\n\n👉 Bach treservi, click 3la **Réserver** fla tomobil li bghiti !',
    en: '\n\n👉 To book, click **Reserve** on the car you like!',
    ar: '\n\n👉 للحجز، اضغط **احجز** على السيارة التي تريدها!',
    es: '\n\n👉 Para reservar, haz clic en **Reservar** en el coche que te interese.',
  }[chatLang] || '';
}
function ctaWA() {
  return {
    fr: '\n\n📱 Ou contactez-nous directement : **WhatsApp +212 634 829 085**',
    dz: '\n\n📱 Wla contactiw directement : **WhatsApp +212 634 829 085**',
    en: '\n\n📱 Or contact us directly: **WhatsApp +212 634 829 085**',
    ar: '\n\n📱 أو تواصل معنا مباشرة: **واتساب 212634829085+**',
    es: '\n\n📱 O contáctenos: **WhatsApp +212 634 829 085**',
  }[chatLang] || '';
}

/* ── RESPONSES PER INTENT ── */
function respond(intent, tx) {
  const cars = liveCars();
  const offers = liveOffers();

  /* GREETING — natural, no hard sell */
  if (intent === 'greeting') {
    return r({
      fr: 'Bonjour ! 😊 Bienvenue chez MarocDrive. Comment je peux vous aider ?',
      dz: 'Mrhba ! 😊 Kifach nqderek n3awen ?',
      en: 'Hello! 😊 Welcome to MarocDrive. How can I help you?',
      ar: 'مرحباً ! 😊 أهلاً بك في MarocDrive. كيف يمكنني مساعدتك؟',
      es: '¡Hola! 😊 Bienvenido a MarocDrive. ¿En qué puedo ayudarle?',
    });
  }

  /* FAREWELL */
  if (intent === 'farewell') {
    return r({
      fr: 'Avec plaisir ! 😊 N\'hésitez pas à revenir si vous avez d\'autres questions. Bonne journée !',
      dz: 'Bla jmil ! 😊 Ila 3endek chi so2al, rje3 dima. Bslama !',
      en: 'My pleasure! 😊 Feel free to come back anytime. Have a great day!',
      ar: 'بكل سرور! 😊 لا تتردد في العودة متى شئت. يوم سعيد!',
      es: '¡Un placer! 😊 No dude en volver cuando quiera. ¡Que tenga un buen día!',
    });
  }

  /* OFFERS */
  if (intent === 'offers') {
    if (!offers.length) return r({
      fr: 'Pas d\'offre spéciale active en ce moment, mais nos prix sont déjà très compétitifs 😊\n\nVous cherchez un type de véhicule en particulier ?',
      dz: 'Ma kayn offre khassa daba, walakin l\'prix dyalna mzyanin bzzaf 😊\n\nWach bghiti chi type d tomobil ?',
      en: 'No special offer running right now, but our prices are already very competitive 😊\n\nLooking for a specific type of vehicle?',
      ar: 'لا توجد عروض خاصة الآن، لكن أسعارنا تنافسية جداً 😊\n\nهل تبحث عن نوع معين من السيارات؟',
      es: 'No hay oferta especial ahora, pero nuestros precios ya son muy competitivos 😊\n\n¿Busca algún tipo de vehículo en concreto?',
    });
    const lines = offers.map(o => {
      const target = o.car==='all' ? r({fr:'Tous les véhicules',dz:'Gaa3 les voitures',en:'All vehicles',ar:'جميع السيارات',es:'Todos los vehículos'}) : o.car;
      const exp = o.exp ? ` · ${new Date(o.exp).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}` : '';
      return `🏷️ **-${o.discount}% ${o.title}** — ${target}${exp}`;
    }).join('\n');
    return r({
      fr: `Oui, on a ${offers.length} offre(s) en ce moment :\n\n${lines}\n\nLes réductions sont appliquées automatiquement à la réservation.`,
      dz: `Iyeh, kayen ${offers.length} offre daba :\n\n${lines}\n\nLa réduction katban automatiquement mli treservi.`,
      en: `Yes, we have ${offers.length} offer(s) right now:\n\n${lines}\n\nDiscounts apply automatically at booking.`,
      ar: `نعم، لدينا ${offers.length} عرض حالياً:\n\n${lines}\n\nالخصومات تطبق تلقائياً عند الحجز.`,
      es: `Sí, tenemos ${offers.length} oferta(s) ahora:\n\n${lines}\n\nLos descuentos se aplican automáticamente.`,
    });
  }

  /* AVAILABILITY */
  if (intent === 'availability') {
    const dateMatch = tx.match(/(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/g);
    if (dateMatch && dateMatch.length >= 2) {
      const avail = cars.filter(c => isAvailable(c.name, dateMatch[0].replace(/\./g,'/'), dateMatch[1].replace(/\./g,'/')));
      if (!avail.length) return r({
        fr: `Aucun véhicule disponible pour ces dates malheureusement 😔\n\nEssayez d'autres dates ou contactez-nous pour qu'on cherche une solution.${ctaWA()}`,
        dz: `Ma kayn htta tomobil libre f had les dates 😔\n\nJareb dates okhra wla contactiw nshufou chi hal.${ctaWA()}`,
        en: `No vehicle available for those dates unfortunately 😔\n\nTry other dates or contact us and we'll find a solution.${ctaWA()}`,
        ar: `لا توجد سيارات متاحة لهذه التواريخ للأسف 😔\n\nجرب تواريخ أخرى أو تواصل معنا.${ctaWA()}`,
        es: `No hay vehículo disponible para esas fechas 😔\n\nIntente otras fechas o contáctenos.${ctaWA()}`,
      });
      const perDay = r({fr:'MAD/jour',dz:'درهم/نهار',en:'MAD/day',ar:'درهم/يوم',es:'MAD/día'});
      const lines = avail.slice(0,6).map(c => { const {price,offer} = carWithOffer(c); return `${c.emoji} **${c.name}** — ${offer?`~~${c.original}~~ **${price}**`:`**${price}**`} ${perDay}`; }).join('\n');
      return r({
        fr: `Super, voici les véhicules disponibles pour ces dates :\n\n${lines}${ctaBook()}`,
        dz: `Hah, had les voitures libre f had les dates :\n\n${lines}${ctaBook()}`,
        en: `Great, here are the vehicles available for those dates:\n\n${lines}${ctaBook()}`,
        ar: `رائع، إليك السيارات المتاحة لهذه التواريخ:\n\n${lines}${ctaBook()}`,
        es: `Perfecto, aquí los vehículos disponibles para esas fechas:\n\n${lines}${ctaBook()}`,
      });
    }
    return r({
      fr: 'Pour vérifier la disponibilité, dites-moi :\n• La voiture ou catégorie souhaitée\n• Les dates (ex : "du 20/06 au 25/06")',
      dz: 'Bach nshuf lik la disponibilité, 3tini :\n• L-voiture wla le type\n• Les dates (ex : "men 20/06 l 25/06")',
      en: 'To check availability, tell me:\n• The car or category you want\n• The dates (e.g. "from 20/06 to 25/06")',
      ar: 'للتحقق من التوفر، أخبرني:\n• السيارة أو الفئة المطلوبة\n• التواريخ (مثال: "من 20/06 إلى 25/06")',
      es: 'Para verificar disponibilidad, dígame:\n• El coche o categoría\n• Las fechas (ej: "del 20/06 al 25/06")',
    });
  }

  /* PRICES */
  if (intent === 'prices') {
    const bycat = {economy:[],suv:[],premium:[],electric:[]};
    cars.forEach(c => bycat[c.category]?.push(c));
    const min = cat => Math.min(...(bycat[cat]||[]).map(c=>carWithOffer(c).price));
    const perDay = r({fr:'MAD/jour',dz:'درهم/نهار',en:'MAD/day',ar:'درهم/يوم',es:'MAD/día'});
    const labels = r({fr:{economy:'Économique',suv:'SUV / 4x4',premium:'Premium',electric:'Électrique'},dz:{economy:'Économique',suv:'SUV / 4x4',premium:'Premium',electric:'Électrique'},en:{economy:'Economy',suv:'SUV / 4x4',premium:'Premium',electric:'Electric'},ar:{economy:'اقتصادية',suv:'SUV / دفع رباعي',premium:'بريميوم',electric:'كهربائية'},es:{economy:'Económico',suv:'SUV / 4x4',premium:'Premium',electric:'Eléctrico'}});
    const lines = Object.keys(bycat).filter(k=>bycat[k].length).map(k=>`• **${labels[k]}** — ${r({fr:'dès',dz:'mn',en:'from',ar:'من',es:'desde'})} **${min(k)} ${perDay}**`).join('\n');
    const offersNote = offers.length ? r({fr:`\n\n💡 On a aussi des offres en ce moment — jusqu'à -${Math.max(...offers.map(o=>o.discount))}% !`,dz:`\n\n💡 Kayen hta offres — ila l -${Math.max(...offers.map(o=>o.discount))}% !`,en:`\n\n💡 We also have active offers — up to -${Math.max(...offers.map(o=>o.discount))}%!`,ar:`\n\n💡 لدينا أيضاً عروض نشطة — حتى -${Math.max(...offers.map(o=>o.discount))}%!`,es:`\n\n💡 ¡También tenemos ofertas activas — hasta -${Math.max(...offers.map(o=>o.discount))}%!`}) : '';
    return r({
      fr: `Voici nos tarifs par catégorie :\n\n${lines}\n\n✅ Assurance + livraison incluses${offersNote}`,
      dz: `Had les prix 3la kola catégorie :\n\n${lines}\n\n✅ Assurance + livraison dakhlinhom${offersNote}`,
      en: `Here are our rates by category:\n\n${lines}\n\n✅ Insurance + delivery included${offersNote}`,
      ar: `إليك أسعارنا حسب الفئة:\n\n${lines}\n\n✅ التأمين والتوصيل مشمولان${offersNote}`,
      es: `Nuestras tarifas por categoría:\n\n${lines}\n\n✅ Seguro + entrega incluidos${offersNote}`,
    });
  }

  /* FLEET */
  if (intent === 'fleet') {
    const bycat = {economy:[],suv:[],premium:[],electric:[]};
    cars.forEach(c => bycat[c.category]?.push(c));
    const perDay = r({fr:'MAD/j',dz:'درهم',en:'MAD/d',ar:'درهم',es:'MAD/d'});
    const catN = r({fr:{economy:'Économique',suv:'SUV',premium:'Premium',electric:'Électrique'},dz:{economy:'Économique',suv:'SUV',premium:'Premium',electric:'Électrique'},en:{economy:'Economy',suv:'SUV',premium:'Premium',electric:'Electric'},ar:{economy:'اقتصادية',suv:'SUV',premium:'بريميوم',electric:'كهربائية'},es:{economy:'Económico',suv:'SUV',premium:'Premium',electric:'Eléctrico'}});
    const sections = Object.entries(bycat).filter(([,v])=>v.length).map(([cat,list])=>{
      const rows = list.map(c=>{ const {price,offer}=carWithOffer(c); return `  ${c.emoji} ${c.name} — ${offer?`~~${c.price}~~ **${price}**`:`**${price}**`} ${perDay}`; }).join('\n');
      return `**${catN[cat]}**\n${rows}`;
    }).join('\n\n');
    return r({
      fr: `Notre flotte (${cars.length} véhicules) :\n\n${sections}`,
      dz: `Had les voitures dyalna (${cars.length} tomobilat) :\n\n${sections}`,
      en: `Our fleet (${cars.length} vehicles):\n\n${sections}`,
      ar: `أسطولنا (${cars.length} سيارة):\n\n${sections}`,
      es: `Nuestra flota (${cars.length} vehículos):\n\n${sections}`,
    });
  }

  /* SPECIFIC CAR */
  if (intent === 'car_detail') {
    const tl = tx.toLowerCase();
    const car = cars.find(c => { const full=c.name.toLowerCase(), last=c.name.split(' ').pop().toLowerCase(); return tl.includes(full)||(last.length>=4&&tl.includes(last)); });
    if (car) {
      ctx.lastCar = car;
      const {price, original, offer} = carWithOffer(car);
      const perDay = r({fr:'MAD/jour',dz:'درهم/نهار',en:'MAD/day',ar:'درهم/يوم',es:'MAD/día'});
      const priceStr = offer ? `~~${original}~~ **${price} ${perDay}** 🏷️ (-${offer.discount}%)` : `**${price} ${perDay}**`;
      const catN = r({fr:{economy:'Économique',suv:'SUV',premium:'Premium',electric:'Électrique'},dz:{economy:'Économique',suv:'SUV',premium:'Premium',electric:'Électrique'},en:{economy:'Economy',suv:'SUV',premium:'Premium',electric:'Electric'},ar:{economy:'اقتصادية',suv:'SUV',premium:'بريميوم',electric:'كهربائية'},es:{economy:'Económico',suv:'SUV',premium:'Premium',electric:'Eléctrico'}});
      return r({
        fr: `${car.emoji} **${car.name}** ${car.model}\n📂 Catégorie : ${catN[car.category]}\n💰 Tarif : ${priceStr}\n✅ Assurance & livraison incluses\n\nVous voulez vérifier les disponibilités pour cette voiture ?`,
        dz: `${car.emoji} **${car.name}** ${car.model}\n📂 Catégorie : ${catN[car.category]}\n💰 Prix : ${priceStr}\n✅ Assurance w livraison dakhlinhom\n\nBghiti nshuf les dates disponibles l had tomobil ?`,
        en: `${car.emoji} **${car.name}** ${car.model}\n📂 Category: ${catN[car.category]}\n💰 Rate: ${priceStr}\n✅ Insurance & delivery included\n\nWant to check availability for this car?`,
        ar: `${car.emoji} **${car.name}** ${car.model}\n📂 الفئة: ${catN[car.category]}\n💰 السعر: ${priceStr}\n✅ التأمين والتوصيل مشمولان\n\nهل تريد التحقق من توفر هذه السيارة؟`,
        es: `${car.emoji} **${car.name}** ${car.model}\n📂 Categoría: ${catN[car.category]}\n💰 Tarifa: ${priceStr}\n✅ Seguro y entrega incluidos\n\n¿Quiere verificar disponibilidad para este coche?`,
      });
    }
  }

  /* CATEGORY */
  const catKey = intent?.startsWith('cat_') ? intent.replace('cat_','') : null;
  if (catKey) {
    const list = cars.filter(c=>c.category===catKey);
    const perDay = r({fr:'MAD/j',dz:'درهم',en:'MAD/d',ar:'درهم',es:'MAD/d'});
    const lines = list.map(c=>{ const {price,offer}=carWithOffer(c); return `${c.emoji} **${c.name}** — ${offer?`~~${c.price}~~ **${price}**`:`**${price}**`} ${perDay}`; }).join('\n');
    const catLabel = r({fr:{economy:'Économiques',suv:'SUV / 4x4',premium:'Premium',electric:'Électriques'},dz:{economy:'Économiques',suv:'SUV / 4x4',premium:'Premium',electric:'Électriques'},en:{economy:'Economy',suv:'SUV / 4x4',premium:'Premium',electric:'Electric'},ar:{economy:'اقتصادية',suv:'SUV / دفع رباعي',premium:'بريميوم',electric:'كهربائية'},es:{economy:'Económicos',suv:'SUV / 4x4',premium:'Premium',electric:'Eléctricos'}})[catKey] || catKey;
    return r({
      fr: `Nos véhicules **${catLabel}** :\n\n${lines}\n\nTous incluent assurance + livraison gratuite. Une date en tête ?`,
      dz: `Had les voitures **${catLabel}** dyalna :\n\n${lines}\n\nKolhom 3andom assurance + livraison. 3endek chi date f balek ?`,
      en: `Our **${catLabel}** vehicles:\n\n${lines}\n\nAll include insurance + free delivery. Have dates in mind?`,
      ar: `سياراتنا **${catLabel}**:\n\n${lines}\n\nجميعها تشمل التأمين + التوصيل المجاني. هل لديك تواريخ في ذهنك؟`,
      es: `Nuestros vehículos **${catLabel}**:\n\n${lines}\n\nTodos incluyen seguro + entrega gratuita. ¿Tiene fechas en mente?`,
    });
  }

  /* BOOKING */
  if (intent === 'booking') {
    return r({
      fr: `Pour réserver c'est simple :\n\n1️⃣ Choisissez votre voiture dans la flotte\n2️⃣ Cliquez **Réserver** → remplissez les dates et la ville\n3️⃣ Confirmez — on vous contacte dans les 15 minutes\n\nVous pouvez aussi réserver via WhatsApp si vous préférez.${ctaWA()}`,
      dz: `Lhsab dyal la réservation bsit :\n\n1️⃣ Khtari tomobilek men la flotte\n2️⃣ Click 3la **Réserver** → dakhal les dates w lmdina\n3️⃣ Confirmi — ghadi ncontactiw f 15 dqiqa\n\nImken hta treservi 3la WhatsApp ila bghiti.${ctaWA()}`,
      en: `Booking is simple:\n\n1️⃣ Choose your car from the fleet\n2️⃣ Click **Reserve** → fill in dates and city\n3️⃣ Confirm — we'll contact you within 15 minutes\n\nYou can also book via WhatsApp if you prefer.${ctaWA()}`,
      ar: `الحجز بسيط:\n\n1️⃣ اختر سيارتك من الأسطول\n2️⃣ اضغط **احجز** → أدخل التواريخ والمدينة\n3️⃣ أكد — سنتصل بك خلال 15 دقيقة\n\nيمكنك أيضاً الحجز عبر واتساب.${ctaWA()}`,
      es: `Para reservar es sencillo:\n\n1️⃣ Elige tu coche de la flota\n2️⃣ Haz clic en **Reservar** → rellena fechas y ciudad\n3️⃣ Confirma — te contactamos en 15 minutos${ctaWA()}`,
    });
  }

  /* CITIES */
  if (intent === 'cities') {
    return r({
      fr: `On livre partout au Maroc 🇲🇦\n\n🏙️ **Villes** : Casablanca, Marrakech, Agadir, Fès, Tanger, Rabat, Meknès, Oujda, Laâyoune\n✈️ **Aéroports** : CMN, RAK, AGA, TNG\n🏨 **Hôtels & Riads** : livraison à votre adresse\n\nLivraison 100% gratuite, sans frais cachés.`,
      dz: `Kaynkhdemou f gaa3 lblad 🇲🇦\n\n🏙️ **Modun** : Casablanca, Marrakech, Agadir, Fès, Tanger, Rabat, Meknès, Oujda\n✈️ **Aéroports** : CMN, RAK, AGA, TNG\n🏨 **Hotels w Riads** : katji tomobil l 3endek\n\nLivraison bla flouss, ma kayn htta frais.`,
      en: `We deliver all over Morocco 🇲🇦\n\n🏙️ **Cities**: Casablanca, Marrakech, Agadir, Fès, Tanger, Rabat, Meknès, Oujda\n✈️ **Airports**: CMN, RAK, AGA, TNG\n🏨 **Hotels & Riads**: delivery to your address\n\n100% free delivery, no hidden fees.`,
      ar: `نوصل في كل المغرب 🇲🇦\n\n🏙️ **المدن** : الدار البيضاء، مراكش، أكادير، فاس، طنجة، الرباط، مكناس\n✈️ **المطارات** : CMN, RAK, AGA, TNG\n🏨 **الفنادق والرياض** : توصيل لعنوانك\n\nتوصيل مجاني 100%، بدون رسوم مخفية.`,
      es: `Entregamos en todo Marruecos 🇲🇦\n\n🏙️ **Ciudades**: Casablanca, Marrakech, Agadir, Fez, Tánger, Rabat, Mequínez\n✈️ **Aeropuertos**: CMN, RAK, AGA, TNG\n🏨 **Hoteles**: entrega en su dirección\n\nEntrega 100% gratuita, sin costes ocultos.`,
    });
  }

  /* DOCS */
  if (intent === 'docs') {
    return r({
      fr: `Documents nécessaires :\n\n✅ Permis de conduire valide (international accepté)\n✅ CIN ou Passeport\n✅ Caution (carte ou espèces)\n\n📌 Âge minimum : 21 ans\n📌 Permis depuis au moins 1 an`,
      dz: `Documents li khassek :\n\n✅ Permis de conduire valide (international maqboul)\n✅ CIN wla Passeport\n✅ Caution (carte wla cash)\n\n📌 Sen minimum : 21 sna\n📌 Permis mn 1 sna 3la l-aqell`,
      en: `Required documents:\n\n✅ Valid driving license (international accepted)\n✅ Passport or national ID\n✅ Deposit (card or cash)\n\n📌 Minimum age: 21 years\n📌 License held for at least 1 year`,
      ar: `الوثائق المطلوبة:\n\n✅ رخصة قيادة سارية (الدولية مقبولة)\n✅ بطاقة الهوية أو جواز السفر\n✅ تأمين (بطاقة أو نقداً)\n\n📌 الحد الأدنى للسن: 21 سنة`,
      es: `Documentos necesarios:\n\n✅ Licencia de conducir válida (internacional aceptada)\n✅ Pasaporte o DNI\n✅ Depósito (tarjeta o efectivo)\n\n📌 Edad mínima: 21 años`,
    });
  }

  /* INSURANCE */
  if (intent === 'insurance') {
    return r({
      fr: `L'assurance est incluse dans le prix 👍\n\nElle couvre :\n✅ Responsabilité civile\n✅ Dommages collision (CDW)\n✅ Vol et incendie\n✅ Assistance 24h/24\n✅ Passagers`,
      dz: `Assurance dakhlinha f prix 👍\n\nKatghetti :\n✅ Responsabilité civile\n✅ Dommages collision (CDW)\n✅ Vol w incendie\n✅ Assistance 24/24\n✅ Les passagers`,
      en: `Insurance is included in the price 👍\n\nCovers:\n✅ Civil liability\n✅ Collision damage (CDW)\n✅ Theft & fire\n✅ 24/7 roadside assistance\n✅ Passengers`,
      ar: `التأمين مشمول في السعر 👍\n\nيغطي:\n✅ المسؤولية المدنية\n✅ أضرار الاصطدام (CDW)\n✅ السرقة والحريق\n✅ مساعدة على الطريق 24/7\n✅ الركاب`,
      es: `El seguro está incluido en el precio 👍\n\nCubre:\n✅ Responsabilidad civil\n✅ Daños por colisión (CDW)\n✅ Robo e incendio\n✅ Asistencia 24h\n✅ Pasajeros`,
    });
  }

  /* PAYMENT */
  if (intent === 'payment') {
    return r({
      fr: `On accepte :\n\n💵 Espèces (MAD, EUR, USD)\n💳 Carte bancaire (Visa, Mastercard)\n📦 Paiement à la livraison\n🏦 Virement\n\nPas besoin de payer en ligne — vous payez en recevant la voiture.`,
      dz: `Kaynqblo :\n\n💵 Cash (MAD, EUR, USD)\n💳 Carte (Visa, Mastercard)\n📦 Payment mli tjibo tomobil\n\nMa khasseksh tdfer 3la Internet — tkhallas mli tjibek tomobil.`,
      en: `We accept:\n\n💵 Cash (MAD, EUR, USD)\n💳 Credit/Debit card\n📦 Pay on delivery\n🏦 Bank transfer\n\nNo online payment needed — you pay when the car arrives.`,
      ar: `نقبل:\n\n💵 نقداً (درهم، يورو، دولار)\n💳 بطاقة بنكية (Visa, Mastercard)\n📦 الدفع عند التسليم\n🏦 تحويل بنكي\n\nلا حاجة للدفع إلكترونياً — تدفع عند تسلم السيارة.`,
      es: `Aceptamos:\n\n💵 Efectivo (MAD, EUR, USD)\n💳 Tarjeta (Visa, Mastercard)\n📦 Pago contra entrega\n\nNo es necesario pagar online — paga al recibir el coche.`,
    });
  }

  /* CANCEL */
  if (intent === 'cancel') {
    return r({
      fr: `Politique d'annulation :\n\n✅ Annulation gratuite jusqu'à 24h avant la prise en charge\n⚠️ Moins de 24h : frais de 20%\n\nPour modifier ou annuler, contactez-nous :${ctaWA()}`,
      dz: `Politique d'annulation :\n\n✅ Annulation bla flouss ila 24h qbel\n⚠️ Aqell mn 24h : 20% frais\n\nBash tbeddel wla tannuler, contactiw :${ctaWA()}`,
      en: `Cancellation policy:\n\n✅ Free cancellation up to 24h before pickup\n⚠️ Less than 24h: 20% fee\n\nTo modify or cancel:${ctaWA()}`,
      ar: `سياسة الإلغاء:\n\n✅ إلغاء مجاني حتى 24 ساعة قبل الاستلام\n⚠️ أقل من 24 ساعة: رسوم 20%\n\nللتعديل أو الإلغاء:${ctaWA()}`,
      es: `Política de cancelación:\n\n✅ Cancelación gratuita hasta 24h antes\n⚠️ Menos de 24h: cargo del 20%\n\nPara modificar o cancelar:${ctaWA()}`,
    });
  }

  /* CONTACT */
  if (intent === 'contact') {
    return r({
      fr: `Vous pouvez nous joindre ici :\n\n📱 **WhatsApp** : +212 634 829 085\n☎️ **Téléphone** : +212 634 829 085\n\n⏰ Disponibles 7j/7 de 8h à 22h`,
      dz: `Imken tcontactiw hna :\n\n📱 **WhatsApp** : +212 634 829 085\n☎️ **Téléphone** : +212 634 829 085\n\n⏰ Mwjodin 7 ayyam f semana men 8h l 22h`,
      en: `You can reach us here:\n\n📱 **WhatsApp**: +212 634 829 085\n☎️ **Phone**: +212 634 829 085\n\n⏰ Available 7 days a week, 8am–10pm`,
      ar: `يمكنك التواصل معنا:\n\n📱 **واتساب**: 212634829085+\n☎️ **هاتف**: 212634829085+\n\n⏰ متاحون 7 أيام في الأسبوع، من 8 صباحاً إلى 10 مساءً`,
      es: `Puede contactarnos aquí:\n\n📱 **WhatsApp**: +212 634 829 085\n☎️ **Teléfono**: +212 634 829 085\n\n⏰ Disponibles 7 días, de 8h a 22h`,
    });
  }

  /* FALLBACK */
  return r({
    fr: `Je n'ai pas bien saisi, désolé 😅\n\nJe peux vous renseigner sur :\n• Nos voitures et tarifs\n• Disponibilités\n• Offres en cours\n• Réservation\n• Villes de livraison\n\nOu posez-moi votre question autrement !`,
    dz: `Ma fhemtch mazyan, smahli 😅\n\nImken njawebek 3la :\n• Les voitures w les prix\n• Disponibilités\n• Les offres\n• La réservation\n• Les villes\n\nWla 3awd so2lek b tariqt okhra !`,
    en: `I didn't quite get that, sorry 😅\n\nI can help with:\n• Cars and prices\n• Availability\n• Current offers\n• How to book\n• Delivery cities\n\nFeel free to rephrase!`,
    ar: `لم أفهم جيداً، عذراً 😅\n\nيمكنني مساعدتك في:\n• السيارات والأسعار\n• التوفر\n• العروض الحالية\n• الحجز\n• مدن التوصيل\n\nأعد صياغة سؤالك!`,
    es: `No he entendido bien, disculpe 😅\n\nPuedo ayudarle con:\n• Coches y precios\n• Disponibilidad\n• Ofertas actuales\n• Cómo reservar\n• Ciudades de entrega`,
  });
}

/* ── MAIN ENTRY — GPT via Netlify Function ── */
let chatHistory = [];

async function buildResponse(text) {
  chatHistory.push({ role: 'user', content: text });
  if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);

  const cars = liveCars().map(c => `${c.name} ${c.price}MAD/j`).join(', ');
  const offers = liveOffers().map(o => `-${o.discount}% ${o.title}`).join(', ') || 'aucune';

  try {
    const resp = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory, ctx: { cars, offers } }),
    });
    const data = await resp.json();
    const reply = data.reply || 'Erreur — contactez-nous sur WhatsApp.';
    chatHistory.push({ role: 'assistant', content: reply });
    return reply;
  } catch {
    // fallback local
    chatLang = detectLang(text);
    const intent = getIntent(text);
    return respond(intent, text);
  }
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
  if (chatOpen) { document.getElementById('chatNotif').style.display = 'none'; document.getElementById('chatInput').focus(); }
}

function chatEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function addMsg(content, role) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.innerHTML = `<div class="chat-bubble">${chatEsc(content).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/~~(.*?)~~/g,'<s>$1</s>').replace(/\n/g,'<br/>')}</div>
    <div class="chat-time">${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>`;
  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
  if (chatSession) {
    chatSession.messages.push({ role, content, time: new Date().toISOString() });
    const all = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    const idx = all.findIndex(s => s.id === chatSession.id);
    if (idx >= 0) all[idx] = chatSession; else all.unshift(chatSession);
    localStorage.setItem(CHAT_KEY, JSON.stringify(all.slice(0, 200)));
  }
}
function addBotMsg(text) { addMsg(text, 'bot'); }

async function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.disabled = true;
  addMsg(text, 'user');
  const msgs = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-msg bot chat-typing';
  typing.innerHTML = '<div class="chat-bubble"><span></span><span></span><span></span></div>';
  msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight;
  try {
    const reply = await buildResponse(text);
    msgs.removeChild(typing);
    addBotMsg(reply);
  } catch {
    msgs.removeChild(typing);
    addBotMsg('Désolé, une erreur est survenue. Contactez-nous sur WhatsApp 📱');
  }
  input.disabled = false;
  input.focus();
}

/* ── BOOT ── */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildChatWidget);
else buildChatWidget();
window.addEventListener('storage', e => {
  if (e.key === CHAT_CFG) { const w = document.getElementById('chatWidget'); if (w) w.remove(); chatSession = null; buildChatWidget(); }
});
