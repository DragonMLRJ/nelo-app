const FirestoreWrapper = require('./db-firebase-wrapper');

async function seed() {
  const dbOffers = new FirestoreWrapper('offers');
  
  const mockOffers = [
    {
      title: 'MacBook Pro M1 2020',
      description: 'Très bon état. Vendu avec chargeur.',
      price: 650000,
      category: 'Électronique & Multimédia',
      pictures: [{ secure_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800' }],
      creator: { account: { username: 'Jean D.' } },
      created: new Date()
    },
    {
      title: 'Toyota Rav4 2018',
      description: "Climatisation d'origine, automatique.",
      price: 8500000,
      category: 'Véhicules',
      pictures: [{ secure_url: 'https://images.unsplash.com/photo-1550426735-c33c7ce414ff?w=800' }],
      creator: { account: { username: 'Auto Congo' } },
      created: new Date()
    },
    {
      title: 'Appartement 3 pièces',
      description: 'Centre-ville de Brazzaville, sécurisé.',
      price: 150000,
      category: 'Immobilier',
      pictures: [{ secure_url: 'https://images.unsplash.com/photo-1502672260266-1c1e52409818?w=800' }],
      creator: { account: { username: 'ImmoTech' } },
      created: new Date()
    },
    {
      title: 'Costume pour homme',
      description: 'Taille M, porté une seule fois.',
      price: 25000,
      category: 'Mode & Vêtements',
      pictures: [{ secure_url: 'https://images.unsplash.com/photo-1594938298596-70f56f932f48?w=800' }],
      creator: { account: { username: 'Elie' } },
      created: new Date()
    },
    {
      title: 'Canapé en cuir',
      description: '3 places, cuir véritable marron.',
      price: 120000,
      category: 'Maison & Meubles',
      pictures: [{ secure_url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800' }],
      creator: { account: { username: 'Marie' } },
      created: new Date()
    }
  ];

  console.log('Seeding mock offers...');
  for (let offer of mockOffers) {
    await dbOffers.insert(offer);
  }
  console.log('Seed done!');
  process.exit(0);
}

seed().catch(console.error);
