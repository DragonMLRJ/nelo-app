import React, { Component, Fragment } from 'react';
import axios from 'axios';
import OfferCard from '../../components/OfferCard';
import './styles.css';

class Favorites extends Component {
  state = {
    favorites: [],
    isLoading: true,
  };

  componentDidMount() {
    this.fetchFavorites();
  }

  fetchFavorites = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/favorites`, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      this.setState({
        favorites: response.data,
        isLoading: false
      });
    } catch (error) {
      console.error(error);
      this.setState({ isLoading: false });
    }
  };

  render() {
    const { favorites, isLoading } = this.state;

    if (!this.props.user.token) {
      return (
        <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2>Connectez-vous</h2>
          <p>Vous devez être connecté pour voir vos favoris.</p>
        </div>
      );
    }

    return (
      <div className="container">
        <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>Mes Favoris</h2>
        
        {isLoading ? (
          <div>Chargement...</div>
        ) : (
          <Fragment>
            {favorites.length === 0 ? (
              <p>Vous n'avez pas encore d'annonces favorites.</p>
            ) : (
              <ul className="offers-list">
                {favorites.map(fav => (
                  <OfferCard 
                    key={fav.offer_id} 
                    {...fav.offer} 
                    isFavorite={true}
                    user={this.props.user}
                    onFavoriteChange={this.fetchFavorites}
                  />
                ))}
              </ul>
            )}
          </Fragment>
        )}
      </div>
    );
  }
}

export default Favorites;
