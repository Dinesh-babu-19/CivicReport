import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Users } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const Admins: React.FC = () => {
  const { user } = useAuth();
  const isAdmin2 = user?.role === 'admin2';
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admins', 'admin1'],
    queryFn: () => apiClient.getAdmins('admin1'),
    enabled: !!isAdmin2,
  });

  const [form, setForm] = useState({ name: '', email: '', password: '', zone: '' });

  const createMutation = useMutation({
    mutationFn: async () => apiClient.createAdmin(form),
    onSuccess: () => {
      setForm({ name: '', email: '', password: '', zone: '' });
      queryClient.invalidateQueries({ queryKey: ['admins', 'admin1'] });
    }
  });

  if (!isAdmin2) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">Access denied</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Admin1 Users</h1>
          <p className="text-gray-600">Create and view Admin1 accounts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Admin1</CardTitle>
          <CardDescription>Provide credentials to create a new Admin1 user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Zone (e.g., VIT A)"
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
            />
            <div className="flex space-x-2">
              <Input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.name || !form.email || !form.password || !form.zone}>
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Existing Admin1 Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">Failed to load admins.</p>
            </div>
          ) : (
            <div className="divide-y">
              {(data?.admins || []).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.name}</p>
                    <p className="text-sm text-gray-600 truncate">{a.email}</p>
                    {a.zone && (
                      <p className="text-xs text-gray-500 truncate">Zone: {a.zone}</p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">{a.role}</span>
                </div>
              ))}
              {(data?.admins || []).length === 0 && (
                <p className="text-sm text-gray-500">No admin1 users found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admins;
