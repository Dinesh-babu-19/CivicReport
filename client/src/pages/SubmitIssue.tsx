import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { formatAndhraPradeshLocation } from '@/lib/utils';
import { 
  MapPin, 
  Camera, 
  Upload, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const issueSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  zone: z.string().min(1, 'Please select a zone'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.string().min(1, 'Please select a priority'),
});

type IssueFormData = z.infer<typeof issueSchema>;

const categories = [
  'Infrastructure',
  'Environment', 
  'Safety',
  'Transportation',
  'Utilities',
  'Other'
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

const SubmitIssue: React.FC = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Disallow admins from accessing this page
  useEffect(() => {
    if (user && user.role !== 'citizen') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');
  const selectedZone = watch('zone');
  const { data: zonesData } = useQuery({
    queryKey: ['zones'],
    queryFn: () => apiClient.getZones(),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: IssueFormData) => {
      const formData = new FormData();
      formData.append('category', data.category);
      formData.append('description', data.description);
      formData.append('zone', data.zone);
      formData.append('priority', data.priority);
      formData.append('latitude', location?.lat.toString() || '');
      formData.append('longitude', location?.lng.toString() || '');
      formData.append('address', location?.address || '');
      
      if (photo) {
        formData.append('photo', photo);
      }

      return apiClient.submitIssue(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      queryClient.invalidateQueries({ queryKey: ['allIssues'] });
      navigate('/dashboard');
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          // Format the address specifically for Andhra Pradesh
          const address = formatAndhraPradeshLocation(data);

          setLocation({
            lat: latitude,
            lng: longitude,
            address: address
          });
        } catch (error) {
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied by user.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred while retrieving location.');
            break;
        }
      }
    );
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: IssueFormData) => {
    if (!location) {
      setLocationError('Please get your current location before submitting.');
      return;
    }
    submitMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit New Issue</CardTitle>
          <CardDescription>
            Report an issue in your community to help make it a better place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Zone Selection */}
            <div className="space-y-2">
              <Label htmlFor="zone">Zone *</Label>
              <Select onValueChange={(value) => setValue('zone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your zone" />
                </SelectTrigger>
                <SelectContent>
                  {(zonesData?.zones || []).map((z) => (
                    <SelectItem key={z.zone} value={z.zone}>
                      {z.zone} — {z.adminName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zone && (
                <p className="text-sm text-red-500">{errors.zone.message}</p>
              )}
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select onValueChange={(value) => setValue('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center space-x-2">
                        <Badge className={priority.color}>
                          {priority.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-red-500">{errors.priority.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                rows={4}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location *</Label>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Get Current Location
                    </>
                  )}
                </Button>
                
                {locationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{locationError}</AlertDescription>
                  </Alert>
                )}
                
                {location && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Location captured</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">{location.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo (Optional)</Label>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {photo ? 'Change Photo' : 'Upload Photo'}
                </Button>
                
                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending || !location}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Issue...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Issue
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmitIssue;

