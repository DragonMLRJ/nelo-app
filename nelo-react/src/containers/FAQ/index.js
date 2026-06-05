import React from 'react';
import './styles.css';

const FAQ = () => {
  return (
    <div className="static-page container">
      <h2>Foire Aux Questions (FAQ)</h2>
      
      <div className="faq-item">
        <h4>Comment déposer une annonce ?</h4>
        <p>Il vous suffit de créer un compte, puis de cliquer sur le bouton "Déposer une annonce" (ou le bouton "+" sur mobile). Remplissez le formulaire, ajoutez des photos et c'est parti !</p>
      </div>

      <div className="faq-item">
        <h4>Le paiement est-il sécurisé ?</h4>
        <p>Oui. Tous les paiements transitent par Stripe, un leader mondial des paiements en ligne. Nelo ne stocke aucune coordonnée bancaire.</p>
      </div>

      <div className="faq-item">
        <h4>Comment sont calculés les frais de livraison ?</h4>
        <p>Lors de l'achat, vous pouvez choisir entre une remise en main propre (gratuite) ou différents transporteurs. Les frais s'ajouteront automatiquement au total.</p>
      </div>

      <div className="faq-item">
        <h4>Que faire en cas de litige avec un vendeur ?</h4>
        <p>Nous vous conseillons d'abord de communiquer via notre messagerie interne. Si le problème persiste, vous pouvez nous contacter et vous référer au système de notation pour alerter la communauté.</p>
      </div>
    </div>
  );
};

export default FAQ;
