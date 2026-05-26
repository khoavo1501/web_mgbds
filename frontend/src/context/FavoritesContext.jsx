import { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('property_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('property_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (property) => {
    if (!favorites.find(p => p.propertyId === property.propertyId)) {
      setFavorites([...favorites, property]);
    }
  };

  const removeFavorite = (propertyId) => {
    setFavorites(favorites.filter(p => p.propertyId !== propertyId));
  };

  const isFavorite = (propertyId) => {
    return favorites.some(p => p.propertyId === propertyId);
  };

  const toggleFavorite = (property) => {
    if (isFavorite(property.propertyId)) {
      removeFavorite(property.propertyId);
    } else {
      addFavorite(property);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);