import React, { Component, Fragment } from 'react';
import axios from 'axios';
import './styles.css';
import OffersFilter from '../../components/OffersFilter';
import OfferCard from '../../components/OfferCard';
import LoadMore from '../../components/LoadMore';
import MapView from './MapView';

const MAX_LIMIT_NUMBER = 25;

class Offers extends Component {
	state = {
		offers: [],
		count: 0,
		viewMode: 'list',
		search: {
			title: '',
			category: '',
			priceMin: '',
			priceMax: '',
			sort: 'date-desc',
			skip: 0,
			limit: MAX_LIMIT_NUMBER
		}
	};

	reloadAxios = () => {
		axios
			.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/offer/with-count`, {
				params: this.state.search
			})
			.then(response => {
				this.setState({
					offers: response.data.offers,
					count: response.data.count
				});
			});
	};

	loadMoreAxios = () => {
		const newSkip = this.state.search.skip + this.state.search.limit;
		this.setState(
			prevState => ({
				search: { ...prevState.search, skip: newSkip }
			}),
			() => {
				axios
					.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/offer/with-count`, {
						params: this.state.search
					})
					.then(response => {
						this.setState(prevState => ({
							offers: [...prevState.offers, ...response.data.offers],
							count: response.data.count
						}));
					});
			}
		);
	};

	changeSearch = (newSearch, callback) => {
		this.setState(
			{
				search: {
					...this.state.search,
					...newSearch
				}
			},
			callback
		);
	};

	render() {
		const offersFound = [];
		for (let i = 0; i < this.state.offers.length; i++) {
			offersFound.push(
				<OfferCard
					key={this.state.offers[i]._id}
					id={this.state.offers[i]._id}
					title={this.state.offers[i].title}
					description={this.state.offers[i].description}
					price={this.state.offers[i].price}
					picture={this.state.offers[i].pictures}
					creator={this.state.offers[i].creator}
				/>
			);
		}

		return (
			<Fragment>
				<div className="filters glass-filters">
					<div className="container">
						<OffersFilter
							reloadAxios={this.reloadAxios}
							search={this.state.search}
							changeSearch={this.changeSearch}
						/>
					</div>
				</div>
				<div className="container">
					<div className="offers-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h4>{this.state.count} annonces</h4>
						<div className="view-toggle">
							<button 
								className={`toggle-btn ${this.state.viewMode === 'list' ? 'active' : ''}`}
								onClick={() => this.setState({ viewMode: 'list' })}
							>
								<i className="fas fa-list"></i> Liste
							</button>
							<button 
								className={`toggle-btn ${this.state.viewMode === 'map' ? 'active' : ''}`}
								onClick={() => this.setState({ viewMode: 'map' })}
							>
								<i className="fas fa-map-marked-alt"></i> Carte
							</button>
						</div>
					</div>

					{this.state.viewMode === 'list' ? (
						<>
							<ul className="offers-list">{offersFound}</ul>
							<LoadMore
								loadMoreAxios={this.loadMoreAxios}
								currentCount={this.state.offers.length}
								totalCount={this.state.count}
							/>
						</>
					) : (
						<MapView offers={this.state.offers} />
					)}
				</div>
			</Fragment>
		);
	}
	componentDidMount() {
		const params = new URLSearchParams(this.props.location.search);
		const title = params.get('title') || '';
		
		const initialSearch = {
			...this.state.search,
			title: title
		};

		this.setState({ search: initialSearch }, () => {
			this.reloadAxios();
		});
	}

	componentDidUpdate(prevProps) {
		if (this.props.location.search !== prevProps.location.search) {
			const params = new URLSearchParams(this.props.location.search);
			const title = params.get('title') || '';
			this.setState(prevState => ({
				search: { ...prevState.search, title }
			}), () => {
				this.reloadAxios();
			});
		}
	}
}

export default Offers;
