import React from 'react';
import '../FAQ/styles.css'; // Reuse static page styles

const Credits = () => {
  return (
    <div className="static-page container">
      <h2>Crédits & Mentions Légales</h2>
      
      <div className="faq-item">
        <h4>Mentions Légales</h4>
        <p>
          Nelo est une plateforme de mise en relation de particulier à particulier.<br/>
          Conformément à la Loi n°29-2019 du 10 octobre 2019 de la République du Congo, cette plateforme est soumise aux directives de l'ARPCE concernant le traitement des données à caractère personnel.
        </p>
      </div>

      <div className="faq-item">
        <h4>Politique de Confidentialité</h4>
        <p>
          En utilisant Nelo, vous acceptez que nous collections certaines informations nécessaires au fonctionnement du service (email, historique de messagerie, nom d'utilisateur). 
          Ces données ne sont jamais vendues à des tiers. Les mots de passe sont hachés et sécurisés. Les transactions financières sont déléguées à Stripe et Nelo n'y a pas accès.
        </p>
      </div>

      <div className="faq-item">
        <h4>Crédits</h4>
        <p>
          Design & Développement : Équipe Nelo (2026).<br/>
          Propulsé par React, Node.js et Stripe.<br/>
          Icônes par FontAwesome.
        </p>
      </div>
    </div>
  );
};

export default Credits;
