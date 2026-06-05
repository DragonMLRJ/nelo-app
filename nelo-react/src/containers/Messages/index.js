import React, { Component, Fragment } from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import './styles.css';

class Messages extends Component {
  state = {
    conversations: [],
    activeConversationId: null,
    messages: [],
    newMessage: '',
    isMobileChatVisible: false
  };

  componentDidMount() {
    if (this.props.user._id) {
      this.fetchConversations();
      this.setupSocket();
    }
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  setupSocket = () => {
    this.socket = io(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}`);
    
    this.socket.on('connect', () => {
      this.socket.emit('register', this.props.user._id);
    });

    this.socket.on('new_message', (message) => {
      // Refresh conversations list to update unread status / last message
      this.fetchConversations();

      // If the message belongs to the current active conversation, append it
      if (this.state.activeConversationId === message.conversation_id) {
        this.setState(prevState => ({
          messages: [...prevState.messages, message]
        }), () => {
          this.scrollToBottom();
        });
      }
    });
  };

  fetchConversations = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/message/conversations`, {
        headers: { authorization: 'Bearer ' + this.props.user.token }
      });
      this.setState({ conversations: response.data });
      
      // Select first conversation by default on desktop
      if (response.data.length > 0 && !this.state.activeConversationId && window.innerWidth >= 768) {
        this.selectConversation(response.data[0]._id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Removed manual polling function

  fetchMessages = async (convId, isPolling = false) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/message/conversation/` + convId, {
        headers: { authorization: 'Bearer ' + this.props.user.token }
      });
      this.setState({ messages: response.data });
      
      if (!isPolling) {
        this.scrollToBottom();
      }
    } catch (error) {
      console.error(error);
    }
  };

  selectConversation = (convId) => {
    this.setState({ activeConversationId: convId, isMobileChatVisible: true });
    this.fetchMessages(convId);
  };

  sendMessage = async (e) => {
    e.preventDefault();
    if (!this.state.newMessage.trim() || !this.state.activeConversationId) return;

    const conv = this.state.conversations.find(c => c._id === this.state.activeConversationId);
    if (!conv) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/message/send`, {
        offer_id: conv.offer_id,
        receiver_id: conv.other_user._id,
        content: this.state.newMessage
      }, {
        headers: { authorization: 'Bearer ' + this.props.user.token }
      });

      this.setState({ newMessage: '' });
      this.fetchMessages(this.state.activeConversationId);
      this.fetchConversations();
    } catch (error) {
      console.error(error);
    }
  };

  scrollToBottom = () => {
    if (this.chatEnd) {
      this.chatEnd.scrollIntoView({ behavior: 'smooth' });
    }
  };

  formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  render() {
    if (!this.props.user._id) {
      return <Redirect to="/log_in" />;
    }

    const { conversations, activeConversationId, messages, isMobileChatVisible } = this.state;
    const activeConv = conversations.find(c => c._id === activeConversationId);

    return (
      <div className="msg-layout">
        {/* SIDEBAR */}
        <div className="msg-sidebar" style={{ display: isMobileChatVisible && window.innerWidth < 768 ? 'none' : 'flex' }}>
          <div className="msg-sidebar-header">
            <h2 style={{ marginBottom: '1rem' }}>Messages</h2>
            <input type="text" placeholder="Rechercher une conversation..." />
          </div>
          <div className="msg-list">
            {conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Aucune conversation</div>
            ) : (
              conversations.map(conv => {
                const isActive = conv._id === activeConversationId;
                const avatar = conv.other_user.account.username.charAt(0).toUpperCase();
                
                return (
                  <div 
                    key={conv._id} 
                    className={`msg-item ${isActive ? 'active' : ''}`}
                    onClick={() => this.selectConversation(conv._id)}
                  >
                    <div className="msg-item-avatar">{avatar}</div>
                    <div className="msg-item-content">
                      <div className="msg-item-header">
                        <span className="msg-item-name">{conv.other_user.account.username}</span>
                        <span className="msg-item-time">{this.formatTime(conv.updated_at)}</span>
                      </div>
                      <div className="msg-item-preview">
                        <strong>{conv.offer_title}</strong> 
                        {conv.last_message ? ` : ${conv.last_message.content}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className={`msg-main ${isMobileChatVisible || window.innerWidth >= 768 ? 'active' : ''}`}>
          {activeConv ? (
            <Fragment>
              <div className="msg-main-header">
                <button 
                  className="back-btn" 
                  onClick={() => this.setState({ isMobileChatVisible: false })}
                  aria-label="Retour"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                </button>
                <div className="msg-item-avatar">{activeConv.other_user.account.username.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{activeConv.other_user.account.username}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{activeConv.offer_title}</div>
                </div>
              </div>
              
              <div className="msg-chat">
                {messages.map(m => {
                  const isMe = m.sender_id === this.props.user._id;
                  return (
                    <div key={m._id} className={`bubble ${isMe ? 'bubble--me' : 'bubble--them'}`}>
                      {m.content}
                    </div>
                  );
                })}
                <div ref={(el) => { this.chatEnd = el; }}></div>
              </div>
              
              <form className="msg-input-area" onSubmit={this.sendMessage}>
                <input 
                  type="text" 
                  placeholder="Écrivez un message..." 
                  value={this.state.newMessage}
                  onChange={(e) => this.setState({ newMessage: e.target.value })}
                />
                <button type="submit">Envoyer</button>
              </form>
            </Fragment>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
              Sélectionnez une conversation
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Messages;
