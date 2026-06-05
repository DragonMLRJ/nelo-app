/**
 * db-firebase-wrapper.js
 * ─────────────────────────────────────────────────
 * Couche d'abstraction entre l'API NeDB (utilisée par le legacy)
 * et Firebase Firestore Admin SDK.
 *
 * Objectif : Permettre au code server.js de continuer à utiliser
 * la syntaxe NeDB (find, insert, update, remove, sort, skip, limit)
 * tout en interrogeant Firebase en arrière-plan.
 *
 * Limitations connues (documentées) :
 *   - Les requêtes RegExp sont ignorées côté Firestore (nécessite Algolia/Typesense)
 *   - Les requêtes $or sont simplifiées (fetch complet + filtrage mémoire)
 *   - Les batchs Firestore sont limités à 500 opérations par commit
 * ─────────────────────────────────────────────────
 */

const { db } = require('./firebase-config');

// ═══════════════════════════════════════════════
// CLASSE FirestoreQuery (Chaînable)
// ═══════════════════════════════════════════════

/**
 * Représente une requête Firestore chaînable (.sort().skip().limit())
 * qui s'exécute de manière asynchrone via le protocole thenable.
 */
class FirestoreQuery {
	/**
	 * @param {FirebaseFirestore.Query} ref — Référence Firestore à exécuter
	 * @param {boolean} isCount — Si true, retourne le nombre de documents au lieu des documents
	 */
	constructor(ref, isCount = false) {
		this.ref = ref;
		this.isCount = isCount;
	}

	/**
	 * Tri des résultats.
	 * Compatibilité NeDB : { field: 1 } = ascendant, { field: -1 } = descendant
	 * @param {Object} sortObj — Ex: { created_at: -1 }
	 * @returns {FirestoreQuery}
	 */
	sort(sortObj) {
		for (const key in sortObj) {
			const direction = sortObj[key] === 1 ? 'asc' : 'desc';
			this.ref = this.ref.orderBy(key, direction);
		}
		return this;
	}

	/**
	 * Pagination : sauter N documents.
	 * @param {number} n
	 * @returns {FirestoreQuery}
	 */
	skip(n) {
		if (n > 0) {
			this.ref = this.ref.offset(n);
		}
		return this;
	}

	/**
	 * Limiter le nombre de résultats retournés.
	 * @param {number} n
	 * @returns {FirestoreQuery}
	 */
	limit(n) {
		if (n > 0) {
			this.ref = this.ref.limit(n);
		}
		return this;
	}

	/**
	 * Protocole thenable — permet d'utiliser `await` sur une FirestoreQuery.
	 * @param {Function} resolve
	 * @param {Function} reject
	 */
	async then(resolve, reject) {
		try {
			if (this.isCount) {
				const snapshot = await this.ref.count().get();
				return resolve(snapshot.data().count);
			}

			const snapshot = await this.ref.get();
			const results = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
			resolve(results);
		} catch (error) {
			console.error('[FirestoreQuery] Erreur d\'exécution :', error.message);
			reject(error);
		}
	}
}

// ═══════════════════════════════════════════════
// CLASSE FirestoreWrapper (Interface principale)
// ═══════════════════════════════════════════════

/** Limite maximale d'opérations par batch Firestore */
const BATCH_LIMIT = 500;

/**
 * Wrapper qui expose une API compatible NeDB pour interagir avec Firestore.
 * Utilisé comme : `const offers = new FirestoreWrapper('offers');`
 */
class FirestoreWrapper {
	/**
	 * @param {string} collectionName — Nom de la collection Firestore
	 */
	constructor(collectionName) {
		this.collectionName = collectionName;
		this.collection = db.collection(collectionName);
	}

	/**
	 * Construit une requête Firestore à partir d'un objet de filtrage NeDB.
	 * Supporte : égalité, $gte, $lte, $gt, $lt, $ne.
	 * Ignore : RegExp (nécessite un moteur de recherche dédié), $or, _id.
	 *
	 * @param {Object} query — Objet de requête style NeDB
	 * @returns {FirebaseFirestore.Query}
	 * @private
	 */
	_buildQuery(query) {
		let ref = this.collection;

		for (const key in query) {
			// _id et $or sont traités séparément dans les méthodes appelantes
			if (key === '_id' || key === '$or') continue;

			const val = query[key];

			if (val instanceof RegExp) {
				// ⚠️ Firestore ne supporte pas les expressions régulières.
				// Pour une recherche full-text, intégrer Algolia ou Typesense.
				console.warn(
					`[${this.collectionName}] Recherche RegExp sur "${key}" ignorée — `
					+ 'utilisez un moteur de recherche dédié pour le full-text.'
				);
			} else if (typeof val === 'object' && val !== null) {
				// Opérateurs de comparaison NeDB → Firestore
				if (val.$gte !== undefined) ref = ref.where(key, '>=', val.$gte);
				if (val.$lte !== undefined) ref = ref.where(key, '<=', val.$lte);
				if (val.$gt !== undefined)  ref = ref.where(key, '>', val.$gt);
				if (val.$lt !== undefined)  ref = ref.where(key, '<', val.$lt);
				if (val.$ne !== undefined)  ref = ref.where(key, '!=', val.$ne);
			} else {
				// Égalité simple
				ref = ref.where(key, '==', val);
			}
		}

		return ref;
	}

