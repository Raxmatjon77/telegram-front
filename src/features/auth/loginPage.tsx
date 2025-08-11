import React, { useState } from "react";
import { useAuth } from "../../context/authContext";
import { MessageCircle, Eye, EyeOff, AlertCircle } from "lucide-react";

interface ApiError {
  message: string;
  field?: string;
}

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { login, register } = useAuth();

  // API configuration
  const API_BASE_URL = "http://localhost:4001/api/v1";

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // For registration, validate username
    if (!isLogin && !username.trim()) {
      errors.username = "Username is required";
    } else if (!isLogin && username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    // For both login and registration, validate email
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email";
    }

    // For registration, validate phone
    if (!isLogin && !phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (
      !isLogin &&
      !/^\+?[\d\s\-\(\)]{10,}$/.test(phone.replace(/\s/g, ""))
    ) {
      errors.phone = "Please enter a valid phone number";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!isLogin && password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Use authContext login method for signin
        await login(email, password);
      } else {
        // Use authContext register method for signup
        await register(username, email, phone, password);
        // Registration successful, switch to login mode
        setError("");
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
        setError("Registration successful! Please sign in.");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setFieldErrors({});
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500 rounded-full p-3">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ChatApp</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {error && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              error.includes("successful")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  fieldErrors.username ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your username"
                required
              />
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.username}
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                fieldErrors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter your email"
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  fieldErrors.phone ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your phone number"
                required
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  fieldErrors.password ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  fieldErrors.confirmPassword
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
                placeholder="Confirm your password"
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
            disabled={loading}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Development Mode</p>
          <p>API URL: {API_BASE_URL}</p>
        </div>
      </div>
    </div>
  );
};
