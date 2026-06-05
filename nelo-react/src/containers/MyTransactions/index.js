import React, { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './styles.css';

class MyTransactions extends Component {
  state = {
    orders: [],
    isLoading: true
  };

  componentDidMount() {
    this.fetchOrders();
  }

  fetchOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/orders`, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      this.setState({ orders: response.data, isLoading: false });
    } catch (error) {
      console.error(error);
      this.setState({ isLoading: false });
    }
  };

  render() {
    if (this.state.isLoading) return <div className="container"><p>Chargement...</p></div>;

    return (
      <div className="container my-transactions-container">
        <h1>Mes Transactions & Reçus</h1>
        
        {this.state.orders.length === 0 ? (
          <div className="empty-state">
            <p>Vous n'avez effectué aucun achat.</p>
          </div>
        ) : (
          <div className="receipt-list">
            {this.state.orders.map(order => {
              const offerTitle = order.offer ? order.offer.title : 'Annonce supprimée';
              const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div key={order._id} className="receipt-card">
                  <div className="receipt-header">
                    <span className="receipt-id">Reçu #{order._id.substring(0, 8).toUpperCase()}</span>
                    <span className="receipt-date">{date}</span>
                  </div>
                  
                  <div className="receipt-body">
                    <h3>Article acheté</h3>
                    <p className="item-name">{offerTitle}</p>
                  </div>

                  <div className="receipt-footer">
                    <div className="receipt-row">
                      <span>Prix de l'article (HT)</span>
                      <span>{order.amount} FCFA</span>
                    </div>
                    <div className="receipt-row tax-row">
                      <span>Frais de Protection Nelo (Taxe 5%)</span>
                      <span>{order.tax} FCFA</span>
                    </div>
                    <div className="receipt-row total-row">
                      <span>Total Payé (TTC)</span>
                      <span>{order.total} FCFA</span>
                    </div>
                  </div>
                  
                  <div className="receipt-actions">
                    <button className="btn-outline" onClick={() => window.print()}>
                      <i className="fas fa-print"></i> Imprimer le Reçu
                    </button>
                    {order.offer && (
                      <Link to={`/offer/${order.offer_id}`} className="btn">
                        Voir l'annonce
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

export default MyTransactions;