	// ─── OPÉRATIONS CRUD ────────────────────────────

	/**
	 * Insère un document dans la collection.
	 * @param {Object} doc — Données à insérer
	 * @returns {Promise<Object>} — Document inséré avec son _id Firestore
	 */
	async insert(doc) {
		const ref = await this.collection.add(doc);
		return { _id: ref.id, ...doc };
	}

	/**
	 * Recherche un document unique.
	 * Optimisé : si _id est fourni, accès direct par document (pas de scan).
	 * @param {Object} query — Critères de recherche
	 * @returns {Promise<Object|null>}
	 */
	async findOne(query) {
		if (query._id) {
			const doc = await this.collection.doc(query._id).get();
			return doc.exists ? { _id: doc.id, ...doc.data() } : null;
		}

		const ref = this._buildQuery(query);
		const snapshot = await ref.limit(1).get();

		if (snapshot.empty) return null;
		return { _id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
	}

	/**
	 * Recherche multiple. Retourne une FirestoreQuery chaînable.
	 * @param {Object} query — Critères de recherche
	 * @returns {FirestoreQuery}
	 */
	find(query) {
		if (query.$or) {
			// ⚠️ $or n'est pas nativement supporté par le SDK Admin Firestore.
			// On exécute la requête sans le filtre $or et le tri/filtrage se fait côté applicatif.
			console.warn(
				`[${this.collectionName}] Requête $or détectée — `
				+ 'résultat potentiellement non filtré. Filtrage en mémoire recommandé.'
			);
		}

		const ref = this._buildQuery(query);
		return new FirestoreQuery(ref);
	}

	/**
	 * Compte le nombre de documents correspondant à la requête.
	 * Utilise l'agrégation Firestore (pas de téléchargement de documents).
	 * @param {Object} query — Critères de recherche
	 * @returns {FirestoreQuery}
	 */
	count(query) {
		const ref = this._buildQuery(query);
		return new FirestoreQuery(ref, true);
	}

	/**
	 * Met à jour un ou plusieurs documents.
	 * Supporte la syntaxe NeDB { $set: { ... } }.
	 * Pour les mises à jour multiples, utilise des batchs Firestore (limités à 500 ops).
	 *
	 * @param {Object} query — Critères de sélection
	 * @param {Object} updateDoc — Données à mettre à jour (ou { $set: { ... } })
	 * @param {Object} options — Options (compatibilité NeDB, non utilisé)
	 */
	async update(query, updateDoc, options = {}) {
		const dataToUpdate = updateDoc.$set ? updateDoc.$set : updateDoc;

		if (query._id) {
			// Mise à jour d'un seul document par ID
			await this.collection.doc(query._id).update(dataToUpdate);
		} else {
			// Mise à jour multiple via batch
			const ref = this._buildQuery(query);
			const snapshot = await ref.get();

			if (snapshot.empty) return;

			// Firestore limite les batchs à 500 opérations
			const chunks = this._chunkDocs(snapshot.docs, BATCH_LIMIT);
			for (const chunk of chunks) {
				const batch = db.batch();
				chunk.forEach(doc => batch.update(doc.ref, dataToUpdate));
				await batch.commit();
			}
		}
	}

	/**
	 * Supprime un ou plusieurs documents.
	 * Pour les suppressions multiples, utilise des batchs Firestore.
	 *
	 * @param {Object} query — Critères de sélection
	 * @param {Object} options — Options (compatibilité NeDB, non utilisé)
	 */
	async remove(query, options = {}) {
		if (query._id) {
			// Suppression d'un seul document par ID
			await this.collection.doc(query._id).delete();
		} else {
			// Suppression multiple via batch
			const ref = this._buildQuery(query);
			const snapshot = await ref.get();

			if (snapshot.empty) return;

			const chunks = this._chunkDocs(snapshot.docs, BATCH_LIMIT);
			for (const chunk of chunks) {
				const batch = db.batch();
				chunk.forEach(doc => batch.delete(doc.ref));
				await batch.commit();
			}
		}
	}

	// ─── UTILITAIRES ────────────────────────────────

	/**
	 * Découpe un tableau en sous-tableaux de taille maximale `size`.
	 * Nécessaire car Firestore limite les batchs à 500 opérations.
	 *
	 * @param {Array} docs — Tableau de documents
	 * @param {number} size — Taille maximale de chaque chunk
	 * @returns {Array<Array>}
	 * @private
	 */
	_chunkDocs(docs, size) {
		const chunks = [];
		for (let i = 0; i < docs.length; i += size) {
			chunks.push(docs.slice(i, i + size));
		}
		return chunks;
	}
}

module.exports = FirestoreWrapper;
