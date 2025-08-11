// utils/apiInterceptor.ts
interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiInterceptor {
  private baseURL: string;
  private onTokenExpired?: () => void;

  constructor(baseURL: string, onTokenExpired?: () => void) {
    this.baseURL = baseURL;
    this.onTokenExpired = onTokenExpired;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "x-app-token": "123",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<Response> {
    const { requiresAuth = true, headers, ...restOptions } = options;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      ...this.getAuthHeaders(),
      ...headers,
    };

    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });

    // Handle token expiration
    if (response.status === 401 && requiresAuth) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (this.onTokenExpired) {
        this.onTokenExpired();
      }

      throw new Error("Session expired. Please login again.");
    }

    return response;
  }

  // Convenience methods
  async get(endpoint: string, options?: ApiRequestOptions): Promise<Response> {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  async post(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<Response> {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

// Create singleton instance
export const apiClient = new ApiInterceptor(
  "http://localhost:4001/api/v1",
  () => {
    // Handle token expiration - reload page to trigger re-authentication
    window.location.reload();
  }
);

// Example usage in your components:
/*
// Instead of:
const response = await fetch(`${API_BASE_URL}/some/endpoint`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Use:
const response = await apiClient.get('/some/endpoint');
*/
