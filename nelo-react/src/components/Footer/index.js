import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

class Footer extends Component {
	render() {
		return (
			<footer>
				<div className="container footer-content">
					<div className="footer-logo">NELO</div>
					<div className="footer-links">
						<Link to="/faq">FAQ</Link>
						<Link to="/credits">Crédits & Mentions Légales</Link>
					</div>
				</div>
			</footer>
		);
	}
}

export default Footer;
