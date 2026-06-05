/* ============================================
   NELO — Shared JavaScript
   Marketplace de Petites Annonces
   ============================================ */

let CATEGORIES = [];
let LISTINGS = [];
let CONVERSATIONS = [];
let CITIES = [];

async function loadData() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Erreur de chargement des données');
    const data = await res.json();
    CATEGORIES = data.CATEGORIES || [];
    LISTINGS = data.LISTINGS || [];
    CONVERSATIONS = data.CONVERSATIONS || [];
    CITIES = data.CITIES || [];
    return true;
  } catch (error) {
    console.error('Erreur:', error);
    showToast('Erreur de connexion', 'error');
    return false;
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatPrice(price) {
  if (price === null || price === undefined) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
}

function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(num);
}

function getCategory(id) {
  return CATEGORIES.find(c => c.id === id);
}

function getListing(id) {
  return LISTINGS.find(l => l.id === parseInt(id));
}

function getListingsByCategory(categoryId) {
  return LISTINGS.filter(l => l.category === categoryId);
}

function truncate(str, len) {
  if (str.length <= len) return str;
  return str.substring(0, len) + '…';
}

function generatePlaceholderImage(color, width = 400, height = 300, text = '') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, color);
  grad.addColorStop(1, adjustColor(color, -20));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  
  // Pattern overlay
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      20 + Math.random() * 60,
      0, Math.PI * 2
    );
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  // Icon/text
  if (text) {
    ctx.font = `bold ${Math.min(width, height) / 6}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  
  return canvas.toDataURL('image/jpeg', 0.85);
}

function adjustColor(hex, amount) {
  let color = hex.replace('#', '');
  let r = Math.max(0, Math.min(255, parseInt(color.substring(0, 2), 16) + amount));
  let g = Math.max(0, Math.min(255, parseInt(color.substring(2, 4), 16) + amount));
  let b = Math.max(0, Math.min(255, parseInt(color.substring(4, 6), 16) + amount));
  return `rgb(${r},${g},${b})`;
}

function generateStars(rating) {
  let html = '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  for (let i = 0; i < full; i++) html += '★';
  if (half) html += '½';
  for (let i = full + (half ? 1 : 0); i < 5; i++) html += '☆';
  return html;
}

// ==========================================
// COMPONENTS — Render functions
// ==========================================

function renderHeader(activePage = '') {
  return `
    <header class="header" id="main-header">
      <div class="container header__inner">
        <div class="header__left">
          <a href="index.html" class="header__logo">Nelo</a>
          <a href="post-ad.html" class="btn btn--primary header__post-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            <span class="desktop-only">Déposer une annonce</span>
          </a>
        </div>
        
        <form class="header__search" action="search.html" method="GET">
          <input type="text" name="q" placeholder="Rechercher sur Nelo" aria-label="Recherche">
          <button type="submit" aria-label="Lancer la recherche" class="header__search-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </form>

        <nav class="header__nav" id="main-nav">
          <a href="#" class="header__nav-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span>Mes recherches</span>
          </a>
          <a href="#" class="header__nav-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <span>Favoris</span>
          </a>
          <a href="messages.html" class="header__nav-link ${activePage === 'messages' ? 'header__nav-link--active' : ''}">
            <div style="position:relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span class="badge">3</span>
            </div>
            <span>Messages</span>
          </a>
          <a href="profile.html" class="header__nav-link ${activePage === 'profile' ? 'header__nav-link--active' : ''}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Se connecter</span>
          </a>
        </nav>
      </div>
      <div class="header__subheader">
        <div class="container header__subheader-inner">
          <a href="search.html?cat=immobilier">Immobilier</a>
          <a href="search.html?cat=vehicules">Véhicules</a>
          <a href="search.html?cat=vacances">Locations de vacances</a>
          <a href="search.html?cat=emploi">Emploi</a>
          <a href="search.html?cat=mode">Mode</a>
          <a href="search.html?cat=maison">Maison & Jardin</a>
          <a href="search.html?cat=famille">Famille</a>
          <a href="search.html?cat=electronique">Électronique</a>
          <a href="search.html?cat=loisirs">Loisirs</a>
          <a href="search.html?cat=autres">Autres</a>
        </div>
      </div>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <div class="footer__logo">Nelo</div>
            <p class="footer__desc">
              Le bon coin pour tous vos objets, près de chez vous.
            </p>
          </div>
          <div class="footer__column">
            <h4>À propos</h4>
            <a href="#">Qui sommes-nous ?</a>
            <a href="#">Nous rejoindre</a>
            <a href="#">Presse</a>
          </div>
          <div class="footer__column">
            <h4>Aide</h4>
            <a href="#">Centre d'aide</a>
            <a href="#">Paiement sécurisé</a>
            <a href="#">Règles de diffusion</a>
          </div>
          <div class="footer__column">
            <h4>Légal</h4>
            <a href="#">Conditions générales</a>
            <a href="#">Vie privée / Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function renderListingCard(listing, horizontal = false) {
  const cat = getCategory(listing.category);
  const priceDisplay = listing.priceLabel || formatPrice(listing.price);
  
  return `
    <article class="card ${horizontal ? 'card--horizontal' : ''}" data-id="${listing.id}">
      <a href="listing.html?id=${listing.id}" class="card__link">
        <div class="card__image">
          <!-- Placeholder dynamique géré côté page -->
          ${listing.urgent ? '<span class="card__badge card__badge--urgent">Urgent</span>' : ''}
          ${listing.pro ? '<span class="card__badge card__badge--pro">Pro</span>' : ''}
        </div>
        <div class="card__body">
          <h3 class="card__title" title="${listing.title}">${listing.title}</h3>
          <div class="card__price">${priceDisplay}</div>
          <div class="card__meta">
            ${listing.location} • ${listing.date}
          </div>
        </div>
      </a>
      <button class="card__favorite" aria-label="Ajouter aux favoris" onclick="event.preventDefault(); toggleFavorite(this);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      </button>
    </article>
  `;
}

function renderCategoryCard(cat) {
  return `
    <a href="category.html?cat=${cat.id}" class="category-card">
      <div class="category-card__icon">${cat.icon}</div>
      <span class="category-card__name">${cat.name}</span>
    </a>
  `;
}

// ==========================================
// GLOBAL BEHAVIORS
// ==========================================

function toggleFavorite(btn) {
  btn.classList.toggle('active');
  if (btn.classList.contains('active')) {
    btn.querySelector('svg').setAttribute('fill', 'var(--brand)');
    btn.querySelector('svg').setAttribute('stroke', 'var(--brand)');
    showToast('Annonce sauvegardée');
  } else {
    btn.querySelector('svg').setAttribute('fill', 'none');
    btn.querySelector('svg').setAttribute('stroke', 'currentColor');
    showToast('Annonce retirée');
  }
}

function showToast(message, type = 'default') {
  let container = document.querySelector('.toast');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast__item ${type === 'error' ? 'toast__item--error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
