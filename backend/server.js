require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
// Utilisé uniquement dans la branche de secours NeDB (mode local sans Firebase)
const Datastore = require('nedb-promises');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const FirestoreWrapper = require('./db-firebase-wrapper');
const { admin, useFirebase } = require('./firebase-config');

// ═══════════════════════════════════════════════
// VALIDATION DES VARIABLES D'ENVIRONNEMENT
// ═══════════════════════════════════════════════

// Clé secrète JWT — obligatoire, aucune valeur par défaut en production
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
	throw new Error(
		'[FATAL] La variable d\'environnement JWT_SECRET est manquante. '
		+ 'Ajoutez-la dans le fichier .env avant de démarrer le serveur.'
	);
}

// Clé secrète Stripe — obligatoire, aucune clé codée en dur
if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error(
		'[FATAL] La variable d\'environnement STRIPE_SECRET_KEY est manquante. '
		+ 'Ajoutez-la dans le fichier .env avant de démarrer le serveur.'
	);
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ═══════════════════════════════════════════════
// INITIALISATION DU SERVEUR
// ═══════════════════════════════════════════════

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const io = new Server(server, {
	cors: {
		origin: ['http://localhost:3000', 'http://localhost:3005'],
		methods: ['GET', 'POST']
	}
});

// ═══════════════════════════════════════════════
// BASES DE DONNÉES
// ═══════════════════════════════════════════════

const db = {};

if (useFirebase) {
	db.users = new FirestoreWrapper('users');
	db.offers = new FirestoreWrapper('offers');
	db.conversations = new FirestoreWrapper('conversations');
	db.messages = new FirestoreWrapper('messages');
	db.orders = new FirestoreWrapper('orders');
	db.ratings = new FirestoreWrapper('ratings');
	db.favorites = new FirestoreWrapper('favorites');
	db.notifications = new FirestoreWrapper('notifications');
} else {
	// Mode local de secours — stockage fichier via NeDB
	db.users = Datastore.create({ filename: path.join(__dirname, 'data/users.db'), autoload: true });
	db.offers = Datastore.create({ filename: path.join(__dirname, 'data/offers.db'), autoload: true });
	db.conversations = Datastore.create({ filename: path.join(__dirname, 'data/conversations.db'), autoload: true });
	db.messages = Datastore.create({ filename: path.join(__dirname, 'data/messages.db'), autoload: true });
	db.orders = Datastore.create({ filename: path.join(__dirname, 'data/orders.db'), autoload: true });
	db.ratings = Datastore.create({ filename: path.join(__dirname, 'data/ratings.db'), autoload: true });
	db.favorites = Datastore.create({ filename: path.join(__dirname, 'data/favorites.db'), autoload: true });
	db.notifications = Datastore.create({ filename: path.join(__dirname, 'data/notifications.db'), autoload: true });
}

// ═══════════════════════════════════════════════
// SOCKET.IO — SUIVI DES CONNEXIONS EN TEMPS RÉEL
// ═══════════════════════════════════════════════

// userId -> socketId
const connectedUsers = new Map();

io.on('connection', (socket) => {
	console.log('🔗 Nouveau client connecté:', socket.id);

	// Enregistrement de l'identifiant utilisateur sur le socket
	socket.on('register', (userId) => {
		connectedUsers.set(userId, socket.id);
		console.log(`👤 Utilisateur ${userId} enregistré sur le socket ${socket.id}`);
	});

	socket.on('disconnect', () => {
		// Retirer l'utilisateur du suivi à la déconnexion
		for (const [key, value] of connectedUsers.entries()) {
			if (value === socket.id) {
				connectedUsers.delete(key);
				break;
			}
		}
		console.log('🔌 Client déconnecté:', socket.id);
	});
});

// ═══════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════

app.use(cors({
	origin: ['http://localhost:3000', 'http://localhost:3005'],
	optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ═══════════════════════════════════════════════
// LIMITEURS DE DÉBIT (RATE LIMITING)
// ═══════════════════════════════════════════════

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5,
	message: { error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.' }
});

const messageLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 20,
	message: { error: 'Vous envoyez des messages trop rapidement.' }
});

// ═══════════════════════════════════════════════
// AUTHENTIFICATION — MIDDLEWARE
// ═══════════════════════════════════════════════

