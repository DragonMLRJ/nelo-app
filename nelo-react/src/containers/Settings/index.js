import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import './styles.css';

class Settings extends Component {
  state = {
    activeTab: 'profile',
    
    // Profile State
    profile: {
      email: '',
      username: '',
      phone: '',
      city: ''
    },
    
    // Password State
    passwordData: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },

    // Privacy Settings State
    settings: {
      hide_phone: false,
      marketing_emails: true,
      push_notifications: true
    },
    
    isLoading: true,
    message: '',
    error: ''
  };

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    try {
      const [settingsRes, profileRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/settings`, { headers: { Authorization: `Bearer ${this.props.user.token}` } }),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/profile`, { headers: { Authorization: `Bearer ${this.props.user.token}` } })
      ]);
      
      this.setState({ 
        settings: settingsRes.data, 
        profile: profileRes.data,
        isLoading: false 
      });
    } catch (error) {
      console.error(error);
      this.setState({ isLoading: false, error: 'Erreur de chargement des données' });
    }
  };

  showMessage = (msg, isError = false) => {
    if (isError) {
      this.setState({ error: msg, message: '' });
    } else {
      this.setState({ message: msg, error: '' });
    }
    setTimeout(() => this.setState({ message: '', error: '' }), 4000);
  };

  // --- PROFILE LOGIC ---
  handleProfileChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      profile: { ...prevState.profile, [name]: value }
    }));
  };

  handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/update-profile`, this.state.profile, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      this.showMessage('Profil mis à jour avec succès.');
    } catch (err) {
      this.showMessage(err.response?.data?.error || 'Erreur lors de la mise à jour', true);
    }
  };

  // --- PASSWORD LOGIC ---
  handlePasswordChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      passwordData: { ...prevState.passwordData, [name]: value }
    }));
  };

  handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = this.state.passwordData;
    
    if (newPassword !== confirmPassword) {
      return this.showMessage('Les nouveaux mots de passe ne correspondent pas.', true);
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/update-password`, { oldPassword, newPassword }, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      this.setState({ passwordData: { oldPassword: '', newPassword: '', confirmPassword: '' } });
      this.showMessage('Mot de passe mis à jour avec succès.');
    } catch (err) {
      this.showMessage(err.response?.data?.error || 'Erreur lors du changement de mot de passe', true);
    }
  };

  // --- PRIVACY LOGIC ---
  handleToggle = async (key) => {
    const newSettings = { ...this.state.settings, [key]: !this.state.settings[key] };
    this.setState({ settings: newSettings });

    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/settings`, newSettings, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      this.showMessage('Préférences mises à jour.');
    } catch (error) {
      this.showMessage('Erreur lors de la sauvegarde.', true);
    }
  };

  downloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      profile: this.state.profile,
      settings: this.state.settings
    }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mes_donnees_nelo.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- DELETE ACCOUNT LOGIC ---
  handleDeleteAccount = async () => {
    const confirm = window.confirm("ATTENTION : Cette action est irréversible. Toutes vos annonces seront supprimées. Voulez-vous vraiment supprimer votre compte ?");
    if (!confirm) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/delete-account`, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      alert("Votre compte a été supprimé.");
      // We don't have logOut passed here directly, so we redirect and clear cookie or we can pass logOut as prop
      // Since App.js doesn't pass logOut to Settings directly in the previous snippet, we might just clear storage and reload
      localStorage.clear();
      window.location.href = '/'; 
    } catch (error) {
      this.showMessage('Erreur lors de la suppression du compte', true);
    }
  };

  render() {
    if (this.state.isLoading) return <div className="container"><p>Chargement...</p></div>;

    const { activeTab, profile, passwordData, settings, message, error } = this.state;

    return (
      <div className="container settings-container">
        <h1>Paramètres du compte</h1>
        
        {message && <div className="settings-message success">{message}</div>}
        {error && <div className="settings-message error">{error}</div>}

        <div className="settings-layout">
          {/* SIDEBAR TABS */}
          <div className="settings-sidebar">
            <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => this.setState({activeTab: 'profile'})}>
              <i className="fas fa-user"></i> Mon Profil
            </button>
            <button className={activeTab === 'security' ? 'active' : ''} onClick={() => this.setState({activeTab: 'security'})}>
              <i className="fas fa-lock"></i> Sécurité
            </button>
            <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => this.setState({activeTab: 'privacy'})}>
              <i className="fas fa-shield-alt"></i> Vie Privée & Notifs
            </button>
            <button className={activeTab === 'danger' ? 'active danger-tab' : 'danger-tab'} onClick={() => this.setState({activeTab: 'danger'})}>
              <i className="fas fa-exclamation-triangle"></i> Zone de Danger
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="settings-content">
            
            {activeTab === 'profile' && (
              <div className="settings-card fade-in">
                <h3>Informations Publiques & Contact</h3>
                <form onSubmit={this.handleProfileSubmit} className="settings-form">
                  <div className="form-group">
                    <label>Pseudo</label>
                    <input type="text" name="username" value={profile.username} onChange={this.handleProfileChange} required />
                  </div>
                  <div className="form-group">
                    <label>Adresse Email</label>
                    <input type="email" name="email" value={profile.email} onChange={this.handleProfileChange} required />
                  </div>
                  <div className="form-group">
                    <label>Numéro de Téléphone</label>
                    <input type="tel" name="phone" placeholder="+242 00 000 00 00" value={profile.phone} onChange={this.handleProfileChange} />
                  </div>
                  <div className="form-group">
                    <label>Ville / Quartier</label>
                    <input type="text" name="city" placeholder="Ex: Brazzaville, Poto-Poto" value={profile.city} onChange={this.handleProfileChange} />
                  </div>
                  <button type="submit" className="btn">Sauvegarder le profil</button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-card fade-in">
                <h3>Changer mon mot de passe</h3>
                <form onSubmit={this.handlePasswordSubmit} className="settings-form">
                  <div className="form-group">
                    <label>Ancien mot de passe</label>
                    <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={this.handlePasswordChange} required />
                  </div>
                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={this.handlePasswordChange} required />
                  </div>
                  <div className="form-group">
                    <label>Confirmer le nouveau mot de passe</label>
                    <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={this.handlePasswordChange} required />
                  </div>
                  <button type="submit" className="btn">Mettre à jour le mot de passe</button>
                </form>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="settings-card fade-in">
                <h3>Préférences de Confidentialité</h3>
                
                <div className="settings-row">
                  <div className="settings-info">
                    <h4>Masquer mon numéro de téléphone</h4>
                    <p>Votre numéro ne sera pas affiché publiquement sur vos annonces.</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={settings.hide_phone} onChange={() => this.handleToggle('hide_phone')} />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="settings-row">
                  <div className="settings-info">
                    <h4>Emails Marketing Nelo</h4>
                    <p>Recevoir nos offres promotionnelles par email.</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={settings.marketing_emails} onChange={() => this.handleToggle('marketing_emails')} />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="settings-row">
                  <div className="settings-info">
                    <h4>Notifications push</h4>
                    <p>Être alerté sur votre appareil des nouveaux messages et ventes.</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={settings.push_notifications} onChange={() => this.handleToggle('push_notifications')} />
                    <span className="slider round"></span>
                  </label>
                </div>

                <hr style={{ margin: '30px 0', border: 'none', borderBottom: '1px solid var(--border-light)' }} />
                
                <h3>Vos Données Personnelles (RGPD)</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                  Conformément à la loi, vous pouvez télécharger une copie de vos données personnelles détenues par Nelo.
                </p>
                <button className="btn-outline" onClick={this.downloadData}>
                  <i className="fas fa-download"></i> Télécharger mes données
                </button>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="settings-card fade-in" style={{ borderLeft: '4px solid #e74c3c' }}>
                <h3 style={{ color: '#e74c3c' }}>Supprimer mon compte</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                  Attention, la suppression de votre compte est <strong>irréversible</strong>. Toutes vos annonces en ligne seront immédiatement supprimées.
                  L'historique de vos achats sera conservé uniquement pour des raisons comptables et légales.
                </p>
                <button className="btn" style={{ background: '#e74c3c', border: 'none' }} onClick={this.handleDeleteAccount}>
                  <i className="fas fa-trash-alt"></i> Supprimer définitivement
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Settings);
