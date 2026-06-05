/**
 * firebase-config.js
 * ─────────────────────────────────────────────────
 * Point d'entrée unique pour la connexion Firebase Admin.
 *
 * Deux modes de fonctionnement :
 *   1. PRODUCTION (Firebase)  — si serviceAccountKey.json est présent
 *   2. LOCAL (NeDB fallback)  — si le fichier est absent
 *
 * Exporte : { admin, db, useFirebase }
 * ─────────────────────────────────────────────────
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/** @type {FirebaseFirestore.Firestore | null} */
let db = null;

/** @type {boolean} Indique si Firebase est actif (true) ou si on tourne en mode local NeDB (false) */
let useFirebase = false;

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');

try {
	let serviceAccount = null;

	if (process.env.FIREBASE_SERVICE_ACCOUNT) {
		serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
	} else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
		serviceAccount = require(SERVICE_ACCOUNT_PATH);
	}

	if (serviceAccount) {
		// ── Mode Firebase (Production) ──────────────────
		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
		});

		db = admin.firestore();
		useFirebase = true;

		console.log('✅ Firebase Firestore connecté avec succès');
	} else {
		// ── Mode Local (NeDB — développement sans Firebase) ──
		console.warn(
			'⚠️  serviceAccountKey.json introuvable et FIREBASE_SERVICE_ACCOUNT non défini.\n'
			+ '   → Le backend tourne en mode local (NeDB).\n'
			+ '   → Placez le fichier dans /backend/ ou configurez la variable d\'environnement pour activer Firebase.'
		);

		// Initialisation factice pour éviter les crashs si du code
		// référence admin.firestore() sans vérifier useFirebase
		admin.initializeApp({ projectId: 'nelo-local-dev' });
		db = admin.firestore();
	}
} catch (error) {
	console.error('❌ Erreur critique lors de l\'initialisation Firebase :', error.message);
	process.exit(1);
}

module.exports = { admin, db, useFirebase };
