exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key manquante' }) };

  const { messages, ctx } = JSON.parse(event.body || '{}');

  const system = `Tu es l'assistant virtuel de MarocDrive, agence de location de voitures au Maroc.
Réponds toujours dans la même langue que le client (français, arabe, anglais, espagnol, darija marocaine).
Sois concis, chaleureux et professionnel. Utilise des emojis avec modération.

FLOTTE ACTUELLE:
${ctx?.cars || 'Dacia Logan 250 MAD/j, Hyundai Tucson 490 MAD/j, Renault Clio 280 MAD/j'}

OFFRES ACTIVES:
${ctx?.offers || 'Aucune offre spéciale en ce moment'}

INFOS:
- Livraison gratuite partout au Maroc (aéroports, hôtels, villes)
- Assurance tous risques incluse
- Paiement: espèces, carte, à la livraison
- Annulation gratuite 48h avant
- WhatsApp: +212 634 829 085
- Pour réserver: bouton "Réserver" sur la voiture souhaitée

Ne réponds qu'aux questions liées à la location de voitures et à MarocDrive.
Si le client veut réserver, guide-le vers le bouton "Réserver" sur le site.`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: 350,
        temperature: 0.7,
      }),
    });
    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || 'Désolé, une erreur est survenue. Contactez-nous sur WhatsApp.';
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ reply: 'Désolé, service temporairement indisponible. Contactez-nous sur WhatsApp : +212 634 829 085 📱' }) };
  }
};
