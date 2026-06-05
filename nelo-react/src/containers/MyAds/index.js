import React, { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './styles.css';

class MyAds extends Component {
  state = {
    offers: [],
    isLoading: true
  };

  componentDidMount() {
    this.fetchOffers();
  }

  fetchOffers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/offers`, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      this.setState({ offers: response.data, isLoading: false });
    } catch (error) {
      console.error(error);
      this.setState({ isLoading: false });
    }
  };

  handleDelete = async (offerId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/offer/delete`, {
        headers: { Authorization: `Bearer ${this.props.user.token}` },
        data: { offer_id: offerId }
      });
      this.setState({
        offers: this.state.offers.filter(offer => offer._id !== offerId)
      });
    } catch (error) {
      alert("Erreur lors de la suppression de l'annonce.");
    }
  };

  render() {
    if (this.state.isLoading) return <div className="container"><p>Chargement...</p></div>;

    return (
      <div className="container my-ads-container">
        <h1>Mes Annonces</h1>
        
        {this.state.offers.length === 0 ? (
          <div className="empty-state">
            <p>Vous n'avez publié aucune annonce.</p>
            <Link to="/publish" className="btn">Déposer une annonce</Link>
          </div>
        ) : (
          <ul className="my-ads-list">
            {this.state.offers.map(offer => (
              <li key={offer._id} className="my-ad-card">
                <div className="my-ad-image">
                  <img src={offer.pictures && offer.pictures[0] ? offer.pictures[0].secure_url : ''} alt={offer.title} />
                </div>
                <div className="my-ad-content">
                  <h3>{offer.title}</h3>
                  <p className="price">{offer.price} FCFA</p>
                  <p className="status">{offer.is_sold ? "Vendu" : "En ligne"}</p>
                </div>
                <div className="my-ad-actions">
                  <Link to={`/offer/${offer._id}`} className="btn-outline">Voir</Link>
                  <button onClick={() => this.handleDelete(offer._id)} className="btn-delete">
                    <i className="fas fa-trash"></i> Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}

export default MyAds;
