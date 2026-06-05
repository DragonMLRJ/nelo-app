import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import './MapView.css';

// Fix for default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = ({ offers }) => {
  // Default center (Brazzaville, Congo)
  const defaultCenter = [-4.2699, 15.2712];

  // Filter offers that actually have location data
  const validOffers = offers.filter(o => o.location && o.location.lat && o.location.lng);

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={false}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validOffers.map(offer => (
          <Marker 
            key={offer._id} 
            position={[offer.location.lat, offer.location.lng]}
          >
            <Popup className="offer-popup">
              <Link to={`/offer/${offer._id}`}>
                <div className="popup-content">
                  {offer.pictures && offer.pictures.length > 0 && (
                    <img src={offer.pictures[0].secure_url} alt={offer.title} />
                  )}
                  <div className="popup-info">
                    <h4>{offer.title}</h4>
                    <span className="price">{offer.price} FCFA</span>
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
