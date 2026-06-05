import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import './styles.css';
import Empty from '../../assets/img/empty.jpg';

class OfferCard extends Component {
	state = {
		isFavorite: this.props.isFavorite || false
	};

	toggleFavorite = async (e) => {
		e.stopPropagation();
		if (!this.props.user || !this.props.user.token) {
			this.props.history.push('/log_in');
			return;
		}

		try {
			await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/favorite/toggle`, 
				{ offer_id: this.props.id || this.props._id },
				{ headers: { Authorization: `Bearer ${this.props.user.token}` } }
			);
			
			this.setState({ isFavorite: !this.state.isFavorite }, () => {
				if (this.props.onFavoriteChange) {
					this.props.onFavoriteChange();
				}
			});
		} catch (error) {
			console.error(error);
		}
	};

	render() {
		const pics = this.props.picture || this.props.pictures;
		const id = this.props.id || this.props._id;
		const picture =
			pics && pics[0]
				? pics[0].secure_url
				: Empty;

		return (
			<li
				className="offer-element"
				onClick={() => {
					this.props.history.push('/offer/' + id);
				}}
			>
				<div className="offer-image-container">
					<img src={picture} alt={this.props.title} />
					<button className="favorite-btn" onClick={this.toggleFavorite}>
						<i className={this.state.isFavorite ? "fas fa-heart" : "far fa-heart"} style={{ color: this.state.isFavorite ? 'red' : 'white' }}></i>
					</button>
				</div>
				<div className="offer-content">
					<span className="title">{this.props.title}</span>
					<span className="price">{this.props.price} FCFA</span>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
						<span className="location">Brazzaville</span>
						{this.props.creator && this.props.creator.rating && this.props.creator.rating.count > 0 && (
							<span style={{ color: '#dbac18', fontSize: '12px', fontWeight: 'bold' }}>
								<i className="fas fa-star" /> {this.props.creator.rating.average}
							</span>
						)}
					</div>
				</div>
			</li>
		);
	}
}

export default withRouter(OfferCard);
