import React, { Component } from 'react';
import axios from 'axios';
import Empty from '../../assets/img/empty.jpg';
import OfferCard from '../../components/OfferCard';
import './styles.css';

class Offer extends Component {
	state = {
		offer: {},
		picture: '',
		messageText: '',
		showMessageBox: false,
		deliveryOption: 'hand', // 'hand', 'relais', 'home'
		sellerRating: { average: 0, count: 0 },
		similarOffers: []
	};

	handleClick = params => {
		this.setState({ picture: params });
	};

	handleMessageChange = e => {
		this.setState({ messageText: e.target.value });
	};

	sendMessage = async (e) => {
		e.preventDefault();
		if (!this.props.user._id) {
			this.props.history.push('/log_in');
			return;
		}
		if (!this.state.messageText.trim()) return;

		try {
			await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/message/send`, {
				offer_id: this.state.offer._id,
				receiver_id: this.state.offer.creator._id,
				content: this.state.messageText
			}, {
				headers: { authorization: 'Bearer ' + this.props.user.token }
			});
			this.props.history.push('/messages');
		} catch (error) {
			console.error(error);
			alert('Erreur lors de l\'envoi du message');
		}
	};

	handleDeliveryChange = e => {
		this.setState({ deliveryOption: e.target.value });
	};

	handlePurchase = async () => {
		if (!this.props.user._id) {
			this.props.history.push('/log_in');
			return;
		}

		let deliveryPrice = 0;
		if (this.state.deliveryOption === 'relais') deliveryPrice = 2500;
		if (this.state.deliveryOption === 'home') deliveryPrice = 5000;

		try {
			const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/payment/create-checkout-session`, {
				offer_id: this.state.offer._id,
				delivery_option: this.state.deliveryOption,
				delivery_price: deliveryPrice
			}, {
				headers: { authorization: 'Bearer ' + this.props.user.token }
			});
			
			// Redirect to Stripe Checkout URL
			window.location.href = response.data.url;
		} catch (error) {
			console.error(error);
			alert('Erreur lors de la création de la commande Stripe');
		}
	};

	render() {
		if (Object.keys(this.state.offer).length === 0) {
			return <p />;
		}

		let chief = () => {
			if (this.state.offer.creator.account.username === 'stevenpersia') {
				return (
					<span className="crown">
						{this.state.offer.creator.account.username}
						<i className="fas fa-crown" />
					</span>
				);
			} else {
				return <span>{this.state.offer.creator.account.username}</span>;
			}
		};

		const gallery = [];
		for (let i = 0; i < this.state.offer.pictures.length; i++) {
			gallery.push(
				<img
					key={i}
					onClick={() => {
						this.handleClick(this.state.offer.pictures[i].secure_url);
					}}
					src={this.state.offer.pictures[i].secure_url}
					alt={this.state.offer.title + ' ' + i}
				/>
			);
		}

		const description = this.state.offer.description ? (
			<div className="offer-content">
				<h4>Description</h4>
				<p>{this.state.offer.description}</p>
			</div>
		) : null;

		return (
			<div className="container offer-page">
				<div className="offer-layout">
					<div className="offer-main">
						<div className="offer-img">
							<div className="big-img">
								<img src={this.state.picture} alt={this.state.offer.title} />
							</div>
							{gallery.length > 0 && <div className="gallery">{gallery}</div>}
							<div className="offer-img-info">
								<h2>{this.state.offer.title}</h2>
								<span className="price">{this.state.offer.price} FCFA</span>
								<span className="location" style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '8px' }}>
									<i className="fas fa-map-marker-alt"></i> Brazzaville, Congo
								</span>
							</div>
						</div>
						{description}

						{/* SIMILAR OFFERS SECTION */}
						{this.state.similarOffers.length > 0 && (
							<div className="similar-offers-section">
								<h4>Ces articles pourraient vous intéresser</h4>
								<ul className="offers-list similar-grid">
									{this.state.similarOffers.map(offer => (
										<OfferCard 
											key={offer._id} 
											{...offer} 
											user={this.props.user} 
										/>
									))}
								</ul>
							</div>
						)}
					</div>
					
					<div className="offer-sidebar">
						<div className="sidebar-card">
							<div className="avatar">
								<div className="i-avatar">
									<i className="fas fa-user fa-3x" />
								</div>
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
									{chief()}
									{this.state.sellerRating.count > 0 ? (
										<span style={{ color: '#dbac18', fontSize: '14px', marginTop: '4px' }}>
											<i className="fas fa-star" /> {this.state.sellerRating.average}/5 ({this.state.sellerRating.count} avis)
										</span>
									) : (
										<span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
											Nouveau vendeur
										</span>
									)}
								</div>
							</div>
							
							{this.state.showMessageBox ? (
								<form onSubmit={this.sendMessage} style={{ marginTop: '1rem', width: '100%' }}>
									<textarea 
										placeholder="Bonjour, je suis intéressé par votre annonce..."
										value={this.state.messageText}
										onChange={this.handleMessageChange}
										style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', marginBottom: '0.5rem' }}
									></textarea>
									<button type="submit" className="btn tel" style={{ width: '100%' }}>Envoyer</button>
								</form>
							) : (
								<button onClick={() => {
									if (!this.props.user || !this.props.user._id) {
										this.props.history.push('/log_in');
									} else {
										this.setState({ showMessageBox: true });
									}
								}} className="btn tel">
									<i className="fas fa-envelope"></i> Contacter
								</button>
							)}

							<div className="purchase-section">
								<h4 style={{ marginBottom: '1rem' }}>Options de livraison</h4>
								<div className="delivery-option">
									<label>
										<input type="radio" name="delivery" value="hand" checked={this.state.deliveryOption === 'hand'} onChange={this.handleDeliveryChange} />
										Remise en main propre (Gratuit)
									</label>
								</div>
								<div className="delivery-option">
									<label>
										<input type="radio" name="delivery" value="relais" checked={this.state.deliveryOption === 'relais'} onChange={this.handleDeliveryChange} />
										Point Relais (+ 2 500 FCFA)
									</label>
								</div>
								<div className="delivery-option">
									<label>
										<input type="radio" name="delivery" value="home" checked={this.state.deliveryOption === 'home'} onChange={this.handleDeliveryChange} />
										Livraison à domicile (+ 5 000 FCFA)
									</label>
								</div>

								<button onClick={this.handlePurchase} className="btn btn-purchase">
									<i className="fab fa-stripe-s"></i> Acheter maintenant
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	fetchOfferData = () => {
		axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/offer/` + this.props.match.params.id)
			.then(response => {
				const picture = response.data.pictures.length > 0 ? response.data.pictures[0].secure_url : Empty;
				this.setState({ offer: response.data, picture: picture }, () => {
					// Fetch ratings
					if (this.state.offer.creator && this.state.offer.creator._id) {
						axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/user/${this.state.offer.creator._id}/ratings`)
							.then(res => this.setState({ sellerRating: { average: res.data.average, count: res.data.count } }))
							.catch(err => console.error(err));
					}
					// Fetch similar offers
					if (this.state.offer.category) {
						axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/offer/with-count?category=${encodeURIComponent(this.state.offer.category)}&limit=5`)
							.then(res => {
								const similar = res.data.offers.filter(o => o._id !== this.state.offer._id).slice(0, 4);
								this.setState({ similarOffers: similar });
							})
							.catch(err => console.error(err));
					}
				});
			});
	};

	componentDidMount() {
		this.fetchOfferData();
	}

	componentDidUpdate(prevProps) {
		if (this.props.match.params.id !== prevProps.match.params.id) {
			window.scrollTo(0, 0);
			this.setState({ offer: {}, similarOffers: [] });
			this.fetchOfferData();
		}
	}
}

export default Offer;

