import { useAuth } from "../context/authContext";

export const useApi = () => {
  const { token, logout } = useAuth();
  const API_BASE_URL = "http://localhost:4001/api/v1";

  const apiCall = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = {
      "Content-Type": "application/json",
      "x-app-token": "123",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      console.warn("Token expired, logging out...");
      logout();
      throw new Error("Session expired. Please login again.");
    }

    return response;
  };

  const get = async (endpoint: string): Promise<Response> => {
    return apiCall(endpoint, { method: "GET" });
  };

  const post = async (endpoint: string, data?: any): Promise<Response> => {
    return apiCall(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  };

  const put = async (endpoint: string, data?: any): Promise<Response> => {
    return apiCall(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  };

  const del = async (endpoint: string): Promise<Response> => {
    return apiCall(endpoint, { method: "DELETE" });
  };

  return { get, post, put, delete: del, apiCall };
};

// Usage example in components:
/*
const MyComponent = () => {
  const api = useApi();
  
  const fetchUserData = async () => {
    try {
      const response = await api.get('/user/profile');
      const userData = await response.json();
      // Handle success
    } catch (error) {
      // Handle error (including automatic logout on 401)
      console.error('API error:', error);
    }
  };
  
  return <div>...</div>;
};
*/
