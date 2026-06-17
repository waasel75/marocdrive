// ================================================================
//  CONFIG — modifiez UNIQUEMENT ce fichier pour personnaliser
//  le site. Ne touchez pas aux autres fichiers JS.
// ================================================================
const SITE = {

  // --- Nom & Contact ---
  name:      'MarocDrive',
  phone:     '+212 634 829 085',
  whatsapp:  '212634829085',       // sans + ni espaces
  email:     'contact@marocdrive.ma',

  // --- Firebase Realtime Database ---
  // Créez votre projet sur https://console.firebase.google.com
  // Realtime Database → créer → copier l'URL ci-dessous
  firebaseUrl: 'https://v1-claude-code-35dce-default-rtdb.firebaseio.com',

  // --- Voitures par défaut ---
  // Ces voitures apparaissent si la base Firebase est vide
  // Format: { id, name, model, category, emoji, price, photo, specsKey[], badgeKey }
  // category: 'economy' | 'suv' | 'premium' | 'electric'
  // badgeKey: '' | 'popular' | 'bestseller' | 'premium' | 'eco' | 'hybrid' | 'luxury'
  cars: [
    { id:1, name:'Dacia Logan',       model:'2024 — 1.0 TCe',      category:'economy', emoji:'🚗', price:250,  photo:'images/cars/1.jpg', specsKey:['seats5','manual','clim','gps'],      badgeKey:'popular'    },
    { id:2, name:'Hyundai Tucson',    model:'2024 — 1.6 CRDi',     category:'suv',     emoji:'🚙', price:490,  photo:'images/cars/2.jpg', specsKey:['seats5','auto','clim','4x4'],         badgeKey:'bestseller' },
    { id:3, name:'Renault Clio',      model:'2024 — 1.0 TCe',      category:'economy', emoji:'🚘', price:280,  photo:'images/cars/3.jpg', specsKey:['seats5','manual','clim','bt'],         badgeKey:null         },
    { id:4, name:'BMW X3',            model:'2024 — 2.0d',         category:'premium', emoji:'🏎️',price:950,  photo:'images/cars/4.jpg', specsKey:['seats5','auto','full','gps'],          badgeKey:'premium'    },
    { id:5, name:'Tesla Model 3',     model:'2024 — Long Range',   category:'electric',emoji:'⚡', price:750,  photo:'images/cars/5.jpg', specsKey:['seats5','auto','autopilot','super'],   badgeKey:'eco'        },
    { id:6, name:'Peugeot 208',       model:'2024 — 1.2 PureTech', category:'economy', emoji:'🚖', price:300,  photo:'images/cars/6.jpg', specsKey:['seats5','manual','clim','usb'],        badgeKey:null         },
    { id:7, name:'Toyota RAV4',       model:'2024 — 2.5 Hybrid',   category:'suv',     emoji:'🛻', price:620,  photo:'images/cars/7.jpg', specsKey:['seats5','auto','hybrid','gps'],        badgeKey:'hybrid'     },
    { id:8, name:'Mercedes Classe E', model:'2024 — 2.0d',         category:'premium', emoji:'🚀', price:1200, photo:'images/cars/8.jpg', specsKey:['seats5','auto','leather','massage'],   badgeKey:'luxury'     },
    { id:9, name:'Volkswagen Polo',   model:'2024 — 1.0 TSI',      category:'economy', emoji:'🚗', price:260,  photo:'images/cars/9.jpg', specsKey:['seats5','manual','clim','bt'],         badgeKey:null         },
  ],
};
