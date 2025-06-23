import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  User, 
  MessageCircle, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Send,
  Calendar,
  Clock,
  Shield,
  ChevronDown,
  ArrowLeft,
  RefreshCw,
  Trash2
} from 'lucide-react';

const ChatPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  // Configuration
  const API_BASE_URL = 'http://localhost:5000';

  // Cookie management functions
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
  };

  const decryptData = (encryptedData) => {
    try {
      return JSON.parse(atob(encryptedData));
    } catch (e) {
      try {
        return JSON.parse(encryptedData);
      } catch (e2) {
        return null;
      }
    }
  };

  const clearCookies = () => {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userProfile=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const getAuthToken = () => {
    return getCookie('authToken') || authToken || 'demo-token';
  };

  // Load chat history from backend
  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const currentAuthToken = getAuthToken();
      const storedSessionId = sessionStorage.getItem('chatSessionId');
      
      console.log('🔍 Starting loadChatHistory...', { 
        storedSessionId, 
        hasAuthToken: !!currentAuthToken,
        authToken: currentAuthToken?.substring(0, 20) + '...'
      });
      
      if (storedSessionId && currentAuthToken) {
        console.log('📡 Making API call to load history...');
        
        const url = `${API_BASE_URL}/api/chat/history/${storedSessionId}`;
        console.log('🌐 Request URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': currentAuthToken,
          },
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (response.ok) {
          const result = await response.json();
          console.log('📚 Full API response:', result);
          
          if (result.success && result.data?.messages) {
            console.log('✅ Processing messages...', result.data.messages.length, 'messages found');
            
            // Convert backend messages to frontend format
            const formattedMessages = result.data.messages.map(msg => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              timestamp: new Date(msg.timestamp),
              messageType: msg.messageType || 'text',
              // Include any other message properties
              confirmed: msg.confirmed,
              appointmentDetails: msg.appointmentDetails,
              requiresConfirmation: msg.requiresConfirmation,
              requiresModification: msg.requiresModification,
              appointmentSummary: msg.appointmentSummary,
              missingFields: msg.missingFields,
              isError: msg.isError,
              appointmentId: msg.appointmentId
            }));
            
            console.log('💾 Setting messages in state:', formattedMessages.length, 'messages');
            setMessages(formattedMessages);
            setSessionId(storedSessionId);
            setHistoryLoaded(true);
            
            // Check if the last interaction was a completed booking
            const lastMessage = formattedMessages[formattedMessages.length - 1];
            if (lastMessage && lastMessage.confirmed && lastMessage.appointmentDetails) {
              setBookingComplete(true);
              setAppointmentDetails(lastMessage.appointmentDetails);
              console.log('🎯 Detected completed booking');
            }
            
            console.log(`✅ Successfully loaded ${formattedMessages.length} messages from chat history`);
            return;
          } else {
            console.log('📭 No messages found in response or invalid format');
            console.log('📭 Result structure:', { 
              success: result.success, 
              hasData: !!result.data, 
              hasMessages: !!result.data?.messages,
              messageCount: result.data?.messages?.length || 0
            });
          }
        } else if (response.status === 404) {
          console.log('⚠️ Session not found (404), clearing stored session ID');
          sessionStorage.removeItem('chatSessionId');
          setSessionId(null);
        } else {
          const errorText = await response.text();
          console.error('❌ API call failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText
          });
        }
      } else {
        console.log('ℹ️ No stored session or auth token, skipping history load', {
          hasStoredSession: !!storedSessionId,
          hasAuthToken: !!currentAuthToken
        });
      }
      
      // Only set initial greeting if no history was loaded
      if (!historyLoaded) {
        console.log('👋 Setting initial greeting (no history loaded)');
        setInitialGreeting();
      }
      
    } catch (error) {
      console.error('❌ Error in loadChatHistory:', error);
      if (!historyLoaded) {
        setInitialGreeting();
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const setInitialGreeting = () => {
    console.log('👋 Setting initial greeting message');
    setMessages([{
      id: 1,
      text: "Hello! I'm CancerMitr, your AI care assistant. I'm here to help you schedule your cancer care appointments and answer any questions you might have. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }]);
    setHistoryLoaded(true);
  };

  // Load user data from cookies
  useEffect(() => {
    const loadUserData = () => {
      console.log('🍪 Loading user data from cookies...');
      
      const isLoggedIn = getCookie('isLoggedIn');
      const encryptedProfile = getCookie('userProfile');
      const authTokenFromCookie = getCookie('authToken');
      setAuthToken(authTokenFromCookie);

      console.log('🍪 Cookie data:', {
        isLoggedIn,
        hasProfile: !!encryptedProfile,
        hasAuthToken: !!authTokenFromCookie,
        authTokenPreview: authTokenFromCookie ? authTokenFromCookie.substring(0, 20) + '...' : 'None'
      });
      
      if (!isLoggedIn || !encryptedProfile) {
        const mockUser = {
          id: 1,
          name: "John Doe",
          email: "john.doe@example.com",
          lastLogin: new Date().toISOString()
        };
        setUserProfile(mockUser);
        console.log('👤 Using mock user for demo');
      } else {
        const profileData = decryptData(encryptedProfile);
        if (profileData) {
          setUserProfile(profileData);
          console.log('👤 Loaded real user profile:', profileData.name);
        } else {
          const mockUser = {
            id: 1,
            name: "John Doe",
            email: "john.doe@example.com",
            lastLogin: new Date().toISOString()
          };
          setUserProfile(mockUser);
          console.log('👤 Fallback to mock user (decryption failed)');
        }
      }
      setIsLoading(false);
    };

    loadUserData();
  }, []);

  // Load chat history after user data is loaded
  useEffect(() => {
    if (userProfile && !isLoading && !historyLoaded) {
      console.log('🚀 User profile ready, attempting to load chat history...');
      loadChatHistory();
    }
  }, [userProfile, isLoading, historyLoaded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chatSessionId');
    clearCookies();
    window.location.href = '/login';
  };

  const navigateToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const currentAuthToken = getAuthToken();
      
      console.log('📤 Sending message:', { 
        message: currentMessage, 
        sessionId, 
        hasAuthToken: !!currentAuthToken 
      });
      
      const response = await fetch(`${API_BASE_URL}/api/chat/userChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': currentAuthToken,
        },
        body: JSON.stringify({
          message: currentMessage,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Received response:', data);

      // Update and persist session ID
      if (data.sessionId) {
        if (!sessionId || sessionId !== data.sessionId) {
          console.log('💾 Updating session ID:', data.sessionId);
          setSessionId(data.sessionId);
          sessionStorage.setItem('chatSessionId', String(data.sessionId));
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        text: data.message,
        sender: 'bot',
        timestamp: new Date(),
        confirmed: data.confirmed,
        appointmentId: data.appointmentId,
        appointmentDetails: data.appointmentDetails,
        requiresConfirmation: data.requiresConfirmation,
        requiresModification: data.requiresModification,
        appointmentSummary: data.appointmentSummary,
        missingFields: data.missingFields
      };

      setMessages(prev => [...prev, botMessage]);

      // Handle appointment confirmation
      if (data.confirmed && data.appointmentDetails) {
        setBookingComplete(true);
        setAppointmentDetails(data.appointmentDetails);
      }

    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      let errorText = "I'm sorry, I'm having trouble connecting to the server right now.";
      
      if (error.message.includes('HTTP error! status: 401')) {
        errorText = "Your session has expired. Please login again.";
        setTimeout(() => {
          handleLogout();
        }, 3000);
      } else if (error.message.includes('HTTP error! status: 403')) {
        errorText = "Access denied. Please check your permissions.";
      } else if (error.message.includes('Failed to fetch')) {
        errorText = "Cannot connect to server. Please check if the backend is running on http://localhost:5000";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const startNewBooking = () => {
    sessionStorage.removeItem('chatSessionId');
    setSessionId(null);
    setBookingComplete(false);
    setAppointmentDetails(null);
    setHistoryLoaded(false);
    
    setMessages([{
      id: Date.now(),
      text: "I'd be happy to help you with another appointment. What type of service do you need?",
      sender: 'bot',
      timestamp: new Date()
    }]);
    setHistoryLoaded(true);
  };

  const clearChatHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      sessionStorage.removeItem('chatSessionId');
      setSessionId(null);
      setMessages([]);
      setBookingComplete(false);
      setAppointmentDetails(null);
      setHistoryLoaded(false);
      setInitialGreeting();
      console.log('🗑️ Chat history cleared by user');
    }
  };

  const handleQuickAction = (service) => {
    if (isChatLoading) return;
    
    let message = '';
    switch(service) {
      case 'Chemotherapy':
        message = 'I need to book a chemotherapy session';
        break;
      case 'Surgery':
        message = 'I need to schedule surgery';
        break;
      case 'Consultation':
        message = 'I need to book a consultation';
        break;
      case 'Screening':
        message = 'I need to book a screening appointment';
        break;
      default:
        message = `I need to book ${service.toLowerCase()}`;
    }
    
    setInputMessage(message);
  };

  // Force reload history function for testing
  const forceReloadHistory = () => {
    setHistoryLoaded(false);
    setMessages([]);
    loadChatHistory();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CancerMitr...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load user profile</p>
          <button 
            onClick={handleLogout}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Menu */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="flex items-center ml-4 lg:ml-0">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">CancerMitr</h1>
                  <p className="text-sm text-gray-600 hidden sm:block">AI Care Assistant</p>
                </div>
              </div>
            </div>

            {/* Right side - Actions and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Force reload button for testing */}
              <button
                onClick={forceReloadHistory}
                disabled={isLoadingHistory}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full disabled:opacity-50"
                title="Force reload chat history"
              >
                <RefreshCw className={`h-5 w-5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={navigateToDashboard}
                className="hidden sm:flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </button>

              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                <Bell className="h-6 w-6" />
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                    <p className="text-xs text-gray-600">{userProfile.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                      <p className="text-sm text-gray-600">{userProfile.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last login: {new Date(userProfile.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={navigateToDashboard}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Heart className="h-4 w-4 mr-3" />
                        Dashboard
                      </button>
                      <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <User className="h-4 w-4 mr-3" />
                        View Profile
                      </button>
                      <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </button>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b lg:hidden">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={navigateToDashboard}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Heart className="h-5 w-5 mr-3" />
                Dashboard
              </button>

              <button className="w-full flex items-center px-4 py-3 text-left rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                <MessageCircle className="h-5 w-5 mr-3" />
                Ask AI Assistant
              </button>

              {/* Clear Chat Button */}
              <button
                onClick={clearChatHistory}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={messages.length <= 1}
              >
                <Trash2 className="h-5 w-5 mr-3" />
                Clear Chat
              </button>
            </nav>

            {/* Debug Info */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs space-y-1">
                <p><strong>Debug Info:</strong></p>
                <p>Session: {sessionId ? String(sessionId).substring(0, 12) + '...' : 'None'}</p>
                <p>Messages: {messages.length}</p>
                <p>History Loaded: {historyLoaded ? 'Yes' : 'No'}</p>
                <p>Loading: {isLoadingHistory ? 'Yes' : 'No'}</p>
                <p>Auth Token: {getAuthToken() ? 'Present' : 'Missing'}</p>
              </div>
            </div>

            {/* Session Info */}
            {sessionId && (
              <div className="p-4 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <MessageCircle className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">Active Session</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    ID: {String(sessionId).substring(0, 8)}...
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Messages: {messages.length}
                  </p>
                  {isLoadingHistory && (
                    <p className="text-xs text-blue-600 mt-1 animate-pulse">
                      Loading history...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            <div className="p-4 border-t">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">Emergency</span>
                </div>
                <p className="text-xs text-red-700 mb-3">
                  For immediate medical assistance
                </p>
                <a
                  href="tel:+1234567890"
                  className="block w-full bg-red-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Call Now: +123-456-7890
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Chat Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Header */}
          <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    CancerMitr AI Assistant
                  </h2>
                  <p className="text-sm text-gray-600">
                    Book appointments and get cancer care assistance
                    {isLoadingHistory && <span className="ml-2 text-blue-600">• Loading history...</span>}
                    {historyLoaded && <span className="ml-2 text-green-600">• History loaded</span>}
                  </p>
                </div>
              </div>
              
              {/* Mobile back button */}
              <button
                onClick={navigateToDashboard}
                className="sm:hidden flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
            {isLoadingHistory && messages.length === 0 && (
              <div className="flex justify-center">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Loading chat history...</span>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.isError
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : message.confirmed
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  {message.appointmentDetails && (
                    <div className="mt-3 p-2 bg-green-50 rounded border">
                      <p className="text-xs font-medium text-green-800 mb-1">Appointment Details:</p>
                      <p className="text-xs text-green-700">
                        Service: {message.appointmentDetails.serviceType}<br/>
                        Cancer Type: {message.appointmentDetails.cancerType}<br/>
                        Date: {message.appointmentDetails.preferredDate}<br/>
                        Time: {message.appointmentDetails.preferredTime}
                      </p>
                    </div>
                  )}
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-gray-500">CancerMitr is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t p-4 flex-shrink-0">
            {bookingComplete ? (
              <div className="text-center space-y-3">
                <p className="text-green-600 font-medium">
                  ✅ Your appointment request has been submitted successfully!
                </p>
                {appointmentDetails && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-green-800 mb-2">Appointment Summary:</p>
                    <div className="text-green-700 space-y-1">
                      <p>Service: {appointmentDetails.serviceType}</p>
                      <p>Cancer Type: {appointmentDetails.cancerType}</p>
                      <p>Date: {appointmentDetails.preferredDate}</p>
                      <p>Time: {appointmentDetails.preferredTime}</p>
                      <p>Status: {appointmentDetails.status}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={startNewBooking}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Book Another Appointment
                  </button>
                  <button
                    onClick={navigateToDashboard}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here... (e.g., 'I need to book a consultation for breast cancer')"
                    className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="1"
                    style={{
                      minHeight: '50px',
                      maxHeight: '120px'
                    }}
                    disabled={isChatLoading || isLoadingHistory}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isChatLoading || isLoadingHistory}
                  className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 p-4 border-t flex-shrink-0">
            <div className="flex space-x-2 overflow-x-auto">
              {['Chemotherapy', 'Surgery', 'Consultation', 'Screening'].map((service) => (
                <button
                  key={service}
                  onClick={() => handleQuickAction(service)}
                  className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
                  disabled={isChatLoading || isLoadingHistory}
                >
                  {service === 'Consultation' && <Calendar className="w-4 h-4" />}
                  {service === 'Surgery' && <Clock className="w-4 h-4" />}
                  {service === 'Chemotherapy' && <Heart className="w-4 h-4" />}
                  {service === 'Screening' && <Shield className="w-4 h-4" />}
                  <span>{service}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-blue-50 border-t border-blue-200 p-3 flex-shrink-0">
            <div className="text-center">
              <p className="text-xs text-blue-700">
                💡 <strong>Connected to:</strong> {API_BASE_URL}/api/chat/userChat
                {sessionId && <span className="ml-2">| Session: {String(sessionId).substring(0, 8)}...</span>}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                I can help with cancer-related questions and appointment booking. Available 24/7!
                {isLoadingHistory && <span className="ml-2">• Loading history...</span>}
                {historyLoaded && <span className="ml-2">• History loaded ✅</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;