const authenticateToken = async (req, res, next) => {
	if (req.headers.authorization) {
		const token = req.headers.authorization.replace('Bearer ', '');
		try {
			const decoded = jwt.verify(token, SECRET_KEY);
			const user = await db.users.findOne({ _id: decoded._id });
			if (user) {
				req.user = { id: user._id, username: user.username };
				return next();
			}
		} catch (error) {
			// Journaliser l'erreur pour faciliter le débogage (jeton expiré, invalide, etc.)
			console.error('[authenticateToken] Erreur de vérification du jeton:', error.message);
		}
	}
	res.status(401).json({ error: 'Non autorisé' });
};

// ═══════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════

/**
 * Envoie une notification à un utilisateur et la diffuse via Socket.IO
 * si l'utilisateur est actuellement connecté.
 */
async function sendNotification(user_id, title, message) {
	const notification = await db.notifications.insert({
		user_id,
		title,
		message,
		is_read: false,
		created_at: new Date()
	});

	const socketId = connectedUsers.get(user_id);
	if (socketId) {
		io.to(socketId).emit('new_notification', notification);
	}
}

/**
 * Expression régulière simple pour valider le format d'un email.
 * Ne couvre pas 100 % des cas RFC 5322, mais suffit pour une validation côté serveur.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ═══════════════════════════════════════════════
// ROUTES — UTILISATEURS (INSCRIPTION / CONNEXION)
// ═══════════════════════════════════════════════

app.post('/api/user/sign_up', async (req, res) => {
	try {
		const { email, password, username } = req.body;

		// --- Validation des entrées ---
		if (!email || !password || !username) {
			return res.status(400).json({ error: 'Paramètres manquants.' });
		}
		if (!EMAIL_REGEX.test(email)) {
			return res.status(400).json({ error: 'Format d\'email invalide.' });
		}
		if (typeof password !== 'string' || password.length < 6) {
			return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
		}
		if (typeof username !== 'string' || username.trim().length < 2) {
			return res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir au moins 2 caractères.' });
		}

		const existingUser = await db.users.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ error: 'Cet utilisateur existe déjà.' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await db.users.insert({
			email,
			username: username.trim(),
			password: hashedPassword,
		});

		const token = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: '7d' });
		res.json({ _id: user._id, token, account: { username: user.username } });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post('/api/user/log_in', loginLimiter, async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await db.users.findOne({ email });
		if (!user) {
			return res.status(401).json({ error: 'Identifiants invalides.' });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ error: 'Identifiants invalides.' });
		}

		const token = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: '7d' });
		res.json({ _id: user._id, token, account: { username: user.username } });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post('/api/user/google_auth', async (req, res) => {
	try {
		const { token } = req.body;
		if (!token) return res.status(400).json({ error: 'Jeton manquant.' });

		let email, username;

		if (useFirebase) {
			// Vérification réelle via Firebase Auth
			const decodedToken = await admin.auth().verifyIdToken(token);
			email = decodedToken.email;
			username = decodedToken.name || email.split('@')[0];
		} else {
			// Mode simulé — pour le développement local uniquement
			email = 'google_user_' + Math.floor(Math.random() * 1000) + '@gmail.com';
			username = 'Google User';
		}

		let user = await db.users.findOne({ email });
		if (!user) {
			user = await db.users.insert({
				email,
				username,
				password: 'google_oauth_no_password_needed_' + Date.now(),
			});
		}

		const authToken = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: '7d' });
		res.json({ _id: user._id, token: authToken, account: { username: user.username } });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// ROUTES — PARAMÈTRES UTILISATEUR
// ═══════════════════════════════════════════════

app.get('/api/user/settings', authenticateToken, async (req, res) => {
	try {
		const user = await db.users.findOne({ _id: req.user.id });
		res.json(user.settings || { hide_phone: false, marketing_emails: true, push_notifications: true });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post('/api/user/settings', authenticateToken, async (req, res) => {
	try {
		const settings = req.body;
		await db.users.update({ _id: req.user.id }, { $set: { settings } });
		res.json({ message: 'Paramètres mis à jour.' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// ROUTES — GESTION DU PROFIL
// ═══════════════════════════════════════════════

app.get('/api/user/profile', authenticateToken, async (req, res) => {
	try {
		const user = await db.users.findOne({ _id: req.user.id });
		if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

		res.json({
			email: user.email,
			username: user.username,
			phone: user.phone || '',
			city: user.city || ''
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post('/api/user/update-profile', authenticateToken, async (req, res) => {
	try {
		const { email, username, phone, city } = req.body;

		// Vérifier si l'email est déjà utilisé par un autre compte
		const existingUser = await db.users.findOne({ email, _id: { $ne: req.user.id } });
		if (existingUser) {
			return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte.' });
		}

		await db.users.update({ _id: req.user.id }, { $set: { email, username, phone, city } });

		// Si le nom d'utilisateur a changé, mettre à jour les annonces correspondantes
		if (username !== req.user.username) {
			await db.offers.update(
				{ 'creator._id': req.user.id },
				{ $set: { 'creator.account.username': username } },
				{ multi: true }
			);
		}

		res.json({ message: 'Profil mis à jour.' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post('/api/user/update-password', authenticateToken, async (req, res) => {
	try {
		const { oldPassword, newPassword } = req.body;
		const user = await db.users.findOne({ _id: req.user.id });

		if (user.password && user.password.includes('google_oauth')) {
			return res.status(400).json({ error: 'Vous êtes connecté via Google, le changement de mot de passe est géré par Google.' });
		}

		const isMatch = await bcrypt.compare(oldPassword, user.password);
		if (!isMatch) {
			return res.status(401).json({ error: 'Ancien mot de passe incorrect.' });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await db.users.update({ _id: req.user.id }, { $set: { password: hashedPassword } });

		res.json({ message: 'Mot de passe mis à jour.' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.delete('/api/user/delete-account', authenticateToken, async (req, res) => {
	try {
		// 1. Supprimer toutes les annonces créées par cet utilisateur
		await db.offers.remove({ 'creator._id': req.user.id }, { multi: true });
		// 2. Supprimer le compte utilisateur
		await db.users.remove({ _id: req.user.id }, {});

		// Note : les commandes, messages et évaluations sont conservés pour l'historique de la plateforme

		res.json({ message: 'Compte supprimé.' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// ROUTES — ANNONCES (OFFRES)
// ═══════════════════════════════════════════════

app.post('/api/offer/publish', authenticateToken, async (req, res) => {
	try {
		const { title, description, price, category, location, files } = req.body;

		// --- Validation des entrées ---
		if (!title || typeof title !== 'string' || title.trim().length < 3) {
			return res.status(400).json({ error: 'Le titre doit contenir au moins 3 caractères.' });
		}
		if (!description || typeof description !== 'string' || description.trim().length === 0) {
			return res.status(400).json({ error: 'La description ne peut pas être vide.' });
		}
		const numericPrice = Number(price);
		if (isNaN(numericPrice) || numericPrice <= 0) {
			return res.status(400).json({ error: 'Le prix doit être un nombre positif.' });
		}

		// Traitement des images envoyées en base64
		const pictures = [];
		if (files && files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				const base64Data = files[i].replace(/^data:image\/\w+;base64,/, '');
				const filename = `${Date.now()}_${i}.jpg`;
				const filepath = path.join(__dirname, 'public/images', filename);
				fs.writeFileSync(filepath, base64Data, { encoding: 'base64' });
				pictures.push({ secure_url: `http://localhost:${PORT}/images/${filename}` });
			}
		}

		const offer = await db.offers.insert({
			title: title.trim(),
			description: description.trim(),
			price: numericPrice,
			category: category || 'Autre',
			location: location || { lat: null, lng: null, address: 'Brazzaville, Congo' },
			pictures,
			creator: {
				account: { username: req.user.username },
				_id: req.user.id
			},
			created_at: new Date()
		});

		res.json({ _id: offer._id });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/user/offers', authenticateToken, async (req, res) => {
	try {
		const offers = await db.offers.find({ 'creator._id': req.user.id }).sort({ created_at: -1 });
		res.json(offers);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.delete('/api/offer/delete', authenticateToken, async (req, res) => {
	try {
		const { offer_id } = req.body;
		const offer = await db.offers.findOne({ _id: offer_id });
		if (!offer) return res.status(404).json({ error: 'Annonce introuvable.' });
		if (offer.creator._id !== req.user.id) return res.status(403).json({ error: 'Non autorisé.' });

		await db.offers.remove({ _id: offer_id }, {});
		res.json({ message: 'Annonce supprimée avec succès.' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/offer/with-count', async (req, res) => {
	try {
		const skip = parseInt(req.query.skip) || 0;
		const limit = parseInt(req.query.limit) || 25;
		const title = req.query.title || '';
		const category = req.query.category || '';
		const priceMin = parseFloat(req.query.priceMin);
		const priceMax = parseFloat(req.query.priceMax);
		const sort = req.query.sort || 'date-desc';

		let query = {};
		if (title) query.title = new RegExp(title, 'i');
		if (category) query.category = category;

		if (priceMin || priceMax) {
			query.price = {};
			if (priceMin) query.price.$gte = priceMin;
			if (priceMax) query.price.$lte = priceMax;
		}

		const count = await db.offers.count(query);

		let sortParams = { created_at: -1 };
		if (sort === 'date-asc') sortParams = { created_at: 1 };
		else if (sort === 'price-asc') sortParams = { price: 1 };
		else if (sort === 'price-desc') sortParams = { price: -1 };

		let offers = await db.offers.find(query).sort(sortParams).skip(skip).limit(limit);

		// Ajouter la note moyenne du vendeur à chaque annonce
		offers = await Promise.all(offers.map(async (offer) => {
			if (offer.creator && offer.creator._id) {
				const ratings = await db.ratings.find({ seller_id: offer.creator._id });
				if (ratings.length > 0) {
					const sum = ratings.reduce((acc, r) => acc + r.score, 0);
					offer.creator.rating = {
						average: (sum / ratings.length).toFixed(1),
						count: ratings.length
					};
				} else {
					offer.creator.rating = { average: 0, count: 0 };
				}
			}
			return offer;
		}));

		res.json({ count, offers });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/offer/:id', async (req, res) => {
	try {
		const offer = await db.offers.findOne({ _id: req.params.id });
		if (!offer) {
			return res.status(404).json({ error: 'Annonce introuvable.' });
		}

		// Calculer la note moyenne du vendeur
		const ratings = await db.ratings.find({ seller_id: offer.creator._id });
		if (ratings.length > 0) {
			const sum = ratings.reduce((acc, r) => acc + r.score, 0);
			offer.creator.rating = {
				average: (sum / ratings.length).toFixed(1),
				count: ratings.length
			};
		} else {
			offer.creator.rating = { average: 0, count: 0 };
		}

		res.json(offer);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// ROUTES — MESSAGERIE
// ═══════════════════════════════════════════════

// Récupérer toutes les conversations de l'utilisateur
app.get('/api/message/conversations', authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id;
		// Conversations où l'utilisateur est acheteur ou vendeur
		const convs = await db.conversations.find({ $or: [{ buyer_id: userId }, { seller_id: userId }] }).sort({ updated_at: -1 });

		// Enrichir chaque conversation avec le profil de l'interlocuteur et les détails de l'annonce
		const populated = await Promise.all(convs.map(async (c) => {
			const otherUserId = c.buyer_id === userId ? c.seller_id : c.buyer_id;
			const otherUser = await db.users.findOne({ _id: otherUserId });
			const offer = await db.offers.findOne({ _id: c.offer_id });

			// Dernier message de la conversation
			const lastMessageList = await db.messages.find({ conversation_id: c._id }).sort({ created_at: -1 }).limit(1);
			const lastMessage = lastMessageList.length > 0 ? lastMessageList[0] : null;

			return {
				_id: c._id,
				offer_id: c.offer_id,
				offer_title: offer ? offer.title : 'Annonce supprimée',
				other_user: {
					_id: otherUserId,
					account: otherUser ? otherUser.account : { username: 'Utilisateur supprimé' }
				},
				last_message: lastMessage,
				updated_at: c.updated_at
			};
		}));

		res.json(populated);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Récupérer les messages d'une conversation spécifique
app.get('/api/message/conversation/:id', authenticateToken, async (req, res) => {
	try {
		const conv = await db.conversations.findOne({ _id: req.params.id });
		if (!conv) return res.status(404).json({ error: 'Conversation introuvable.' });

		// Sécurité : vérifier que l'utilisateur fait partie de la conversation
		if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) {
			return res.status(403).json({ error: 'Accès refusé.' });
		}

		const messages = await db.messages.find({ conversation_id: conv._id }).sort({ created_at: 1 });
		res.json(messages);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Envoyer un message
app.post('/api/message/send', authenticateToken, messageLimiter, async (req, res) => {
	try {
		const { offer_id, receiver_id, content } = req.body;
		const sender_id = req.user.id;

		// --- Validation des entrées ---
		if (!offer_id || !receiver_id || !content) {
			return res.status(400).json({ error: 'Paramètres manquants.' });
		}
		if (typeof content !== 'string' || content.trim().length === 0) {
			return res.status(400).json({ error: 'Le contenu du message ne peut pas être vide.' });
		}
		if (content.length > 2000) {
			return res.status(400).json({ error: 'Le message ne peut pas dépasser 2000 caractères.' });
		}

		// Vérifier si la conversation existe déjà
		let conv = await db.conversations.findOne({
			offer_id: offer_id,
			$or: [
				{ buyer_id: sender_id, seller_id: receiver_id },
				{ buyer_id: receiver_id, seller_id: sender_id }
			]
		});

		// Sinon, créer une nouvelle conversation
		if (!conv) {
			conv = await db.conversations.insert({
				offer_id,
				buyer_id: sender_id,
				seller_id: receiver_id,
				created_at: new Date(),
				updated_at: new Date()
			});
		}

		// Insérer le message
		const message = await db.messages.insert({
			conversation_id: conv._id,
			sender_id,
			receiver_id,
			content: content.trim(),
			created_at: new Date()
		});

		// Mettre à jour la date de dernière activité de la conversation
		await db.conversations.update({ _id: conv._id }, { $set: { updated_at: new Date() } });

		// Diffuser le message en temps réel au destinataire s'il est connecté
		const receiverSocketId = connectedUsers.get(receiver_id);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit('new_message', message);
		}

		// Diffuser aussi à l'expéditeur (synchronisation multi-onglets)
		const senderSocketId = connectedUsers.get(sender_id);
		if (senderSocketId) {
			io.to(senderSocketId).emit('new_message', message);
		}

		res.json(message);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// ROUTES — PAIEMENTS & COMMANDES (STRIPE)
// ═══════════════════════════════════════════════

app.post('/api/payment/create-checkout-session', authenticateToken, async (req, res) => {
	try {
		const { offer_id, delivery_option, delivery_price } = req.body;
		const offer = await db.offers.findOne({ _id: offer_id });

		if (!offer) return res.status(404).json({ error: 'Offre introuvable.' });
		if (offer.is_sold) return res.status(400).json({ error: 'Cette offre est déjà vendue.' });

		// Calcul de la taxe de protection Nelo (5 %)
		const taxAmount = Math.round(offer.price * 0.05);

		// Création de la session de paiement Stripe
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [
				{
					price_data: {
						currency: 'xaf',
						product_data: {
							name: offer.title,
							description: `Vendu par ${offer.creator.account.username}`,
						},
						unit_amount: offer.price,
					},
					quantity: 1,
				},
				{
					price_data: {
						currency: 'xaf',
						product_data: {
							name: 'Frais de protection Nelo (5%)',
						},
						unit_amount: taxAmount,
					},
					quantity: 1,
				},
				...(delivery_price > 0 ? [{
					price_data: {
						currency: 'xaf',
						product_data: {
							name: `Livraison (${delivery_option})`,
						},
						unit_amount: delivery_price,
					},
					quantity: 1,
				}] : [])
			],
			mode: 'payment',
			success_url: `http://localhost:3005/payment/success?session_id={CHECKOUT_SESSION_ID}&offer_id=${offer._id}`,
			cancel_url: `http://localhost:3005/offer/${offer._id}`,
			metadata: {
				offer_id: offer._id,
				buyer_id: req.user.id,
				seller_id: offer.creator._id,
				delivery_option: delivery_option
			}
		});

		res.json({ id: session.id, url: session.url });
	} catch (error) {
		console.error('[Stripe] Erreur:', error);
		res.status(500).json({ error: error.message });
	}
});

app.post('/api/order/confirm', authenticateToken, async (req, res) => {
	try {
		const { session_id, offer_id } = req.body;

		// Vérifier la session auprès de Stripe pour empêcher l'usurpation
		const session = await stripe.checkout.sessions.retrieve(session_id);
		if (!session || session.payment_status !== 'paid') {
			return res.status(400).json({ error: 'Paiement non validé par Stripe.' });
		}

		const offer = await db.offers.findOne({ _id: offer_id });
		if (!offer) return res.status(404).json({ error: 'Offre introuvable.' });

		// Calculer la taxe de 5 % à l'identique de la session
		const taxAmount = Math.round(offer.price * 0.05);
		const totalAmount = offer.price + taxAmount;

		// Enregistrer la commande
		const order = await db.orders.insert({
			offer_id,
			buyer_id: req.user.id,
			seller_id: offer.creator._id,
			amount: offer.price,
			tax: taxAmount,
			total: totalAmount,
			status: 'paid',
			created_at: new Date()
		});

		// Marquer l'annonce comme vendue
		await db.offers.update({ _id: offer_id }, { $set: { is_sold: true } });

		// Envoyer les notifications à l'acheteur et au vendeur
		await sendNotification(req.user.id, 'Paiement réussi', "Votre achat pour l'annonce a été confirmé !");
		await sendNotification(offer.creator._id, 'Article vendu !', 'Un acheteur a payé pour votre annonce.');

		return res.json({ success: true, seller_id: offer.creator._id, offer_id: offer_id });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/user/orders', authenticateToken, async (req, res) => {
	try {
		const orders = await db.orders.find({ buyer_id: req.user.id }).sort({ created_at: -1 });
		// Enrichir avec les détails de l'annonce
		const populated = await Promise.all(orders.map(async (order) => {
			const offer = await db.offers.findOne({ _id: order.offer_id });
			return { ...order, offer };
		}));
		res.json(populated);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// ROUTES — ÉVALUATIONS (RATINGS)
// ═══════════════════════════════════════════════

app.post('/api/rating/create', authenticateToken, async (req, res) => {
	try {
		const { seller_id, offer_id, score, comment } = req.body;

		// --- Validation des entrées ---
		const numericScore = Number(score);
		if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
			return res.status(400).json({ error: 'La note doit être un entier compris entre 1 et 5.' });
		}

		// Sécurité : vérifier que l'utilisateur a bien acheté cet article au vendeur
		const order = await db.orders.findOne({
			buyer_id: req.user.id,
			seller_id: seller_id,
			offer_id: offer_id,
			status: 'paid'
		});

		if (!order) {
			return res.status(403).json({ error: 'Vous ne pouvez évaluer que les vendeurs à qui vous avez acheté un article.' });
		}

		const rating = await db.ratings.insert({
			buyer_id: req.user.id,
			seller_id,
			offer_id,
			score: numericScore,
			comment,
			created_at: new Date()
		});
		res.json(rating);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/user/:id/ratings', async (req, res) => {
	try {
		const seller_id = req.params.id;
		const ratings = await db.ratings.find({ seller_id });
		ratings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

		let average = 0;
		if (ratings.length > 0) {
			const sum = ratings.reduce((acc, r) => acc + r.score, 0);
			average = sum / ratings.length;
		}

		res.json({
			average: average.toFixed(1),
			count: ratings.length,
			ratings
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// ROUTES — FAVORIS
// ═══════════════════════════════════════════════

app.post('/api/favorite/toggle', authenticateToken, async (req, res) => {
	try {
		const { offer_id } = req.body;
		const user_id = req.user.id;

		if (!offer_id) return res.status(400).json({ error: 'Identifiant de l\'annonce manquant.' });

		const existing = await db.favorites.findOne({ user_id, offer_id });
		if (existing) {
			await db.favorites.remove({ _id: existing._id }, {});
			res.json({ action: 'removed' });
		} else {
			await db.favorites.insert({ user_id, offer_id, created_at: new Date() });
			res.json({ action: 'added' });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/user/favorites', authenticateToken, async (req, res) => {
	try {
		const user_id = req.user.id;
		const favorites = await db.favorites.find({ user_id }).sort({ created_at: -1 });

		// Enrichir avec les détails de l'annonce
		const populated = await Promise.all(favorites.map(async (fav) => {
			const offer = await db.offers.findOne({ _id: fav.offer_id });
			return { ...fav, offer };
		}));

		// Filtrer les annonces supprimées
		const validFavorites = populated.filter(fav => fav.offer !== null);

		res.json(validFavorites);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// ROUTES — NOTIFICATIONS
// ═══════════════════════════════════════════════

app.get('/api/notifications', authenticateToken, async (req, res) => {
	try {
		const notifications = await db.notifications.find({ user_id: req.user.id }).sort({ created_at: -1 });
		res.json(notifications);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post('/api/notifications/read', authenticateToken, async (req, res) => {
	try {
		const { notification_id } = req.body;
		await db.notifications.update({ _id: notification_id, user_id: req.user.id }, { $set: { is_read: true } });
		res.json({ success: true });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// ═══════════════════════════════════════════════
// DÉMARRAGE DU SERVEUR
// ═══════════════════════════════════════════════

server.listen(PORT, () => {
	console.log(`🚀 Serveur Nelo démarré sur le port ${PORT}`);
});
