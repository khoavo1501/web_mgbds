import { MapPin, BedDouble, Bath, Square, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import { getPropertyStatusMeta } from "../utils/propertyStatus";

export default function PropertyCard({ property }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const stableSeed = Number(property.propertyId) || 1;
  const bedCount = (stableSeed % 3) + 1;
  const bathCount = (stableSeed % 2) + 1;
  const statusMeta = getPropertyStatusMeta(property.status);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48">
        <img 
          src={property.images && property.images.length > 0 ? property.images[0].url : 'https://placehold.co/600x400/eeeeee/999999?text=No+Image'} 
          alt={property.title} 
          className="w-full h-full object-cover"
        />
        <button 
          onClick={(e) => { e.preventDefault(); toggleFavorite(property); }}
          className="absolute top-2 left-2 p-1.5 bg-white bg-opacity-70 rounded-full hover:bg-opacity-100 transition-all"
        >
          <Heart className={`h-5 w-5 ${isFavorite(property.propertyId) ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
        </button>
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <span className={`rounded px-2 py-1 text-xs font-bold ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>
        <div className="absolute bottom-2 left-2 bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">
          ${property.price.toLocaleString()}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-1 line-clamp-1">{property.title}</h3>
        <p className="text-sm text-gray-500 flex items-center mb-3">
          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
          {property.district && property.province ? `${property.district}, ${property.province}` : (property.province || 'No Location')}
        </p>
        <div className="flex items-center justify-between text-sm text-slate-600 mb-4 border-t border-b border-gray-100 py-2">
          <div className="flex items-center">
            <BedDouble className="h-4 w-4 mr-1 text-slate-400" />
            <span>{bedCount} Beds</span>
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1 text-slate-400" />
            <span>{bathCount} Baths</span>
          </div>
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1 text-slate-400" />
            <span>{property.area} m²</span>
          </div>
        </div>
        <Link 
          to={`/properties/${property.propertyId}`}
          className="block w-full text-center bg-red-50 text-red-600 py-2 rounded font-medium hover:bg-red-100 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
