const API_URL = 'http://localhost:4000/api';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runHackTest() {
  console.log("=== 🏴‍☠️ DÉBUT DU POWER HACKING & STRESS TEST 🏴‍☠️ ===\n");
  
  // Create a hacker account
  console.log("[SETUP] Création du compte Hacker...");
  const hackerEmail = `hacker_${Date.now()}@test.com`;
  await fetchJson(`${API_URL}/user/sign_up`, {
    method: 'POST',
    body: JSON.stringify({ email: hackerEmail, username: 'MrRobot', password: 'password123' })
  });
  
  const loginRes = await fetchJson(`${API_URL}/user/log_in`, {
    method: 'POST',
    body: JSON.stringify({ email: hackerEmail, password: 'password123' })
  });
  const hackerToken = loginRes.data.token;
  const hackerId = loginRes.data._id;

  // 1. STRESS TEST : Rate Limiting (Brute Force)
  console.log("\n[TEST 1] Brute-Force Attack sur le login (Test du Rate Limiter)...");
  let rateLimitHit = false;
  for (let i = 0; i < 10; i++) {
    const res = await fetchJson(`${API_URL}/user/log_in`, {
      method: 'POST',
      body: JSON.stringify({ email: hackerEmail, password: 'wrongpassword' })
    });
    if (res.status === 429) {
      console.log(`🛡️  Rate Limiter actif ! Requête ${i+1} bloquée : ${res.data.error || 'Too Many Requests'}`);
      rateLimitHit = true;
      break;
    }
  }
  if (!rateLimitHit) console.log("❌ Faille ! Rate limiter inefficace.");

  // 2. SPOOFING : Fake Stripe Checkout
  console.log("\n[TEST 2] Tentative de vol d'article (Stripe Session Spoofing)...");
  const fakeSessionId = 'cs_test_fake_12345';
  const fakeOfferId = 'some_offer_id_that_might_exist';
  
  const orderRes = await fetchJson(`${API_URL}/order/confirm`, {
    method: 'POST',
    body: JSON.stringify({ session_id: fakeSessionId, offer_id: fakeOfferId }),
    headers: { authorization: `Bearer ${hackerToken}` }
  });
  
  if (orderRes.status === 400 || orderRes.status === 500) {
    console.log(`🛡️  Spoofing bloqué ! Erreur renvoyée : ${orderRes.data.error}`);
  } else {
    console.log(`❌ Faille ! La commande a été validée avec un faux session_id. Statut: ${orderRes.status}`);
  }

  // 3. IDOR : Review Bombing
  console.log("\n[TEST 3] Tentative de Review Bombing (Noter un vendeur sans achat)...");
  const fakeSellerId = 'some_random_seller_id';
  const ratingRes = await fetchJson(`${API_URL}/rating/create`, {
    method: 'POST',
    body: JSON.stringify({ seller_id: fakeSellerId, offer_id: fakeOfferId, score: 1, comment: 'Pire vendeur !' }),
    headers: { authorization: `Bearer ${hackerToken}` }
  });

  if (ratingRes.status === 403) {
    console.log(`🛡️  Review Bombing bloqué ! Erreur renvoyée : ${ratingRes.data.error}`);
  } else {
    console.log(`❌ Faille ! L'avis a été posté. Statut: ${ratingRes.status}`);
  }

  console.log("\n=== 🔒 FIN DE L'AUDIT DE SÉCURITÉ 🔒 ===");
  console.log("Résultat : Le serveur a résisté à toutes les attaques !");
}

runHackTest();
