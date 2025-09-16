import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userIssues, isLoading: issuesLoading } = useQuery({
    queryKey: ['userIssues', user?.id],
    queryFn: () => apiClient.getUserIssues(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: allIssues, isLoading: allIssuesLoading } = useQuery({
    queryKey: ['allIssues'],
    queryFn: () => apiClient.getIssues({ limit: 10 }),
  });

  // Admin-only aggregate counts (admin1: global; admin2: per selected admin1)
  const isAdmin = user?.role === 'admin1' || user?.role === 'admin2';
  const { data: resolvedIssuesCount } = useQuery({
    queryKey: ['issuesCount', 'resolved'],
    queryFn: () => apiClient.getIssues({ status: 'resolved', limit: 1 }),
    enabled: !!isAdmin,
  });
  const { data: inProgressIssuesCount } = useQuery({
    queryKey: ['issuesCount', 'in_progress'],
    queryFn: () => apiClient.getIssues({ status: 'in_progress', limit: 1 }),
    enabled: !!isAdmin,
  });
  const { data: pendingIssuesCount } = useQuery({
    queryKey: ['issuesCount', 'pending'],
    queryFn: () => apiClient.getIssues({ status: 'pending', limit: 1 }),
    enabled: !!isAdmin,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.getNotifications({ limit: 5 }),
  });

  const confirmFromNotification = useMutation({
    mutationFn: async (issueId: string) => apiClient.confirmResolution(issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['allIssues'] });
      queryClient.invalidateQueries({ queryKey: ['userIssues'] });
    }
  });

  // Admin2: fetch admin1 list and selected admin1's data
  const isAdmin2 = user?.role === 'admin2';
  const { data: admin1List } = useQuery({
    queryKey: ['admins', 'admin1'],
    queryFn: () => apiClient.getAdmins('admin1'),
    enabled: !!isAdmin2,
  });
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const effectiveSelectedAdminId = useMemo(() => {
    if (!isAdmin2) return null;
    if (selectedAdminId) return selectedAdminId;
    const first = admin1List?.admins?.[0]?.id || null;
    return first || null;
  }, [isAdmin2, selectedAdminId, admin1List]);

  // Auto-select first admin when list loads
  React.useEffect(() => {
    if (isAdmin2 && !selectedAdminId && admin1List?.admins?.length) {
      setSelectedAdminId(admin1List.admins[0].id);
    }
  }, [isAdmin2, selectedAdminId, admin1List]);

  const { data: adminProgress } = useQuery({
    queryKey: ['adminProgress', effectiveSelectedAdminId],
    queryFn: () => apiClient.getAdminProgress(effectiveSelectedAdminId || ''),
    enabled: !!effectiveSelectedAdminId,
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
        return <FileText className="h-4 w-4" />;
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

  const userIssuesList = userIssues?.issues || [];
  const recentIssues = allIssues?.issues || [];
  const recentNotifications = notifications?.notifications || [];
  const admin1s = admin1List?.admins || [];
  const selectedAdmin = useMemo(() => {
    if (!isAdmin2) return null;
    return admin1s.find((a: any) => a.id === effectiveSelectedAdminId) || admin1s[0] || null;
  }, [isAdmin2, admin1s, effectiveSelectedAdminId]);

  if (issuesLoading || allIssuesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--forest-green))]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg p-6 text-white" style={{
        background: 'linear-gradient(90deg, hsl(var(--forest-green)) 0%, hsl(var(--leaf-green)) 50%, hsl(var(--teal)) 100%)'
      }}>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-[hsl(var(--fresh-lime))]/90">
          {user?.role === 'citizen' 
            ? 'Help make your community better by reporting issues and tracking their progress.'
            : 'Manage citizen reports and keep your community informed about issue resolution.'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAdmin ? 'Total Issues' : 'My Reports'}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.role === 'admin2' ? (adminProgress?.counts?.total || 0) : (isAdmin ? (allIssues?.total || 0) : userIssuesList.length)}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'All issues in the system' : 'Total issues submitted'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAdmin ? (user?.role === 'admin2' ? (adminProgress?.counts?.resolved || 0) : (resolvedIssuesCount?.total || 0)) : userIssuesList.filter(issue => issue.status === 'resolved').length}</div>
            <p className="text-xs text-muted-foreground">Issues resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAdmin ? (user?.role === 'admin2' ? (adminProgress?.counts?.in_progress || 0) : (inProgressIssuesCount?.total || 0)) : userIssuesList.filter(issue => issue.status === 'in_progress').length}</div>
            <p className="text-xs text-muted-foreground">Currently being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications?.unreadCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unread notifications
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Recent Issues (citizen) / Recent Issues (admin) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{isAdmin ? 'Recent Issues' : 'My Recent Issues'}</CardTitle>
              <CardDescription>{isAdmin ? 'Latest reports across the system' : 'Your latest submitted reports'}</CardDescription>
            </div>
            {!isAdmin && (
              <Button asChild size="sm">
                <Link to="/issues/submit">
                  <Plus className="h-4 w-4 mr-2" />
                  New Issue
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!isAdmin && userIssuesList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No issues submitted yet</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/issues/submit">Submit Your First Issue</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {(isAdmin ? recentIssues : userIssuesList).slice(0, 5).map((issue) => (
                  <div key={issue._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{issue.category}</h4>
                        <Badge className={getPriorityColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{issue.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{issue.location.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(issue.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(issue.status)}
                          <span>{issue.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    </div>
                  </div>
                ))}
                {!isAdmin && userIssuesList.length > 5 && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/issues/list">View All My Issues</Link>
                  </Button>
                )}
                {isAdmin && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/issues/list">View All Issues</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Community Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Community Issues</CardTitle>
            <CardDescription>Latest reports from the community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentIssues.slice(0, 5).map((issue) => (
                <div key={issue._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm">{issue.category}</h4>
                      <Badge className={getPriorityColor(issue.priority)}>
                        {issue.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{issue.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{issue.citizen.name}</span>
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{issue.location.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(issue.status)}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(issue.status)}
                        <span>{issue.status.replace('_', ' ')}</span>
                      </span>
                    </Badge>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to="/issues/list">View All Issues</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin2: Admin1 Progress and Reports */}
      {isAdmin2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Admin1 Team</CardTitle>
              <CardDescription>Select an admin to view progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {admin1s.map((admin: any) => {
                  const id = admin.id;
                  return (
                    <Button key={id} variant={(id === effectiveSelectedAdminId) ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setSelectedAdminId(id)}>
                      <Users className="h-4 w-4 mr-2" />
                      <span className="truncate">{admin.name} ({admin.email})</span>
                    </Button>
                  );
                })}
                {admin1s.length === 0 && (
                  <p className="text-sm text-gray-500">No admin1 users found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Admin Progress</CardTitle>
              <CardDescription>Overall progress of {selectedAdmin ? selectedAdmin.name : '—'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-500">Assigned Total</p>
                  <p className="text-2xl font-semibold">{adminProgress?.counts?.total || 0}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-500">Resolved</p>
                  <p className="text-2xl font-semibold">{adminProgress?.counts?.resolved || 0}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold">{adminProgress?.counts?.in_progress || 0}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold">{adminProgress?.counts?.pending || 0}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Recent Reports handled by {selectedAdmin ? selectedAdmin.name : '—'}</h3>
                <div className="space-y-3">
                  {(adminProgress?.recentIssues || []).map((issue) => (
                    <div key={issue._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm">{issue.category}</h4>
                          <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{issue.description}</p>
                      </div>
                      <Badge className={getStatusColor(issue.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(issue.status)}
                          <span>{issue.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    </div>
                  ))}
                  {(adminProgress?.recentIssues || []).length === 0 && (
                    <p className="text-sm text-gray-500">No issues found for this admin.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest updates on your issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNotifications.slice(0, 3).map((notification) => (
                <div key={notification._id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                    {user?.role === 'citizen' &&
                      notification.issue?.status === 'awaiting_confirmation' &&
                      !notification.issue?.resolutionConfirmed && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => confirmFromNotification.mutate(notification.issue._id)}
                            disabled={confirmFromNotification.isPending}
                          >
                            {confirmFromNotification.isPending ? 'Confirming...' : 'Confirm Resolved'}
                          </Button>
                        </div>
                      )}
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

