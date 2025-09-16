import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Eye,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

const IssuesList: React.FC = () => {
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'All',
    search: '',
    page: 1,
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['allIssues', filters],
    queryFn: () => apiClient.getIssues({
      category: filters.category !== 'All' ? filters.category : undefined,
      status: filters.status !== 'All' ? filters.status : undefined,
      page: filters.page,
      limit: 12,
    }),
  });

  const adminResolveMutation = useMutation({
    mutationFn: async (id: string) => apiClient.updateIssueStatus(id, 'awaiting_confirmation', 'Work completed, awaiting citizen confirmation'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allIssues'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Community Issues</h1>
          <p className="text-gray-600">View and track issues reported by citizens</p>
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
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search issues..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                <SelectContent>
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
                onClick={() => setFilters({ category: 'All', status: 'All', search: '', page: 1 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Grid */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600 mb-4">
              {filters.category !== 'All' || filters.status !== 'All' || filters.search
                ? 'Try adjusting your filters to see more results.'
                : 'No issues have been reported yet.'}
            </p>
            {user?.role === 'citizen' && (
              <Button asChild>
                <Link to="/issues/submit">Report First Issue</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue) => (
            <Card key={issue._id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg break-words">{issue.category}</CardTitle>
                    <CardDescription className="mt-1 truncate">
                      by <span className="break-words">{issue.citizen.name}</span>
                    </CardDescription>
                  </div>
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
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3 break-words whitespace-normal">
                  {issue.description}
                </p>

                <div className="flex items-center space-x-2 text-sm text-gray-500 min-w-0">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate break-words max-w-full">{issue.location.address}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>

                {issue.photoUrl && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={`http://localhost:5000${issue.photoUrl}`}
                      alt="Issue photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="secondary" className="w-full bg-white text-[hsl(var(--forest-green))] border border-[hsl(var(--forest-green))] hover:bg-[hsl(var(--fresh-lime))]/30">
                    <Link to={`/issues/${issue._id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                  {user?.role === 'admin1' && issue.status !== 'resolved' && (
                    <Button
                      variant="default"
                      onClick={() => adminResolveMutation.mutate(issue._id)}
                      disabled={adminResolveMutation.isPending}
                    >
                      {adminResolveMutation.isPending ? 'Updating...' : (issue.status === 'awaiting_confirmation' ? 'Awaiting Confirmation' : 'Mark Resolved')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => handlePageChange(page)}
              className="w-10"
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default IssuesList;

