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

async function runPurchaseAndRatingTests() {
  console.log("=== Lancement des tests : Achat (Stripe) et Notation Vendeur ===");
  
  try {
    // 1. Création de User A (Vendeur)
    const userA_email = `vendeur_rating_${Date.now()}@test.com`;
    console.log(`[1] Création de l'utilisateur A (Vendeur) : ${userA_email}`);
    await fetchJson(`${API_URL}/user/sign_up`, {
      method: 'POST',
      body: JSON.stringify({ email: userA_email, username: 'VendeurPro', password: 'password123' })
    });
    const loginA = await fetchJson(`${API_URL}/user/log_in`, {
      method: 'POST',
      body: JSON.stringify({ email: userA_email, password: 'password123' })
    });
    const tokenA = loginA.token;
    const idA = loginA._id;

    // 2. Création de User B (Acheteur)
    const userB_email = `acheteur_rating_${Date.now()}@test.com`;
    console.log(`[2] Création de l'utilisateur B (Acheteur) : ${userB_email}`);
    await fetchJson(`${API_URL}/user/sign_up`, {
      method: 'POST',
      body: JSON.stringify({ email: userB_email, username: 'AcheteurPro', password: 'password123' })
    });
    const loginB = await fetchJson(`${API_URL}/user/log_in`, {
      method: 'POST',
      body: JSON.stringify({ email: userB_email, password: 'password123' })
    });
    const tokenB = loginB.token;

    // 3. Vendeur publie une annonce
    console.log("[3] L'utilisateur A publie une annonce à vendre...");
    const offerRes = await fetchJson(`${API_URL}/offer/publish`, {
      method: 'POST',
      body: JSON.stringify({ title: 'MacBook Pro', description: 'Neuf', price: 1500000, files: [] }),
      headers: { authorization: `Bearer ${tokenA}` }
    });
    const offerId = offerRes._id;
    console.log(`✅ Annonce créée avec succès. ID: ${offerId}`);

    // 4. Acheteur simule le clic sur "Stripe - Acheter maintenant" (Option: Relais Colis)
    console.log("[4] L'utilisateur B génère une session de paiement Stripe (Livraison Relais)...");
    const checkoutRes = await fetchJson(`${API_URL}/payment/create-checkout-session`, {
      method: 'POST',
      body: JSON.stringify({ offer_id: offerId, delivery_option: 'relais', delivery_price: 2500 }),
      headers: { authorization: `Bearer ${tokenB}` }
    });
    const sessionId = checkoutRes.id;
    console.log(`✅ Session Stripe générée. URL: ${checkoutRes.url}`);

    // 5. Acheteur revient sur /payment/success et valide la commande
    console.log("[5] L'utilisateur B revient après paiement et confirme la commande...");
    const confirmRes = await fetchJson(`${API_URL}/order/confirm`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, offer_id: offerId }),
      headers: { authorization: `Bearer ${tokenB}` }
    });
    console.log(`✅ Commande enregistrée ! L'annonce est désormais vendue.`);

    // 6. Acheteur évalue le Vendeur
    console.log("[6] L'utilisateur B évalue le Vendeur (Note: 5 étoiles)...");
    await fetchJson(`${API_URL}/rating/create`, {
      method: 'POST',
      body: JSON.stringify({ seller_id: idA, offer_id: offerId, score: 5, comment: 'Transaction parfaite et très rapide !' }),
      headers: { authorization: `Bearer ${tokenB}` }
    });
    console.log(`✅ Évaluation enregistrée.`);

    // 7. Vérification de la moyenne du vendeur
    console.log("[7] Vérification publique du profil du Vendeur...");
    const ratingRes = await fetchJson(`${API_URL}/user/${idA}/ratings`);
    
    if (ratingRes.count === 1 && ratingRes.average === '5.0') {
      console.log(`✅ Succès ! Le vendeur a bien ${ratingRes.count} avis avec une moyenne de ⭐ ${ratingRes.average}/5`);
      console.log(`   Dernier commentaire : "${ratingRes.ratings[0].comment}"`);
    } else {
      throw new Error(`Erreur dans le calcul de la moyenne. Reçu: ${JSON.stringify(ratingRes)}`);
    }

    console.log("\n🎉 TOUS LES TESTS D'ACHAT ET DE NOTATION SONT PASSÉS AVEC SUCCÈS ! 🎉");

  } catch (error) {
    console.error("\n❌ ERREUR DURANT LE TEST :");
    console.error(error.message);
  }
}

runPurchaseAndRatingTests();
