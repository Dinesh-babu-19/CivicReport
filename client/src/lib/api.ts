const API_BASE_URL = '/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin1' | 'admin2';
  zone?: string | null;
}

export interface Issue {
  _id: string;
  category: string;
  zone: string;
  description: string;
  photoUrl?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'pending' | 'acknowledged' | 'in_progress' | 'awaiting_confirmation' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  citizen: User;
  assignedTo?: User;
  resolutionConfirmed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssueUpdate {
  _id: string;
  status: string;
  comment: string;
  updatedBy: User;
  createdAt: string;
}

export interface Notification {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  issue: Issue;
  createdAt: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  async getAdmins(role: 'admin1' | 'admin2') {
    const searchParams = new URLSearchParams();
    searchParams.append('role', role);
    const endpoint = `/auth/admins?${searchParams.toString()}`;
    return this.request<{ admins: Array<{ id: string; name: string; email: string; role: string; zone?: string | null }> }>(endpoint);
  }

  async getZones() {
    return this.request<{ zones: Array<{ zone: string; adminName: string }> }>(`/auth/zones`);
  }

  async createAdmin(admin: { name: string; email: string; password: string; zone: string }) {
    return this.request<{ admin: { id: string; name: string; email: string; role: string; zone: string } }>(`/auth/admins`, {
      method: 'POST',
      body: JSON.stringify({ ...admin, role: 'admin1' }),
    });
  }

  // Issue endpoints
  async submitIssue(issueData: FormData) {
    const url = `${API_BASE_URL}/issues`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: issueData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async getIssues(params?: {
    category?: string;
    status?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/issues?${queryString}` : '/issues';
    
    return this.request<{
      issues: Issue[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(endpoint);
  }

  async getIssue(id: string) {
    return this.request<{ issue: Issue; updates: IssueUpdate[] }>(`/issues/${id}`);
  }

  async getAdminProgress(adminId: string) {
    return this.request<{ admin: { id: string; name: string; email: string }; counts: any; recentIssues: Issue[] }>(`/issues/admin/${adminId}/progress`);
  }

  async getUserIssues(userId: string) {
    return this.request<{ issues: Issue[] }>(`/issues/user/${userId}`);
  }

  async updateIssueStatus(id: string, status: string, comment?: string) {
    return this.request(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    });
  }

  async resolveOwnIssue(id: string) {
    return this.request(`/issues/${id}/resolve`, {
      method: 'PATCH',
    });
  }

  async confirmResolution(id: string) {
    return this.request(`/issues/${id}/confirm-resolution`, {
      method: 'PATCH',
    });
  }

  // Notification endpoints
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    
    return this.request<{
      notifications: Notification[];
      totalPages: number;
      currentPage: number;
      total: number;
      unreadCount: number;
    }>(endpoint);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }
}

export const apiClient = new ApiClient();
