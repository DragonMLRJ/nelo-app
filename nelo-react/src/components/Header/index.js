import React, { Component, Fragment } from 'react';
import { Link, withRouter } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import './styles.css';

class Header extends Component {
	state = {
		unreadCount: 0,
		notifications: [],
		showDropdown: false
	};

	componentDidMount() {
		if (this.props.user && this.props.user._id) {
			this.fetchNotifications();
			this.setupSocket();
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.user && this.props.user._id && (!prevProps.user || prevProps.user._id !== this.props.user._id)) {
			this.fetchNotifications();
			this.setupSocket();
		}
	}

	componentWillUnmount() {
		if (this.socket) {
			this.socket.disconnect();
		}
	}

	setupSocket = () => {
		if (this.socket) this.socket.disconnect();
		
		this.socket = io(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}`);
		this.socket.on('connect', () => {
			this.socket.emit('register', this.props.user._id);
		});

		this.socket.on('new_notification', (notif) => {
			this.setState(prevState => ({
				notifications: [notif, ...prevState.notifications],
				unreadCount: prevState.unreadCount + 1
			}));
		});
	};

	fetchNotifications = async () => {
		try {
			const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/notifications`, {
				headers: { Authorization: `Bearer ${this.props.user.token}` }
			});
			const unread = response.data.filter(n => !n.is_read).length;
			this.setState({ notifications: response.data, unreadCount: unread });
		} catch (error) {
			console.error('Error fetching notifications for header', error);
		}
	};

	toggleDropdown = (e) => {
		e.preventDefault();
		this.setState(prevState => ({ showDropdown: !prevState.showDropdown }));
	};

	onLogOut = e => {
		this.props.logOut();
		this.props.history.push('/');
	};

	renderAccountNav = () => {
		if (this.props.user._id) {
			return (
				<Fragment>
					<li onClick={this.onLogOut} className="ahref">
						<i className="fas fa-sign-out-alt" /> Déconnexion
					</li>
				</Fragment>
			);
		} else {
			return (
				<Fragment>
					<Link to={{ pathname: '/log_in' }}>
						<li>
							<i className="far fa-user" /> Se connecter
						</li>
					</Link>
				</Fragment>
			);
		}
	};
	render() {
		return (
			<header>
				<div className="container">
					<div className="left-nav">
						<Link to={{ pathname: '/' }}>
							<h1 className="logo">nelo</h1>
						</Link>
						<Link to={{ pathname: '/publish' }} className="publish-btn">
							<i className="far fa-plus-square" /> Déposer une annonce
						</Link>
					</div>
					
					<div className="menu">
						<ul>
							<li className="notification-item" onClick={this.toggleDropdown} style={{ position: 'relative' }}>
								<i className="far fa-bell" />
								<span>Notifications</span>
								{this.state.unreadCount > 0 && (
									<span className="notif-badge">{this.state.unreadCount}</span>
								)}
								{this.state.showDropdown && (
									<div className="notif-dropdown glass-dropdown">
										<div className="dropdown-header">
											<h4>Notifications</h4>
											<Link to="/notifications" onClick={() => this.setState({showDropdown: false})}>Voir tout</Link>
										</div>
										<ul className="dropdown-list">
											{this.state.notifications.slice(0, 5).map(n => (
												<li key={n._id} className={n.is_read ? '' : 'unread'}>
													<p>{n.title}</p>
												</li>
											))}
											{this.state.notifications.length === 0 && (
												<li className="empty">Aucune notification</li>
											)}
										</ul>
									</div>
								)}
							</li>
							<li>
								<i className="far fa-heart" />
								<span>Favoris</span>
							</li>
							<Link to="/messages" style={{ textDecoration: 'none', color: 'inherit' }}>
								<li>
									<i className="far fa-comment-dots" />
									<span>Messages</span>
								</li>
							</Link>
							{this.renderAccountNav()}
						</ul>
					</div>
				</div>
			</header>
		);
	}
}

export default withRouter(Header);
