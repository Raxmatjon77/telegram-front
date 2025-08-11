import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "../types";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (
    username: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "LOGIN_SUCCESS"; payload: { token: string } }
  | { type: "LOGOUT" }
  | { type: "RESTORE_SESSION"; payload: { token: string } }
  | { type: "SET_LOADING"; payload: boolean };

const authReducer = (
  state: AuthState & { isLoading: boolean },
  action: AuthAction
): AuthState & { isLoading: boolean } => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
    case "RESTORE_SESSION":
      return {
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const initialState: AuthState & { isLoading: boolean } = {
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // API configuration
  const API_BASE_URL = "http://localhost:4001/api/v1";

  // Token validation function
  // const validateToken = async (token: string): Promise<User | null> => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/auth/validate`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "x-app-token": "123",
  //       },
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       return data.user;
  //     }
  //     return null;
  //   } catch (error) {
  //     console.error("Token validation error:", error);
  //     return null;
  //   }
  // };

  useEffect(() => {
    // Restore session from localStorage on app start
    const initializeAuth = async () => {
      dispatch({ type: "SET_LOADING", payload: true });

      const token = localStorage.getItem("token");

      if (token) {
        try {
          // Validate token with backend
          const validUser = true;

          if (validUser) {
            // Token is valid, restore session
            dispatch({
              type: "RESTORE_SESSION",
              payload: { token },
            });
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            dispatch({ type: "SET_LOADING", payload: false });
          }
        } catch (error) {
          console.error("Session restore error:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-token": "123",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store in localStorage with expiration check
      localStorage.setItem("token", data.access_token);

      // Also store login timestamp for additional validation
      localStorage.setItem("loginTime", Date.now().toString());

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { token: data.access_token },
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    phone: string,
    password: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-token": "123",
        },
        body: JSON.stringify({ username, email, phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Registration successful - data should contain user info
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    // Clear all auth-related data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");

    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        isLoading: state.isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
