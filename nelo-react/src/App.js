import React, { Component, Fragment } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Cookies from 'js-cookie';
import SignUp from './containers/SignUp';
import LogIn from './containers/LogIn';
import Publish from './containers/Publish';
import Offer from './containers/Offer';
import Offers from './containers/Offers';
import Messages from './containers/Messages';
import PaymentSuccess from './containers/PaymentSuccess';
import FAQ from './containers/FAQ';
import Credits from './containers/Credits';
import Favorites from './containers/Favorites';
import Profile from './containers/Profile';
import MyAds from './containers/MyAds';
import MyTransactions from './containers/MyTransactions';
import Settings from './containers/Settings';
import Notifications from './containers/Notifications';
import LegalPolicy from './containers/LegalPolicy';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import CookieBanner from './components/CookieBanner';
import './App.css';

class App extends Component {
	state = {
		user: {
			_id: Cookies.get('_id') || '',
			username: Cookies.get('username') || '',
			token: Cookies.get('token') || ''
		}
	};

	logIn = user => {
		Cookies.set('_id', user._id);
		Cookies.set('username', user.username);
		Cookies.set('token', user.token);

		this.setState({
			user: {
				_id: user._id,
				username: user.username,
				token: user.token
			}
		});
	};

	logOut = () => {
		Cookies.remove('_id');
		Cookies.remove('username');
		Cookies.remove('token');

		this.setState({
			user: {
				_id: '',
				username: '',
				token: ''
			}
		});
	};

	render() {
		return (
			<GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com">
				<Fragment>
					<Router>
					<Fragment>
						<Header logOut={this.logOut} user={this.state.user} />
						<Route
							path="/"
							exact
							render={props => <Offers {...props} user={this.state.user} />}
						/>
						<Route
							path="/sign_up"
							render={props => (
								<SignUp {...props} logIn={this.logIn} user={this.state.user} />
							)}
						/>
						<Route
							path="/log_in"
							render={props => (
								<LogIn {...props} logIn={this.logIn} user={this.state.user} />
							)}
						/>
						<Route
							path="/messages"
							render={props => <Messages {...props} user={this.state.user} />}
						/>
						<Route
							path="/payment/success"
							render={props => <PaymentSuccess {...props} user={this.state.user} />}
						/>
						<Route
							path="/publish"
							render={props => (
								<Publish {...props} logIn={this.logIn} user={this.state.user} />
							)}
						/>
						<Route
							path="/offer/:id"
							render={props => <Offer {...props} user={this.state.user} />}
						/>
						<Route path="/faq" render={props => <FAQ {...props} />} />
						<Route path="/credits" render={props => <Credits {...props} />} />
						<Route path="/legal" render={props => <LegalPolicy {...props} />} />
						<Route path="/favorites" render={props => <Favorites {...props} user={this.state.user} />} />
						<Route path="/my-ads" render={props => <MyAds {...props} user={this.state.user} />} />
						<Route path="/my-transactions" render={props => <MyTransactions {...props} user={this.state.user} />} />
						<Route path="/settings" render={props => <Settings {...props} user={this.state.user} />} />
						<Route path="/notifications" render={props => <Notifications {...props} user={this.state.user} />} />
						<Route path="/profile" render={props => <Profile {...props} user={this.state.user} logOut={this.logOut} />} />
						<BottomNav user={this.state.user} />
						<CookieBanner />
						<Footer />
					</Fragment>
				</Router>
			</Fragment>
			</GoogleOAuthProvider>
		);
	}
}

export default App;
