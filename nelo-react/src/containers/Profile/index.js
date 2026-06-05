import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

class Profile extends Component {
  handleLogOut = () => {
    this.props.logOut();
    this.props.history.push('/');
  };

  render() {
    const { user } = this.props;

    if (!user || !user._id) {
      this.props.history.push('/log_in');
      return null;
    }

    return (
      <div className="container profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="profile-info">
            <h2>{user.username}</h2>
            <p>Membre Nelo vérifié</p>
          </div>
        </div>

        <div className="profile-menu">
          <div className="menu-group">
            <h3>Tableau de Bord</h3>
            <Link to="/my-ads" className="menu-item">
              <i className="fas fa-bullhorn"></i>
              <span>Mes Annonces</span>
              <i className="fas fa-chevron-right arrow"></i>
            </Link>
            <Link to="/my-transactions" className="menu-item">
              <i className="fas fa-receipt"></i>
              <span>Mes Transactions & Reçus</span>
              <i className="fas fa-chevron-right arrow"></i>
            </Link>
            <Link to="/favorites" className="menu-item">
              <i className="fas fa-heart"></i>
              <span>Mes Favoris</span>
              <i className="fas fa-chevron-right arrow"></i>
            </Link>
          </div>

          <div className="menu-group">
            <h3>Paramètres & Sécurité</h3>
            <Link to="/settings" className="menu-item">
              <i className="fas fa-cog"></i>
              <span>Paramètres de Confidentialité</span>
              <i className="fas fa-chevron-right arrow"></i>
            </Link>
            <Link to="/legal" className="menu-item">
              <i className="fas fa-shield-alt"></i>
              <span>Politique Légale & Sécurité</span>
              <i className="fas fa-chevron-right arrow"></i>
            </Link>
            <Link to="/credits" className="menu-item">
              <i className="fas fa-file-contract"></i>
              <span>Mentions Légales & RGPD</span>
              <i className="fas fa-chevron-right arrow"></i>
            </Link>
          </div>

          <div className="menu-group">
            <button className="logout-btn" onClick={this.handleLogOut}>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Profile;
