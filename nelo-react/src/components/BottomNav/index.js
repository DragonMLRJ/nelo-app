import React from 'react';
import { NavLink } from 'react-router-dom';
import './styles.css';

const BottomNav = ({ user }) => {
  return (
    <div className="bottom-nav">
      <NavLink exact to="/" className="bottom-nav-item" activeClassName="active">
        <i className="fas fa-search"></i>
        <span>Explore</span>
      </NavLink>
      <NavLink to={user._id ? "/favorites" : "/log_in"} className="bottom-nav-item" activeClassName="active">
        <i className="far fa-heart"></i>
        <span>Favoris</span>
      </NavLink>
      <NavLink to="/publish" className="bottom-nav-item" activeClassName="active" style={{ flex: 1.2 }}>
        <div className="publish-icon-wrapper">
          <i className="fas fa-plus"></i>
        </div>
      </NavLink>
      <NavLink to="/messages" className="bottom-nav-item" activeClassName="active">
        <i className="fas fa-comment-dots"></i>
        <span>Chat</span>
      </NavLink>
      <NavLink to={user._id ? "/profile" : "/log_in"} className="bottom-nav-item" activeClassName="active">
        <i className="fas fa-user"></i>
        <span>Profil</span>
      </NavLink>
    </div>
  );
};

export default BottomNav;
