import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  ArrowLeft,
  Calendar,
  User,
  MessageSquare,
  Camera
} from 'lucide-react';

const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => apiClient.getIssue(id!),
    enabled: !!id,
  });

  const resolveMutation = useMutation({
    mutationFn: async () => apiClient.resolveOwnIssue(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      queryClient.invalidateQueries({ queryKey: ['allIssues'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async () => apiClient.confirmResolution(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const adminResolveMutation = useMutation({
    mutationFn: async () => apiClient.updateIssueStatus(id!, 'awaiting_confirmation', 'Work completed, awaiting citizen confirmation'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'citizen':
        return 'bg-blue-100 text-blue-800';
      case 'admin1':
        return 'bg-purple-100 text-purple-800';
      case 'admin2':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">Failed to load issue details.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const { issue, updates } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{issue.category}</h1>
          <p className="text-gray-600">Issue Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{issue.category}</CardTitle>
                  <CardDescription className="mt-1">
                    Reported by {issue.citizen.name}
                  </CardDescription>
                </div>
                <div className="flex flex-col space-y-2 items-end">
                  <Badge className={getPriorityColor(issue.priority)}>
                    {issue.priority}
                  </Badge>
                  <Badge className={getStatusColor(issue.status)}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(issue.status)}
                      <span>{issue.status.replace('_', ' ')}</span>
                    </span>
                  </Badge>
                  {user?.role === 'citizen' && user?.email === issue.citizen.email && (
                    issue.status === 'awaiting_confirmation' ? (
                      <Button size="sm" variant="outline" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                        {confirmMutation.isPending ? 'Confirming...' : 'Confirm Resolved'}
                      </Button>
                    ) : issue.status !== 'resolved' ? (
                      <Button size="sm" onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending}>
                        {resolveMutation.isPending ? 'Marking...' : 'Mark Resolved'}
                      </Button>
                    ) : !issue.resolutionConfirmed ? (
                      <Button size="sm" variant="outline" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                        {confirmMutation.isPending ? 'Confirming...' : 'Confirm Resolved'}
                      </Button>
                    ) : null
                  )}

                  {user?.role === 'admin1' && issue.status !== 'resolved' && (
                    <Button size="sm" variant="default" onClick={() => adminResolveMutation.mutate()} disabled={adminResolveMutation.isPending}>
                      {adminResolveMutation.isPending ? 'Updating...' : (issue.status === 'awaiting_confirmation' ? 'Awaiting Confirmation' : 'Mark as Resolved')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-700 break-words">{issue.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-gray-600 break-words max-w-full">{issue.location.address}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Reported</p>
                    <p className="text-sm text-gray-600">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {issue.photoUrl && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2 flex items-center space-x-2">
                      <Camera className="h-4 w-4" />
                      <span>Photo</span>
                    </h3>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={`http://localhost:5000${issue.photoUrl}`}
                        alt="Issue photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Status Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {updates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No updates yet</p>
              ) : (
                <div className="space-y-4">
                  {updates.map((update, index) => (
                    <div key={update._id} className="flex space-x-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getStatusIcon(update.status)}
                        </div>
                        {index < updates.length - 1 && (
                          <div className="w-px h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getStatusColor(update.status)}>
                            {update.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getRoleColor(update.updatedBy.role)}>
                            {update.updatedBy.role === 'citizen' ? 'Citizen' : 
                             update.updatedBy.role === 'admin1' ? 'Admin' : 'Supervisor'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          by {update.updatedBy.name}
                        </p>
                        {update.comment && (
                          <p className="text-sm text-gray-700">{update.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(update.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Reporter</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{issue.citizen.name}</p>
                    <p className="text-sm text-gray-600">{issue.citizen.email}</p>
                  </div>
                </div>
                <Badge className={getRoleColor(issue.citizen.role)}>
                  {issue.citizen.role === 'citizen' ? 'Citizen' : 
                   issue.citizen.role === 'admin1' ? 'Admin' : 'Supervisor'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Info */}
          {issue.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{issue.assignedTo.name}</p>
                    <p className="text-sm text-gray-600">{issue.assignedTo.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issue Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Issue ID</span>
                <span className="text-sm font-mono">{issue._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm">{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm">{new Date(issue.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Updates</span>
                <span className="text-sm">{updates.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;

