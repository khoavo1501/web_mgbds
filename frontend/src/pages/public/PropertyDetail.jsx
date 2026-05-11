import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, BedDouble, Bath, Square, Calendar, User as UserIcon, Phone, Mail, Heart, CheckCircle } from "lucide-react";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import api from "../../services/api";
import { useFavorites } from "../../context/FavoritesContext";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        if (response.data.success) {
          setProperty(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch property details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20 text-slate-500 min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
        <p>The property you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-96 relative">
                <img 
                  src={property.images && property.images.length > 0 ? property.images[0].url : 'https://placehold.co/1200x800/eeeeee/999999?text=No+Image'} 
                  alt={property.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge status={property.status === 'Available' ? 'success' : 'pending'} className="text-sm px-3 py-1">
                    {property.status}
                  </Badge>
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">{property.title}</h1>
                    <p className="text-lg text-gray-500 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-red-500" />
                      {property.district && property.province ? `${property.district}, ${property.province}` : (property.province || 'No Location')}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-3xl font-bold text-red-600">${property.price.toLocaleString()}</div>
                    <p className="text-slate-500 mb-2">{property.propertyType}</p>
                    <button 
                      onClick={() => toggleFavorite(property)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isFavorite(property.propertyId) ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} transition-colors`}
                    >
                      <Heart className={`h-5 w-5 ${isFavorite(property.propertyId) ? 'fill-current' : ''}`} />
                      {isFavorite(property.propertyId) ? 'Đã quan tâm' : 'Quan tâm'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-100 my-6">
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <BedDouble className="h-6 w-6 text-slate-400 mb-2" />
                    <span className="font-bold text-slate-700">3</span>
                    <span className="text-sm text-slate-500">Bedrooms</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Bath className="h-6 w-6 text-slate-400 mb-2" />
                    <span className="font-bold text-slate-700">2</span>
                    <span className="text-sm text-slate-500">Bathrooms</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Square className="h-6 w-6 text-slate-400 mb-2" />
                    <span className="font-bold text-slate-700">{property.area} m²</span>
                    <span className="text-sm text-slate-500">Area</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Description</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {property.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Action Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Interested?</h3>
                <Button className="w-full mb-4 py-3 flex justify-center items-center text-lg">
                  <Calendar className="mr-2 h-5 w-5" />
                  Book a Viewing
                </Button>
                <Button variant="outline" className="w-full py-3">
                  Save to Favorites
                </Button>
              </div>

              {/* Broker Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Assigned Broker</h3>
                <div className="flex items-center mb-4">
                  <div className="bg-slate-100 p-3 rounded-full mr-4">
                    <UserIcon className="h-8 w-8 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{property.assignedTo?.fullName || 'No Broker Assigned'}</div>
                    <div className="text-sm text-slate-500">Senior Broker</div>
                  </div>
                </div>
                <div className="space-y-3 mt-6">
                  <a href={`tel:${property.assignedTo?.phone || ''}`} className="flex items-center text-slate-600 hover:text-red-600 transition-colors">
                    <Phone className="h-4 w-4 mr-3" />
                    {property.assignedTo?.phone || 'N/A'}
                  </a>
                  <a href={`mailto:${property.assignedTo?.email || ''}`} className="flex items-center text-slate-600 hover:text-red-600 transition-colors">
                    <Mail className="h-4 w-4 mr-3" />
                    {property.assignedTo?.email || 'N/A'}
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
