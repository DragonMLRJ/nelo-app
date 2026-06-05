import React from 'react';
import './styles.css';

const LoadMore = ({ loadMoreAxios, currentCount, totalCount }) => {
  if (currentCount >= totalCount || totalCount === 0) {
    return null; // Nothing more to load
  }

  return (
    <div className="load-more-container">
      <button className="btn-outline load-more-btn" onClick={loadMoreAxios}>
        Charger plus d'annonces
      </button>
      <div className="load-more-text">
        {currentCount} sur {totalCount} affichées
      </div>
    </div>
  );
};

export default LoadMore;
