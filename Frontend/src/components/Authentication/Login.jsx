import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Heart, Shield, ArrowRight } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Cookie management functions
  const setCookie = (name, value, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
  };

  const clearCookies = () => {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userProfile=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  // Simple encryption/decryption for user data (basic security)
  const encryptData = (data) => {
    try {
      return btoa(JSON.stringify(data));
    } catch (e) {
      console.error('Encryption failed:', e);
      return JSON.stringify(data);
    }
  };

  const decryptData = (encryptedData) => {
    try {
      return JSON.parse(atob(encryptedData));
    } catch (e) {
      console.error('Decryption failed:', e);
      try {
        return JSON.parse(encryptedData);
      } catch (e2) {
        return null;
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError("");
    setSuccessMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data);
        setSuccessMessage(data.message || "Login successful! Redirecting to dashboard...");
        
        // Clear any existing cookies first
        clearCookies();
        
        // Store authentication token in secure cookie
        setCookie("authToken", data.token, 7); // 7 days expiry
        
        // Encrypt and store user data
        const encryptedUserData = encryptData(data.user);
        setCookie("userData", encryptedUserData, 7);
        
        // Store user profile information separately for easy access
        const userProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          mobileNo: data.user.mobileNo,
          lastLogin: new Date().toISOString()
        };
        const encryptedProfile = encryptData(userProfile);
        setCookie("userProfile", encryptedProfile, 7);
        
        // Store login status
        setCookie("isLoggedIn", "true", 7);
        
        // Clear form
        setFormData({
          email: "",
          password: ""
        });
        
        // Redirect to dashboard after success
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
        
      } else {
        // Handle different types of errors from backend
        if (response.status === 400) {
          if (data.message && data.message.includes("User not found")) {
            setServerError("No account found with this email address. Please check your email or register for a new account.");
          } else if (data.message && data.message.includes("Password not matched")) {
            setServerError("Incorrect password. Please check your password and try again.");
          } else if (data.errors && Array.isArray(data.errors)) {
            // Handle validation errors from zod schema
            const validationErrors = {};
            data.errors.forEach(error => {
              if (error.path && error.path.length > 0) {
                validationErrors[error.path[0]] = error.message;
              }
            });
            setErrors(validationErrors);
          } else {
            setServerError(data.message || "Invalid login credentials. Please check your email and password.");
          }
        } else if (response.status === 401) {
          setServerError("Invalid email or password. Please try again.");
        } else if (response.status === 403) {
          setServerError("Your account has been disabled. Please contact support.");
        } else if (response.status === 429) {
          setServerError("Too many login attempts. Please wait a few minutes before trying again.");
        } else if (response.status >= 500) {
          setServerError("Our servers are experiencing issues. Please try again in a few moments.");
        } else {
          setServerError(data.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setServerError("Unable to connect to our servers. Please check your internet connection and try again.");
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Handle forgot password functionality
    alert("Forgot password functionality will be implemented here.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Branding/Info */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 lg:p-12 lg:w-1/2 flex flex-col justify-center items-center text-white">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-white/20 p-4 rounded-full">
                    <Heart className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                    Welcome Back
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg leading-relaxed">
                    Access your personalized cancer care dashboard and continue your journey to better health.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-blue-100">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Secure & encrypted login</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-blue-100">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">Compassionate care awaits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="p-8 lg:p-12 lg:w-1/2">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    Sign In
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Enter your credentials to access your account
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Success Message */}
                  {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Heart className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            {successMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Server Error Message */}
                  {serverError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">
                            {serverError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading || successMessage}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </div>
                    ) : successMessage ? (
                      <div className="flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 mr-2" />
                        Redirecting to Dashboard
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span>Sign In</span>
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Register Link */}
                {!successMessage && (
                  <div className="mt-8 text-center">
                    <p className="text-gray-600 text-sm">
                      Don't have an account?{" "}
                      <a
                        href="/"
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                      >
                        Create one here
                      </a>
                    </p>
                  </div>
                )}

                {/* Quick Access Info */}
                {!successMessage && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        Need immediate assistance?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <a
                          href="tel:+1234567890"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Call Emergency: +123-456-7890
                        </a>
                        <span className="hidden sm:inline text-blue-400">|</span>
                        <a
                          href="/emergency"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Emergency Services
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms and Privacy */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    By signing in, you agree to our{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;