import React, { Component } from 'react';
import axios from 'axios';
import './styles.css';

class Notifications extends Component {
  state = {
    notifications: [],
    isLoading: true
  };

  componentDidMount() {
    this.fetchNotifications();
  }

  fetchNotifications = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/notifications`, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      this.setState({ notifications: response.data, isLoading: false });
    } catch (error) {
      console.error(error);
      this.setState({ isLoading: false });
    }
  };

  markAsRead = async (id) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/notifications/read`, { notification_id: id }, {
        headers: { Authorization: `Bearer ${this.props.user.token}` }
      });
      
      const newNotifs = this.state.notifications.map(n => 
        n._id === id ? { ...n, is_read: true } : n
      );
      this.setState({ notifications: newNotifs });
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    if (this.state.isLoading) return <div className="container"><p>Chargement...</p></div>;

    const { notifications } = this.state;

    return (
      <div className="container notifications-container">
        <h1>Centre de Notifications</h1>
        
        {notifications.length === 0 ? (
          <div className="empty-state">
            <i className="far fa-bell-slash fa-4x" style={{ color: '#ccc', marginBottom: '16px' }}></i>
            <p>Vous n'avez aucune notification récente.</p>
          </div>
        ) : (
          <ul className="notif-list">
            {notifications.map(notif => {
              const date = new Date(notif.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              });

              return (
                <li 
                  key={notif._id} 
                  className={`notif-card ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => !notif.is_read && this.markAsRead(notif._id)}
                >
                  <div className="notif-icon">
                    <i className="fas fa-bell"></i>
                  </div>
                  <div className="notif-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <span className="notif-date">{date}</span>
                  </div>
                  {!notif.is_read && <div className="unread-dot"></div>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
}

export default Notifications;
