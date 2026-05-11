import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import PropertyCard from "../../components/PropertyCard";
import Button from "../../components/Button";
import api from "../../services/api";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties');
        if (response.data.success) {
          setProperties(response.data.data.content || []);
        }
      } catch (error) {
        console.error("Failed to fetch properties", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">All Properties</h1>
        
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-1/4">
            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="">Any Province/City</option>
              <option value="ca">California</option>
              <option value="ny">New York</option>
              <option value="tx">Texas</option>
            </select>
          </div>
          <div className="w-full md:w-1/4">
            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="">Property Type</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
            </select>
          </div>
          <div className="w-full md:w-1/4">
            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="">Price Range</option>
              <option value="0-500k">Under $500k</option>
              <option value="500k-1m">$500k - $1M</option>
              <option value="1m+">Over $1M</option>
            </select>
          </div>
          <div className="w-full md:w-1/4 flex gap-2">
            <Button className="flex-1 flex items-center justify-center">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" className="px-3" title="More Filters">
              <SlidersHorizontal className="h-5 w-5 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Property Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <p className="text-xl">No properties found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
