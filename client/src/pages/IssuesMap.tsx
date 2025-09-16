import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Filter,
  Eye,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categories = [
  'All',
  'Infrastructure',
  'Environment', 
  'Safety',
  'Transportation',
  'Utilities',
  'Other'
];

const statuses = [
  'All',
  'pending',
  'acknowledged',
  'in_progress',
  'awaiting_confirmation',
  'resolved'
];

const IssuesMap: React.FC = () => {
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'All',
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['allIssues', filters],
    queryFn: () => apiClient.getIssues({
      category: filters.category !== 'All' ? filters.category : undefined,
      status: filters.status !== 'All' ? filters.status : undefined,
      limit: 100, // Get more issues for map view
    }),
  });

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.log('Could not get user location:', error);
        }
      );
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'awaiting_confirmation':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'acknowledged':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <TrendingUp className="h-4 w-4" />;
      case 'awaiting_confirmation':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#fbbf24'; // yellow
      case 'acknowledged':
        return '#3b82f6'; // blue
      case 'in_progress':
        return '#f97316'; // orange
      case 'resolved':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (status: string) => {
    const color = getMarkerColor(status);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--forest-green))]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">Failed to load issues. Please try again.</p>
      </div>
    );
  }

  const issues = data?.issues || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Issues Map</h1>
          <p className="text-gray-600">View community issues on an interactive map</p>
        </div>
        {user?.role === 'citizen' && (
          <Button asChild>
            <Link to="/issues/submit">
              Report New Issue
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Map Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'All' ? 'All Statuses' : status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button
                variant="outline"
                onClick={() => setFilters({ category: 'All', status: 'All' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-96 w-full">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* User location marker */}
              {userLocation && (
                <Marker position={userLocation}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-medium">Your Location</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Issue markers */}
              {issues.map((issue) => (
                <Marker
                  key={issue._id}
                  position={[issue.location.latitude, issue.location.longitude]}
                  icon={createCustomIcon(issue.status)}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px] max-w-[280px]">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm">{issue.category}</h3>
                        <div className="flex flex-col space-y-1">
                          <Badge className={getPriorityColor(issue.priority)}>
                            {issue.priority}
                          </Badge>
                          <Badge className={getStatusColor(issue.status)}>
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(issue.status)}
                              <span>{issue.status.replace('_', ' ')}</span>
                            </span>
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2 break-words">
                        {issue.description}
                      </p>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate break-words max-w-[200px]">{issue.location.address}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <Button asChild size="sm" className="w-full bg-white text-[hsl(var(--forest-green))] border border-[hsl(var(--forest-green))] hover:bg-[hsl(var(--fresh-lime))]/30">
                        <Link to={`/issues/${issue._id}`}>
                          <Eye className="mr-2 h-3 w-3" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Map Legend</CardTitle>
          <CardDescription>Status indicators on the map</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Acknowledged</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm">Resolved</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssuesMap;

