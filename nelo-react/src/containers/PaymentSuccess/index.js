import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './styles.css'; // Reusing standard container styles

class PaymentSuccess extends Component {
  state = {
    loading: true,
    success: false,
    error: null,
    ratingScore: 5,
    ratingComment: '',
    ratingSubmitted: false,
    sellerId: null,
    offerId: null
  };

  async componentDidMount() {
    const params = new URLSearchParams(this.props.location.search);
    const sessionId = params.get('session_id');
    const offerId = params.get('offer_id');

    if (!sessionId || !offerId) {
      this.setState({ loading: false, error: 'Paramètres manquants' });
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/order/confirm`, {
        session_id: sessionId,
        offer_id: offerId
      }, {
        headers: { authorization: 'Bearer ' + this.props.user.token }
      });
      
      this.setState({ 
        loading: false, 
        success: true,
        sellerId: response.data.seller_id,
        offerId: response.data.offer_id
      });
    } catch (error) {
      this.setState({ loading: false, error: "Erreur lors de la confirmation de la commande" });
    }
  }

  handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/rating/create`, {
        seller_id: this.state.sellerId,
        offer_id: this.state.offerId,
        score: this.state.ratingScore,
        comment: this.state.ratingComment
      }, {
        headers: { authorization: 'Bearer ' + this.props.user.token }
      });
      this.setState({ ratingSubmitted: true });
    } catch (error) {
      alert("Erreur lors de l'envoi de la note.");
    }
  };

  render() {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        {this.state.loading ? (
          <h2>Validation de votre paiement...</h2>
        ) : this.state.success ? (
          <div>
            <i className="fas fa-check-circle fa-5x" style={{ color: '#28a745', marginBottom: '1rem' }}></i>
            <h2>Paiement réussi !</h2>
            <p style={{ margin: '1rem 0' }}>Votre commande a bien été enregistrée. L'annonce est désormais marquée comme vendue.</p>
            
            {this.state.sellerId && !this.state.ratingSubmitted ? (
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', margin: '2rem auto', maxWidth: '400px' }}>
                <h4>Évaluez le vendeur</h4>
                <form onSubmit={this.handleRatingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(num => (
                      <i 
                        key={num} 
                        className="fas fa-star" 
                        style={{ color: num <= this.state.ratingScore ? '#dbac18' : '#ccc', cursor: 'pointer', fontSize: '24px' }}
                        onClick={() => this.setState({ ratingScore: num })}
                      />
                    ))}
                  </div>
                  <textarea 
                    placeholder="Laissez un commentaire sur la transaction..."
                    value={this.state.ratingComment}
                    onChange={(e) => this.setState({ ratingComment: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px' }}
                  ></textarea>
                  <button type="submit" className="btn" style={{ width: '100%' }}>Envoyer l'avis</button>
                </form>
              </div>
            ) : this.state.ratingSubmitted ? (
              <div style={{ background: '#e9ecef', padding: '1rem', borderRadius: '8px', margin: '2rem auto', maxWidth: '400px' }}>
                <p>Merci d'avoir évalué le vendeur ! ⭐</p>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to="/my-transactions" className="btn-outline">Voir mon reçu</Link>
              <Link to="/" className="btn">Retour à l'accueil</Link>
            </div>
          </div>
        ) : (
          <div>
            <i className="fas fa-times-circle fa-5x" style={{ color: '#dc3545', marginBottom: '1rem' }}></i>
            <h2>Échec de la validation</h2>
            <p style={{ margin: '1rem 0' }}>{this.state.error}</p>
            <Link to="/" className="btn">Retour à l'accueil</Link>
          </div>
        )}
      </div>
    );
  }
}

export default PaymentSuccess;
