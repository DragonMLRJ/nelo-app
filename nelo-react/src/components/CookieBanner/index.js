import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import './styles.css';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = Cookies.get('nelo_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    Cookies.set('nelo_cookie_consent', 'true', { expires: 365 });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <p>
          En poursuivant votre navigation sur <strong>Nelo</strong>, vous acceptez l'utilisation de cookies et le traitement de vos données conformément à notre Politique de Confidentialité et à la réglementation de la République du Congo (ARPCE).
        </p>
        <button onClick={acceptCookies} className="btn-cookie">J'accepte</button>
      </div>
    </div>
  );
};

export default CookieBanner;
