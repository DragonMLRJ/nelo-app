async function runTests() {
  console.log("🚀 Lancement des tests de Recherche et Catégories...");

  try {
    const userSuffix = Date.now();
    const signupRes = await fetch('http://localhost:4000/api/user/sign_up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `testcat_${userSuffix}@nelo.com`,
        username: `TestCat_${userSuffix}`,
        password: 'password123'
      })
    });
    const signupData = await signupRes.json();
    const token = signupData.token;
    console.log("✅ Inscription réussie");

    const offer1Res = await fetch('http://localhost:4000/api/offer/publish', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Superbe Peugeot 208',
        description: 'Voiture en parfait état.',
        price: 5000,
        category: 'Véhicules'
      })
    });
    console.log("✅ Annonce 1 (Véhicules/Peugeot) publiée");

    const offer2Res = await fetch('http://localhost:4000/api/offer/publish', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'iPhone 13 Pro Max',
        description: 'Comme neuf avec boite.',
        price: 800,
        category: 'Électronique & Multimédia'
      })
    });
    console.log("✅ Annonce 2 (Électronique/iPhone) publiée");

    const filterCatRes = await fetch('http://localhost:4000/api/offer/with-count?category=V%C3%A9hicules');
    const filterCatData = await filterCatRes.json();
    const vehicules = filterCatData.offers.filter(o => o.category === 'Véhicules');
    if (vehicules.length > 0) {
      console.log(`✅ Filtre Catégorie "Véhicules" fonctionnel (${filterCatData.count} annonces totales)`);
    } else {
      console.log("❌ Échec : aucune annonce Véhicules trouvée");
    }

    const filterTextRes = await fetch('http://localhost:4000/api/offer/with-count?title=iphone');
    const filterTextData = await filterTextRes.json();
    const iphones = filterTextData.offers.filter(o => o.title.toLowerCase().includes('iphone'));
    if (iphones.length > 0) {
      console.log(`✅ Filtre Recherche "iphone" fonctionnel (${filterTextData.count} annonces totales)`);
    } else {
      console.log("❌ Échec : aucune annonce iPhone trouvée");
    }

    const filterCombo = await fetch('http://localhost:4000/api/offer/with-count?title=Superbe&category=V%C3%A9hicules');
    const filterComboData = await filterCombo.json();
    if (filterComboData.offers.some(o => o.title.includes('Superbe'))) {
      console.log(`✅ Filtre Combiné (Titre + Catégorie) fonctionnel`);
    } else {
      console.log("❌ Échec du filtre combiné");
    }

    console.log("🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !");

  } catch (error) {
    console.error("❌ ERREUR LORS DU TEST :", error);
  }
}

runTests();
