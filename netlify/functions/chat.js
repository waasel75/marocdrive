exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key manquante' }) };

  const { messages, ctx } = JSON.parse(event.body || '{}');

  const system = `Tu es l'assistant virtuel de MarocDrive, agence de location de voitures au Maroc.
Reponds toujours dans la meme langue que le client (francais, arabe, anglais, espagnol, darija marocaine en caracteres latins).
Sois concis, chaleureux et professionnel. Maximum 3-4 phrases par reponse. Utilise des emojis avec moderation.

FLOTTE ACTUELLE: ${ctx?.cars || 'Dacia Logan 250 MAD/j, Hyundai Tucson 490 MAD/j, Renault Clio 280 MAD/j'}
OFFRES ACTIVES: ${ctx?.offers || 'Aucune offre speciale'}

INFOS:
- Livraison gratuite partout au Maroc (aeroports, hotels, villes)
- Assurance tous risques incluse dans le prix
- Paiement: especes, carte bancaire, a la livraison
- Annulation gratuite 48h avant
- WhatsApp: +212 634 829 085
- Pour reserver: bouton "Reserver" sur la voiture choisie
- Ne reponds qu aux questions liees a MarocDrive et la location de voitures.`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: 350, temperature: 0.7 }
        })
      }
    );
    const data = await resp.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Desole, erreur temporaire. Contactez-nous sur WhatsApp.';
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ reply: 'Service indisponible. WhatsApp: +212 634 829 085' }) };
  }
};
