const fs = require('fs');

const API_URL = 'http://localhost:4000/api';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err) || res.statusText);
  }
  return res.json();
}

async function runTests() {
  console.log("=== Lancement de la batterie de tests (Messagerie Nelo) ===");
  
  try {
    // 1. Création de User A (Vendeur)
    const userA_email = `vendeur_${Date.now()}@test.com`;
    console.log(`[1] Création de l'utilisateur A (Vendeur) : ${userA_email}`);
    await fetchJson(`${API_URL}/user/sign_up`, {
      method: 'POST',
      body: JSON.stringify({
        email: userA_email,
        username: 'VendeurTest',
        password: 'password123'
      })
    });
    
    // Login User A
    const loginA = await fetchJson(`${API_URL}/user/log_in`, {
      method: 'POST',
      body: JSON.stringify({
        email: userA_email,
        password: 'password123'
      })
    });
    const tokenA = loginA.token;
    const idA = loginA._id;
    console.log(`✅ Utilisateur A connecté. ID: ${idA}`);

    // 2. Création de User B (Acheteur)
    const userB_email = `acheteur_${Date.now()}@test.com`;
    console.log(`[2] Création de l'utilisateur B (Acheteur) : ${userB_email}`);
    await fetchJson(`${API_URL}/user/sign_up`, {
      method: 'POST',
      body: JSON.stringify({
        email: userB_email,
        username: 'AcheteurTest',
        password: 'password123'
      })
    });

    // Login User B
    const loginB = await fetchJson(`${API_URL}/user/log_in`, {
      method: 'POST',
      body: JSON.stringify({
        email: userB_email,
        password: 'password123'
      })
    });
    const tokenB = loginB.token;
    const idB = loginB._id;
    console.log(`✅ Utilisateur B connecté. ID: ${idB}`);

    // 3. User A crée une annonce
    console.log("[3] L'utilisateur A publie une annonce...");
    const offerRes = await fetchJson(`${API_URL}/offer/publish`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Voiture de Test',
        description: 'Superbe voiture',
        price: 5000000,
        files: [] // On simule un envoi sans fichier
      }),
      headers: { authorization: `Bearer ${tokenA}` }
    });
    const offerId = offerRes._id;
    console.log(`✅ Annonce créée. ID: ${offerId}`);

    // 4. User B envoie un message à User A pour cette annonce
    console.log("[4] L'utilisateur B envoie le premier message...");
    const msg1Res = await fetchJson(`${API_URL}/message/send`, {
      method: 'POST',
      body: JSON.stringify({
        offer_id: offerId,
        receiver_id: idA,
        content: 'Bonjour, est-ce toujours disponible ?'
      }),
      headers: { authorization: `Bearer ${tokenB}` }
    });
    console.log(`✅ Message 1 envoyé. ID: ${msg1Res._id}`);

    // 5. User A récupère ses conversations
    console.log("[5] L'utilisateur A vérifie ses conversations...");
    const convsARes = await fetchJson(`${API_URL}/message/conversations`, {
      headers: { authorization: `Bearer ${tokenA}` }
    });
    if (convsARes.length === 0) throw new Error("Aucune conversation trouvée pour A");
    const convId = convsARes[0]._id;
    console.log(`✅ Conversation trouvée. ID: ${convId}, Dernier msg: ${convsARes[0].last_message.content}`);

    // 6. User A répond au message dans la conversation
    console.log("[6] L'utilisateur A répond...");
    const msg2Res = await fetchJson(`${API_URL}/message/send`, {
      method: 'POST',
      body: JSON.stringify({
        offer_id: offerId,
        receiver_id: idB,
        content: 'Oui, toujours dispo !'
      }),
      headers: { authorization: `Bearer ${tokenA}` }
    });
    console.log(`✅ Message 2 envoyé. ID: ${msg2Res._id}`);

    // 7. User B récupère les messages de la conversation
    console.log("[7] L'utilisateur B consulte le chat...");
    const chatRes = await fetchJson(`${API_URL}/message/conversation/${convId}`, {
      headers: { authorization: `Bearer ${tokenB}` }
    });
    
    if (chatRes.length === 2) {
      console.log(`✅ Succès ! Il y a bien 2 messages dans le chat.`);
      console.log(`   Acheteur: ${chatRes[0].content}`);
      console.log(`   Vendeur: ${chatRes[1].content}`);
    } else {
      throw new Error(`Nombre de messages incorrect: ${chatRes.length}`);
    }

    console.log("\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! 🎉");
    console.log("Le système de messagerie (Création, Envoi, Récupération, Réponse) est 100% opérationnel.");

  } catch (error) {
    console.error("\n❌ ERREUR DURANT LE TEST :");
    console.error(error.message);
  }
}

runTests();
