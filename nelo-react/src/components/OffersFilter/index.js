import React, { Component } from 'react';
import './styles.css';

const CATEGORIES = [
  { name: 'Électronique & Multimédia', icon: 'fas fa-laptop' },
  { name: 'Véhicules', icon: 'fas fa-car' },
  { name: 'Immobilier', icon: 'fas fa-home' },
  { name: 'Mode & Vêtements', icon: 'fas fa-tshirt' },
  { name: 'Maison & Meubles', icon: 'fas fa-couch' },
  { name: 'Services', icon: 'fas fa-hands-helping' },
  { name: 'Autre', icon: 'fas fa-box' }
];

class OffersFilter extends Component {
  state = {
    showFilters: false,
    typingTimeout: null
  };

  handleTextChange = e => {
    const { name, value } = e.target;
    
    if (this.state.typingTimeout) {
      clearTimeout(this.state.typingTimeout);
    }
    
    // Only update state without calling axios yet
    this.props.changeSearch({ [name]: value, skip: 0 }, () => {});
    
    // Set timeout to fetch
    this.setState({
      typingTimeout: setTimeout(() => {
        this.props.reloadAxios();
      }, 400)
    });
  };

  handleChange = e => {
    const { name, value } = e.target;
    this.props.changeSearch({ [name]: value, skip: 0 }, this.props.reloadAxios);
  };

  handleCategorySelect = (category) => {
    const newCategory = this.props.search.category === category ? '' : category;
    this.props.changeSearch({ category: newCategory, skip: 0 }, this.props.reloadAxios);
  };

  toggleFilters = () => {
    this.setState({ showFilters: !this.state.showFilters });
  };

  render() {
    const { search } = this.props;
    const { showFilters } = this.state;

    return (
      <div className="modern-search-container">
        {/* HERO SEARCH BAR */}
        <div className="hero-search-wrapper">
          <div className="hero-search-bar">
            <i className="fas fa-search search-icon"></i>
            <input
              name="title"
              type="text"
              placeholder="Rechercher sur nelo..."
              value={search.title || ''}
              onChange={this.handleTextChange}
              autoComplete="off"
            />
            <button className="toggle-filters-btn" onClick={this.toggleFilters}>
              <i className="fas fa-sliders-h"></i>
            </button>
          </div>
        </div>

        {/* CATEGORY CAROUSEL */}
        <div className="category-carousel-wrapper">
          <div className="category-carousel">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.name}
                className={`category-pill ${search.category === cat.name ? 'active' : ''}`}
                onClick={() => this.handleCategorySelect(cat.name)}
              >
                <i className={cat.icon}></i>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ADVANCED FILTERS */}
        {showFilters && (
          <div className="advanced-filters container">
            <div className="filter-group">
              <label>Prix Minimum</label>
              <input
                name="priceMin"
                type="number"
                placeholder="Ex: 5000"
                value={search.priceMin || ''}
                onChange={this.handleTextChange}
              />
            </div>
            
            <div className="filter-group">
              <label>Prix Maximum</label>
              <input
                name="priceMax"
                type="number"
                placeholder="Ex: 100000"
                value={search.priceMax || ''}
                onChange={this.handleTextChange}
              />
            </div>

            <div className="filter-group">
              <label>Trier par</label>
              <select name="sort" onChange={this.handleChange} value={search.sort || 'date-desc'}>
                <option value="date-desc">Plus récentes</option>
                <option value="date-asc">Plus anciennes</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="price-asc">Prix croissant</option>
              </select>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default OffersFilter;
