import React from 'react';
import './styles.css';

const LegalPolicy = () => {
  return (
    <div className="container legal-container">
      <div className="legal-header">
        <h1>Politique Légale & Sécurité</h1>
        <p>Contrats d'interaction, Règles de modération et Engagements Légaux.</p>
      </div>

      <div className="legal-section">
        <h2>1. Contrat d'Interaction et de Transparence</h2>
        <p>
          En utilisant Nelo, chaque utilisateur s'engage à fournir des informations véridiques, exactes et à jour. 
          Les acheteurs et les vendeurs sont tenus de respecter les termes de toute transaction initiée sur notre plateforme. 
          Toute tentative d'escroquerie, de fraude ou de vente d'objets contrefaits ou volés entraînera des sanctions immédiates.
        </p>
      </div>

      <div className="legal-section warning-section">
        <h2><i className="fas fa-ban"></i> 2. Politique de Bannissement (Tolérance Zéro)</h2>
        <p>
          Nelo applique une politique de **Tolérance Zéro** face aux comportements suivants :
        </p>
        <ul>
          <li>Faux profils et usurpation d'identité.</li>
          <li>Publications d'annonces frauduleuses ou trompeuses.</li>
          <li>Propos injurieux, menaces ou harcèlement envers d'autres membres.</li>
          <li>Refus abusif de finaliser une transaction sécurisée sans motif valable.</li>
        </ul>
        <p>
          En cas de violation de ces règles, le compte sera **définitivement banni**, et les adresses IP ainsi que les identifiants d'appareils seront bloqués.
        </p>
      </div>

      <div className="legal-section alert-section">
        <h2><i className="fas fa-gavel"></i> 3. Poursuites Judiciaires et Coopération Légale</h2>
        <p>
          Nous prenons la sécurité de nos utilisateurs très au sérieux. En conformité avec les lois de la République du Congo et les directives de l'<strong>ARPCE</strong> (Agence de Régulation des Postes et des Communications Électroniques), Nelo coopère activement avec les forces de l'ordre.
        </p>
        <p>
          En cas de fraude avérée, d'arnaque ou de dépôt de plainte par une victime, **Nelo se réserve le droit de transmettre l'intégralité des données du fraudeur (Adresses IP, numéros de téléphone, historique de connexion et de messages) aux autorités judiciaires compétentes (Police, Gendarmerie)** pour que des poursuites pénales soient engagées.
        </p>
      </div>
    </div>
  );
};

export default LegalPolicy;
