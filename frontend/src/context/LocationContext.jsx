import React, { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  // Default centered at Koramangala, Bengaluru (12.9345, 77.6265)
  const [userLocation, setUserLocation] = useState({
    lat: 12.9345,
    lng: 77.6265,
    neighborhood: "Koramangala 4th Block"
  });

  const [radiusKm, setRadiusKm] = useState(5.0); // 0.5km to 25km

  return (
    <LocationContext.Provider value={{ userLocation, setUserLocation, radiusKm, setRadiusKm }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
