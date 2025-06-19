import React, { useState } from "react";
import { Eye, EyeOff, User, Phone, Mail, Lock, Heart, Shield } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobileNo: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobileNo.replace(/\s+/g, ''))) {
      newErrors.mobileNo = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
      const response = await fetch("http://localhost:5000/api/auth/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Registration successful:", data);
        setSuccessMessage(data.message || "Registration successful! Welcome to our cancer care community.");
        
        // Clear form after successful registration
        setFormData({
          name: "",
          mobileNo: "",
          email: "",
          password: ""
        });
        
        // Optional: Redirect after success
        // setTimeout(() => {
        //   window.location.href = '/login';
        // }, 2000);
        
      } else {
        // Handle different types of errors from backend
        if (response.status === 400) {
          if (data.message && data.message.includes("already exists")) {
            setServerError("An account with this email or mobile number already exists. Please try logging in instead.");
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
            setServerError(data.message || "Invalid input data. Please check your information and try again.");
          }
        } else if (response.status === 409) {
          setServerError("An account with this email or mobile number already exists. Please try logging in instead.");
        } else if (response.status === 422) {
          setServerError("The provided data is invalid. Please check your information and try again.");
        } else if (response.status >= 500) {
          setServerError("Our servers are experiencing issues. Please try again in a few moments.");
        } else {
          setServerError(data.message || "Registration failed. Please try again.");
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

  return (
    <>
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
                    Welcome to CancerCare
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg leading-relaxed">
                    Join our community of care and support. Your journey to better health starts with a simple registration.
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-2 text-blue-100">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Your data is secure and protected</span>
                </div>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="p-8 lg:p-12 lg:w-1/2">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    Create Account
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Please fill in your details to get started
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
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Mobile Number Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="mobileNo"
                        placeholder="Enter your mobile number"
                        value={formData.mobileNo}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.mobileNo ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.mobileNo && (
                      <p className="mt-1 text-sm text-red-600">{errors.mobileNo}</p>
                    )}
                  </div>

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
                        placeholder="Create a password"
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
                        Creating Account...
                      </div>
                    ) : successMessage ? (
                      <div className="flex items-center justify-center">
                        <Heart className="h-5 w-5 mr-2" />
                        Account Created Successfully
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>

                {/* Login Link */}
                {!successMessage && (
                  <div className="mt-8 text-center">
                    <p className="text-gray-600 text-sm">
                      Already have an account?{" "}
                      <a
                        href="/login"
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                      >
                        Sign in here
                      </a>
                    </p>
                  </div>
                )}

                {/* Success Actions */}
                {successMessage && (
                  <div className="mt-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="/login"
                        className="flex-1 bg-blue-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Sign In Now
                      </a>
                      <button
                        onClick={() => {
                          setSuccessMessage("");
                          setFormData({
                            name: "",
                            mobileNo: "",
                            email: "",
                            password: ""
                          });
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Register Another
                      </button>
                    </div>
                  </div>
                )}

                {/* Terms and Privacy */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    By creating an account, you agree to our{" "}
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
    </>
  );
};

export default Register;