
// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   Heart, 
//   User, 
//   MessageCircle, 
//   Bell, 
//   Settings, 
//   LogOut, 
//   Menu, 
//   X, 
//   Send,
//   Calendar,
//   Clock,
//   Shield,
//   ChevronDown,
//   ArrowLeft
// } from 'lucide-react';

// const ChatPage = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [userMenuOpen, setUserMenuOpen] = useState(false);
//   const [userProfile, setUserProfile] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
  
//   // Chat state
//   const [messages, setMessages] = useState([]);
//   const [inputMessage, setInputMessage] = useState('');
//   const [isChatLoading, setIsChatLoading] = useState(false);
//   const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
//   const [bookingComplete, setBookingComplete] = useState(false);
//   const messagesEndRef = useRef(null);

//   // Cookie management functions
//   const getCookie = (name) => {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) {
//       return decodeURIComponent(parts.pop().split(';').shift());
//     }
//     return null;
//   };

//   const decryptData = (encryptedData) => {
//     try {
//       return JSON.parse(atob(encryptedData));
//     } catch (e) {
//       try {
//         return JSON.parse(encryptedData);
//       } catch (e2) {
//         return null;
//       }
//     }
//   };

//   const clearCookies = () => {
//     document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     document.cookie = "userData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     document.cookie = "userProfile=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//   };

//   // Load user data from cookies
//   useEffect(() => {
//     const loadUserData = () => {
//       const isLoggedIn = getCookie('isLoggedIn');
//       const encryptedProfile = getCookie('userProfile');
      
//       if (!isLoggedIn || !encryptedProfile) {
//         window.location.href = '/login';
//         return;
//       }

//       const profileData = decryptData(encryptedProfile);
//       if (profileData) {
//         setUserProfile(profileData);
//       }
//       setIsLoading(false);
//     };

//     loadUserData();
//   }, []);

//   // Initialize chat
//   useEffect(() => {
//     if (messages.length === 0) {
//       setMessages([{
//         id: 1,
//         text: "Hello! I'm here to help you schedule your cancer care appointments. How can I assist you today?",
//         sender: 'bot',
//         timestamp: new Date()
//       }]);
//     }
//   }, []);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleLogout = () => {
//     clearCookies();
//     window.location.href = '/login';
//   };

//   const navigateToDashboard = () => {
//     window.location.href = '/dashboard';
//   };

//   const sendMessage = async () => {
//     if (!inputMessage.trim() || isChatLoading) return;

//     const userMessage = {
//       id: Date.now(),
//       text: inputMessage,
//       sender: 'user',
//       timestamp: new Date()
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setInputMessage('');
//     setIsChatLoading(true);

//     try {
//       const response = await fetch('/api/chat', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           message: inputMessage,
//           sessionId: sessionId
//         }),
//       });

//       if (!response.ok) throw new Error('Network response was not ok');
      
//       const data = await response.json();

//       const botMessage = {
//         id: Date.now() + 1,
//         text: data.message,
//         sender: 'bot',
//         timestamp: new Date(),
//         isComplete: data.isComplete,
//         structuredData: data.structuredData
//       };

//       setMessages(prev => [...prev, botMessage]);

//       if (data.isComplete && data.structuredData) {
//         setBookingComplete(true);
//         await processBooking(data.structuredData);
//       }

//     } catch (error) {
//       console.error('Error sending message:', error);
//       const errorMessage = {
//         id: Date.now() + 1,
//         text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
//         sender: 'bot',
//         timestamp: new Date(),
//         isError: true
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsChatLoading(false);
//     }
//   };

//   const processBooking = async (bookingData) => {
//     try {
//       const response = await fetch('/api/process-booking', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           bookingData,
//           sessionId
//         }),
//       });

//       const result = await response.json();
      
//       if (result.success) {
//         const confirmationMessage = {
//           id: Date.now() + 2,
//           text: `✅ ${result.message}\n\nBooking ID: ${result.bookingId}\n\nPlease keep this reference number for your records.`,
//           sender: 'bot',
//           timestamp: new Date(),
//           isConfirmation: true
//         };
//         setMessages(prev => [...prev, confirmationMessage]);
//       }
//     } catch (error) {
//       console.error('Error processing booking:', error);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const formatTime = (timestamp) => {
//     return new Date(timestamp).toLocaleTimeString([], { 
//       hour: '2-digit', 
//       minute: '2-digit' 
//     });
//   };

//   const startNewBooking = () => {
//     setMessages([{
//       id: Date.now(),
//       text: "I'd be happy to help you with another appointment. What type of service do you need?",
//       sender: 'bot',
//       timestamp: new Date()
//     }]);
//     setBookingComplete(false);
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!userProfile) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-gray-600 mb-4">Unable to load user profile</p>
//           <button 
//             onClick={handleLogout}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//           >
//             Return to Login
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Navigation Header */}
//       <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
//         <div className="px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             {/* Left side - Logo and Menu */}
//             <div className="flex items-center">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//               >
//                 <Menu className="h-6 w-6" />
//               </button>
              
//               <div className="flex items-center ml-4 lg:ml-0">
//                 <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
//                   <Heart className="h-8 w-8 text-white" />
//                 </div>
//                 <div className="ml-3">
//                   <h1 className="text-xl font-bold text-gray-900">CancerCare</h1>
//                   <p className="text-sm text-gray-600 hidden sm:block">AI Assistant</p>
//                 </div>
//               </div>
//             </div>

//             {/* Right side - Back to Dashboard and User Menu */}
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={navigateToDashboard}
//                 className="hidden sm:flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Dashboard
//               </button>

//               <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
//                 <Bell className="h-6 w-6" />
//               </button>
              
//               {/* User Menu */}
//               <div className="relative">
//                 <button
//                   onClick={() => setUserMenuOpen(!userMenuOpen)}
//                   className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
//                 >
//                   <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
//                     <User className="h-5 w-5 text-white" />
//                   </div>
//                   <div className="hidden sm:block text-left">
//                     <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
//                     <p className="text-xs text-gray-600">{userProfile.email}</p>
//                   </div>
//                   <ChevronDown className="h-4 w-4 text-gray-600" />
//                 </button>

//                 {/* User Dropdown */}
//                 {userMenuOpen && (
//                   <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
//                     <div className="px-4 py-3 border-b border-gray-200">
//                       <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
//                       <p className="text-sm text-gray-600">{userProfile.email}</p>
//                       <p className="text-xs text-gray-500 mt-1">
//                         Last login: {new Date(userProfile.lastLogin).toLocaleDateString()}
//                       </p>
//                     </div>
//                     <div className="py-2">
//                       <button
//                         onClick={navigateToDashboard}
//                         className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                       >
//                         <Heart className="h-4 w-4 mr-3" />
//                         Dashboard
//                       </button>
//                       <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
//                         <User className="h-4 w-4 mr-3" />
//                         View Profile
//                       </button>
//                       <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
//                         <Settings className="h-4 w-4 mr-3" />
//                         Settings
//                       </button>
//                       <hr className="my-2" />
//                       <button
//                         onClick={handleLogout}
//                         className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//                       >
//                         <LogOut className="h-4 w-4 mr-3" />
//                         Sign Out
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="flex h-screen">
//         {/* Sidebar */}
//         <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg`}>
//           <div className="flex flex-col h-full">
//             {/* Sidebar Header */}
//             <div className="flex items-center justify-between p-4 border-b lg:hidden">
//               <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
//               <button
//                 onClick={() => setSidebarOpen(false)}
//                 className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//               >
//                 <X className="h-6 w-6" />
//               </button>
//             </div>

//             {/* Navigation Items */}
//             <nav className="flex-1 p-4 space-y-2">
//               <button
//                 onClick={navigateToDashboard}
//                 className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
//               >
//                 <Heart className="h-5 w-5 mr-3" />
//                 Dashboard
//               </button>

//               <button className="w-full flex items-center px-4 py-3 text-left rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
//                 <MessageCircle className="h-5 w-5 mr-3" />
//                 Ask AI Assistant
//               </button>
//             </nav>

//             {/* Emergency Contact */}
//             <div className="p-4 border-t">
//               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                 <div className="flex items-center mb-2">
//                   <Shield className="h-5 w-5 text-red-600 mr-2" />
//                   <span className="text-sm font-medium text-red-800">Emergency</span>
//                 </div>
//                 <p className="text-xs text-red-700 mb-3">
//                   For immediate medical assistance
//                 </p>
//                 <a
//                   href="tel:+1234567890"
//                   className="block w-full bg-red-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
//                 >
//                   Call Now: +123-456-7890
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Overlay for mobile */}
//         {sidebarOpen && (
//           <div
//             className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50"
//             onClick={() => setSidebarOpen(false)}
//           ></div>
//         )}

//         {/* Main Chat Content */}
//         <div className="flex-1 flex flex-col min-h-0">
//           {/* Chat Header */}
//           <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-3">
//                 <div className="bg-blue-100 p-2 rounded-full">
//                   <MessageCircle className="w-6 h-6 text-blue-600" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-semibold text-gray-800">
//                     AI Care Assistant
//                   </h2>
//                   <p className="text-sm text-gray-600">
//                     Book appointments and get assistance
//                   </p>
//                 </div>
//               </div>
              
//               {/* Mobile back button */}
//               <button
//                 onClick={navigateToDashboard}
//                 className="sm:hidden flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-1" />
//                 Back
//               </button>
//             </div>
//           </div>

//           {/* Messages Container */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
//             {messages.map((message) => (
//               <div
//                 key={message.id}
//                 className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div
//                   className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
//                     message.sender === 'user'
//                       ? 'bg-blue-600 text-white'
//                       : message.isError
//                       ? 'bg-red-100 text-red-800 border border-red-200'
//                       : message.isConfirmation
//                       ? 'bg-green-100 text-green-800 border border-green-200'
//                       : 'bg-white text-gray-800 border border-gray-200'
//                   }`}
//                 >
//                   <p className="text-sm whitespace-pre-wrap">{message.text}</p>
//                   <p className={`text-xs mt-2 ${
//                     message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
//                   }`}>
//                     {formatTime(message.timestamp)}
//                   </p>
//                 </div>
//               </div>
//             ))}

//             {isChatLoading && (
//               <div className="flex justify-start">
//                 <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
//                   <div className="flex space-x-2">
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div ref={messagesEndRef} />
//           </div>

//           {/* Input Area */}
//           <div className="bg-white border-t p-4 flex-shrink-0">
//             {bookingComplete ? (
//               <div className="text-center space-y-3">
//                 <p className="text-green-600 font-medium">
//                   ✅ Your appointment request has been submitted!
//                 </p>
//                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
//                   <button
//                     onClick={startNewBooking}
//                     className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
//                   >
//                     Book Another Appointment
//                   </button>
//                   <button
//                     onClick={navigateToDashboard}
//                     className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition-colors"
//                   >
//                     Return to Dashboard
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex space-x-3">
//                 <div className="flex-1 relative">
//                   <textarea
//                     value={inputMessage}
//                     onChange={(e) => setInputMessage(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     placeholder="Type your message here..."
//                     className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     rows="1"
//                     style={{
//                       minHeight: '50px',
//                       maxHeight: '120px'
//                     }}
//                     disabled={isChatLoading}
//                   />
//                 </div>
//                 <button
//                   onClick={sendMessage}
//                   disabled={!inputMessage.trim() || isChatLoading}
//                   className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <Send className="w-5 h-5" />
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-gray-50 p-4 border-t flex-shrink-0">
//             <div className="flex space-x-2 overflow-x-auto">
//               {['Chemotherapy', 'Surgery', 'Consultation', 'Screening'].map((service) => (
//                 <button
//                   key={service}
//                   onClick={() => setInputMessage(`I need to book ${service.toLowerCase()}`)}
//                   className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
//                   disabled={isChatLoading}
//                 >
//                   {service === 'Consultation' && <Calendar className="w-4 h-4" />}
//                   {service === 'Surgery' && <Clock className="w-4 h-4" />}
//                   {service === 'Chemotherapy' && <Heart className="w-4 h-4" />}
//                   {service === 'Screening' && <Shield className="w-4 h-4" />}
//                   <span>{service}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Chat Tips */}
//           <div className="bg-blue-50 border-t border-blue-200 p-3 flex-shrink-0">
//             <div className="text-center">
//               <p className="text-xs text-blue-700">
//                 💡 <strong>Tip:</strong> You can ask me to book appointments, reschedule visits, or get information about your treatments. I'm here to help 24/7!
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;

// //change


// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   Heart, 
//   User, 
//   MessageCircle, 
//   Bell, 
//   Settings, 
//   LogOut, 
//   Menu, 
//   X, 
//   Send,
//   Calendar,
//   Clock,
//   Shield,
//   ChevronDown,
//   ArrowLeft,
//   Phone,
//   Mail,
//   MapPin
// } from 'lucide-react';

// const ChatPage = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [userMenuOpen, setUserMenuOpen] = useState(false);
//   const [userProfile, setUserProfile] = useState({
//     name: "Sarah Johnson",
//     email: "sarah.johnson@email.com",
//     mobileNo: "+1-555-0123",
//     lastLogin: new Date().toISOString()
//   });
//   const [isLoading, setIsLoading] = useState(false);
  
//   // Chat state
//   const [messages, setMessages] = useState([]);
//   const [inputMessage, setInputMessage] = useState('');
//   const [isChatLoading, setIsChatLoading] = useState(false);
//   const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
//   const [bookingComplete, setBookingComplete] = useState(false);
//   const [bookingData, setBookingData] = useState({
//     serviceType: '',
//     preferredDate: '',
//     preferredTime: '',
//     doctorPreference: '',
//     additionalNotes: '',
//     phone: ''
//   });
//   const messagesEndRef = useRef(null);

//   // Initialize chat
//   useEffect(() => {
//     if (messages.length === 0 && userProfile) {
//       setMessages([{
//         id: 1,
//         text: `Hello ${userProfile.name}! I'm your AI Care Assistant. I'm here to help you schedule cancer care appointments and answer any questions you may have. 

// I can help you book:
// • Chemotherapy treatments
// • Radiation therapy
// • Surgical consultations
// • Doctor appointments
// • Cancer screenings
// • Follow-up visits

// How can I assist you today?`,
//         sender: 'bot',
//         timestamp: new Date()
//       }]);
//     }
//   }, [userProfile]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleLogout = () => {
//     // Simulate logout
//     console.log('Logging out...');
//   };

//   const navigateToDashboard = () => {
//     // Simulate navigation
//     console.log('Navigating to dashboard...');
//   };

//   // AI Chat Logic
//   const processUserMessage = async (message) => {
//     const lowerMessage = message.toLowerCase();
    
//     // Check for booking intentions
//     if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || 
//         lowerMessage.includes('schedule') || lowerMessage.includes('chemotherapy') ||
//         lowerMessage.includes('radiation') || lowerMessage.includes('surgery') ||
//         lowerMessage.includes('consultation') || lowerMessage.includes('screening')) {
      
//       return await handleBookingFlow(message);
//     }
    
//     // General healthcare questions
//     if (lowerMessage.includes('side effect') || lowerMessage.includes('treatment') ||
//         lowerMessage.includes('cancer') || lowerMessage.includes('chemotherapy side effects')) {
//       return getHealthcareInfo(message);
//     }
    
//     // Default response
//     return "I'm here to help you with appointment bookings and general healthcare information. You can ask me to:\n\n• Book appointments for various treatments\n• Get information about our services\n• Answer questions about appointment scheduling\n\nWhat would you like to know more about?";
//   };

//   const handleBookingFlow = async (message) => {
//     const lowerMessage = message.toLowerCase();
    
//     // Determine service type
//     let serviceType = '';
//     if (lowerMessage.includes('chemotherapy') || lowerMessage.includes('chemo')) {
//       serviceType = 'Chemotherapy Treatment';
//     } else if (lowerMessage.includes('radiation')) {
//       serviceType = 'Radiation Therapy';
//     } else if (lowerMessage.includes('surgery') || lowerMessage.includes('surgical')) {
//       serviceType = 'Surgical Consultation';
//     } else if (lowerMessage.includes('consultation') || lowerMessage.includes('doctor')) {
//       serviceType = 'Doctor Consultation';
//     } else if (lowerMessage.includes('screening')) {
//       serviceType = 'Cancer Screening';
//     } else if (lowerMessage.includes('follow-up') || lowerMessage.includes('followup')) {
//       serviceType = 'Follow-up Visit';
//     } else {
//       serviceType = 'General Consultation';
//     }

//     // Update booking data
//     const newBookingData = { ...bookingData, serviceType };
//     setBookingData(newBookingData);

//     // Check what information we still need
//     const missingInfo = [];
//     if (!newBookingData.preferredDate) missingInfo.push('preferred date');
//     if (!newBookingData.preferredTime) missingInfo.push('preferred time');
//     if (!newBookingData.phone && !userProfile.mobileNo) missingInfo.push('phone number');

//     if (missingInfo.length > 0) {
//       return `Great! I can help you book a ${serviceType}. 

// To complete your booking, I need some additional information:
// ${missingInfo.map(info => `• Your ${info}`).join('\n')}

// Could you please provide your ${missingInfo[0]}?`;
//     }

//     // If we have all info, proceed to booking
//     return await completeBooking(newBookingData);
//   };

//   const getHealthcareInfo = (message) => {
//     const lowerMessage = message.toLowerCase();
    
//     if (lowerMessage.includes('side effect')) {
//       return "Common treatment side effects may include fatigue, nausea, and changes in appetite. However, side effects vary greatly between individuals and treatments. It's important to discuss any concerns with your healthcare team.\n\nWould you like me to help you schedule a consultation to discuss your specific treatment plan?";
//     }
    
//     if (lowerMessage.includes('chemotherapy')) {
//       return "Chemotherapy is a cancer treatment that uses drugs to destroy cancer cells. The treatment schedule varies based on your specific case. Our oncology team will work with you to create a personalized treatment plan.\n\nWould you like to book a chemotherapy consultation?";
//     }
    
//     return "For specific medical questions, I recommend speaking with your healthcare provider. I can help you schedule an appointment with one of our specialists who can provide detailed medical guidance.\n\nWould you like me to book a consultation for you?";
//   };

//   const completeBooking = async (data) => {
//     const bookingId = `BK${Date.now()}`;
    
//     // Simulate booking completion
//     setTimeout(() => {
//       setBookingComplete(true);
//       const confirmationMessage = {
//         id: Date.now() + 1,
//         text: `✅ Your appointment has been successfully booked!\n\n📋 Booking Details:\n• Service: ${data.serviceType}\n• Reference: ${bookingId}\n• Patient: ${userProfile.name}\n• Phone: ${data.phone || userProfile.mobileNo}\n\n📞 Our team will contact you within 24 hours to confirm your appointment time and provide any pre-appointment instructions.\n\nThank you for choosing CancerCare!`,
//         sender: 'bot',
//         timestamp: new Date(),
//         isConfirmation: true
//       };
//       setMessages(prev => [...prev, confirmationMessage]);
//     }, 1000);

//     return "Processing your appointment request... Please wait a moment.";
//   };

//   const sendMessage = async () => {
//     if (!inputMessage.trim() || isChatLoading) return;

//     const userMessage = {
//       id: Date.now(),
//       text: inputMessage,
//       sender: 'user',
//       timestamp: new Date()
//     };

//     setMessages(prev => [...prev, userMessage]);
//     const currentMessage = inputMessage;
//     setInputMessage('');
//     setIsChatLoading(true);

//     try {
//       // Process the message locally
//       const response = await processUserMessage(currentMessage);
      
//       // Check for date/time extraction
//       const dateMatch = currentMessage.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|tomorrow)/i);
//       const timeMatch = currentMessage.match(/(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)|morning|afternoon|evening)/i);
//       const phoneMatch = currentMessage.match(/(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);

//       if (dateMatch) {
//         setBookingData(prev => ({ ...prev, preferredDate: dateMatch[0] }));
//       }
//       if (timeMatch) {
//         setBookingData(prev => ({ ...prev, preferredTime: timeMatch[0] }));
//       }
//       if (phoneMatch) {
//         setBookingData(prev => ({ ...prev, phone: phoneMatch[0] }));
//       }

//       const botMessage = {
//         id: Date.now() + 1,
//         text: response,
//         sender: 'bot',
//         timestamp: new Date()
//       };

//       setMessages(prev => [...prev, botMessage]);

//     } catch (error) {
//       console.error('Error processing message:', error);
//       const errorMessage = {
//         id: Date.now() + 1,
//         text: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team at +123-456-7890.",
//         sender: 'bot',
//         timestamp: new Date(),
//         isError: true
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsChatLoading(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const formatTime = (timestamp) => {
//     return new Date(timestamp).toLocaleTimeString([], { 
//       hour: '2-digit', 
//       minute: '2-digit' 
//     });
//   };

//   const startNewBooking = () => {
//     setMessages(prev => [...prev, {
//       id: Date.now(),
//       text: "I'd be happy to help you with another appointment. What type of service do you need?",
//       sender: 'bot',
//       timestamp: new Date()
//     }]);
//     setBookingComplete(false);
//     setBookingData({
//       serviceType: '',
//       preferredDate: '',
//       preferredTime: '',
//       doctorPreference: '',
//       additionalNotes: '',
//       phone: ''
//     });
//   };

//   const handleQuickAction = (service) => {
//     const message = `I need to book ${service.toLowerCase()}`;
//     setInputMessage(message);
//     // Auto-send the message
//     setTimeout(() => {
//       const userMessage = {
//         id: Date.now(),
//         text: message,
//         sender: 'user',
//         timestamp: new Date()
//       };
//       setMessages(prev => [...prev, userMessage]);
//       processUserMessage(message).then(response => {
//         const botMessage = {
//           id: Date.now() + 1,
//           text: response,
//           sender: 'bot',
//           timestamp: new Date()
//         };
//         setMessages(prev => [...prev, botMessage]);
//       });
//     }, 100);
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Navigation Header */}
//       <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
//         <div className="px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             {/* Left side - Logo and Menu */}
//             <div className="flex items-center">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//               >
//                 <Menu className="h-6 w-6" />
//               </button>
              
//               <div className="flex items-center ml-4 lg:ml-0">
//                 <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
//                   <Heart className="h-8 w-8 text-white" />
//                 </div>
//                 <div className="ml-3">
//                   <h1 className="text-xl font-bold text-gray-900">CancerCare</h1>
//                   <p className="text-sm text-gray-600 hidden sm:block">AI Assistant</p>
//                 </div>
//               </div>
//             </div>

//             {/* Right side - Back to Dashboard and User Menu */}
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={navigateToDashboard}
//                 className="hidden sm:flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Dashboard
//               </button>

//               <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
//                 <Bell className="h-6 w-6" />
//               </button>
              
//               {/* User Menu */}
//               <div className="relative">
//                 <button
//                   onClick={() => setUserMenuOpen(!userMenuOpen)}
//                   className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
//                 >
//                   <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
//                     <User className="h-5 w-5 text-white" />
//                   </div>
//                   <div className="hidden sm:block text-left">
//                     <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
//                     <p className="text-xs text-gray-600">{userProfile.email}</p>
//                   </div>
//                   <ChevronDown className="h-4 w-4 text-gray-600" />
//                 </button>

//                 {/* User Dropdown */}
//                 {userMenuOpen && (
//                   <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
//                     <div className="px-4 py-3 border-b border-gray-200">
//                       <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
//                       <p className="text-sm text-gray-600">{userProfile.email}</p>
//                       <p className="text-xs text-gray-500 mt-1">Online now</p>
//                     </div>
//                     <div className="py-2">
//                       <button
//                         onClick={navigateToDashboard}
//                         className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                       >
//                         <Heart className="h-4 w-4 mr-3" />
//                         Dashboard
//                       </button>
//                       <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
//                         <User className="h-4 w-4 mr-3" />
//                         View Profile
//                       </button>
//                       <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
//                         <Settings className="h-4 w-4 mr-3" />
//                         Settings
//                       </button>
//                       <hr className="my-2" />
//                       <button
//                         onClick={handleLogout}
//                         className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//                       >
//                         <LogOut className="h-4 w-4 mr-3" />
//                         Sign Out
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="flex h-screen">
//         {/* Sidebar */}
//         <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg`}>
//           <div className="flex flex-col h-full">
//             {/* Sidebar Header */}
//             <div className="flex items-center justify-between p-4 border-b lg:hidden">
//               <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
//               <button
//                 onClick={() => setSidebarOpen(false)}
//                 className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//               >
//                 <X className="h-6 w-6" />
//               </button>
//             </div>

//             {/* Navigation Items */}
//             <nav className="flex-1 p-4 space-y-2">
//               <button
//                 onClick={navigateToDashboard}
//                 className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
//               >
//                 <Heart className="h-5 w-5 mr-3" />
//                 Dashboard
//               </button>

//               <button className="w-full flex items-center px-4 py-3 text-left rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
//                 <MessageCircle className="h-5 w-5 mr-3" />
//                 Ask AI Assistant
//               </button>
//             </nav>

//             {/* Contact Information */}
//             <div className="p-4 border-t">
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
//                 <h3 className="text-sm font-medium text-blue-800 mb-3">Contact Us</h3>
//                 <div className="space-y-2 text-xs text-blue-700">
//                   <div className="flex items-center">
//                     <Phone className="h-3 w-3 mr-2" />
//                     <span>+123-456-7890</span>
//                   </div>
//                   <div className="flex items-center">
//                     <Mail className="h-3 w-3 mr-2" />
//                     <span>care@cancercare.com</span>
//                   </div>
//                   <div className="flex items-center">
//                     <MapPin className="h-3 w-3 mr-2" />
//                     <span>24/7 Support Available</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Emergency Contact */}
//               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                 <div className="flex items-center mb-2">
//                   <Shield className="h-5 w-5 text-red-600 mr-2" />
//                   <span className="text-sm font-medium text-red-800">Emergency</span>
//                 </div>
//                 <p className="text-xs text-red-700 mb-3">
//                   For immediate medical assistance
//                 </p>
//                 <a
//                   href="tel:+1234567890"
//                   className="block w-full bg-red-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
//                 >
//                   Call Now: 911
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Overlay for mobile */}
//         {sidebarOpen && (
//           <div
//             className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50"
//             onClick={() => setSidebarOpen(false)}
//           ></div>
//         )}

//         {/* Main Chat Content */}
//         <div className="flex-1 flex flex-col min-h-0">
//           {/* Chat Header */}
//           <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-3">
//                 <div className="bg-blue-100 p-2 rounded-full">
//                   <MessageCircle className="w-6 h-6 text-blue-600" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-semibold text-gray-800">
//                     AI Care Assistant
//                   </h2>
//                   <p className="text-sm text-gray-600">
//                     Book appointments and get assistance
//                   </p>
//                 </div>
//               </div>
              
//               {/* Mobile back button */}
//               <button
//                 onClick={navigateToDashboard}
//                 className="sm:hidden flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-1" />
//                 Back
//               </button>
//             </div>
//           </div>

//           {/* Messages Container */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
//             {messages.map((message) => (
//               <div
//                 key={message.id}
//                 className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div
//                   className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
//                     message.sender === 'user'
//                       ? 'bg-blue-600 text-white'
//                       : message.isError
//                       ? 'bg-red-100 text-red-800 border border-red-200'
//                       : message.isConfirmation
//                       ? 'bg-green-100 text-green-800 border border-green-200'
//                       : 'bg-white text-gray-800 border border-gray-200'
//                   }`}
//                 >
//                   <p className="text-sm whitespace-pre-wrap">{message.text}</p>
//                   <p className={`text-xs mt-2 ${
//                     message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
//                   }`}>
//                     {formatTime(message.timestamp)}
//                   </p>
//                 </div>
//               </div>
//             ))}

//             {isChatLoading && (
//               <div className="flex justify-start">
//                 <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
//                   <div className="flex space-x-2">
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div ref={messagesEndRef} />
//           </div>

//           {/* Input Area */}
//           <div className="bg-white border-t p-4 flex-shrink-0">
//             {bookingComplete ? (
//               <div className="text-center space-y-3">
//                 <p className="text-green-600 font-medium">
//                   ✅ Your appointment request has been submitted!
//                 </p>
//                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
//                   <button
//                     onClick={startNewBooking}
//                     className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
//                   >
//                     Book Another Appointment
//                   </button>
//                   <button
//                     onClick={navigateToDashboard}
//                     className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition-colors"
//                   >
//                     Return to Dashboard
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex space-x-3">
//                 <div className="flex-1 relative">
//                   <textarea
//                     value={inputMessage}
//                     onChange={(e) => setInputMessage(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     placeholder="Type your message here..."
//                     className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     rows="1"
//                     style={{
//                       minHeight: '50px',
//                       maxHeight: '120px'
//                     }}
//                     disabled={isChatLoading}
//                   />
//                 </div>
//                 <button
//                   onClick={sendMessage}
//                   disabled={!inputMessage.trim() || isChatLoading}
//                   className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <Send className="w-5 h-5" />
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-gray-50 p-4 border-t flex-shrink-0">
//             <div className="flex space-x-2 overflow-x-auto">
//               {['Chemotherapy', 'Surgery', 'Consultation', 'Screening'].map((service) => (
//                 <button
//                   key={service}
//                   onClick={() => handleQuickAction(service)}
//                   className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
//                   disabled={isChatLoading}
//                 >
//                   {service === 'Consultation' && <Calendar className="w-4 h-4" />}
//                   {service === 'Surgery' && <Clock className="w-4 h-4" />}
//                   {service === 'Chemotherapy' && <Heart className="w-4 h-4" />}
//                   {service === 'Screening' && <Shield className="w-4 h-4" />}
//                   <span>{service}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Chat Tips */}
//           <div className="bg-blue-50 border-t border-blue-200 p-3 flex-shrink-0">
//             <div className="text-center">
//               <p className="text-xs text-blue-700">
//                 💡 <strong>Try asking:</strong> "Book chemotherapy appointment for next Tuesday morning" or "What are common side effects?"
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;


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
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/chat/userchat'; // Adjust this to your backend URL

const ChatPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const messagesEndRef = useRef(null);

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Load user profile and initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      if (!authToken) {
        // Redirect to login if no token
        window.location.href = '/login';
        return;
      }

      try {
        // Fetch user profile
        const profileResponse = await apiCall('/user/getuserprofile');
        if (profileResponse.success) {
          setUserProfile(profileResponse.user);
          
          // Initialize chat with welcome message
          const welcomeMessage = {
            id: 1,
            text: `Hello ${profileResponse.user.name}! I'm your AI Care Assistant. I'm here to help you schedule cancer care appointments and answer any questions you may have. 

I can help you book:
• Chemotherapy treatments
• Radiation therapy
• Surgical consultations
• Doctor appointments
• Cancer screenings
• Follow-up visits

How can I assist you today?`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Handle token expiration or invalid token
        if (error.message.includes('unauthorized') || error.message.includes('token')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [authToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    window.location.href = '/login';
  };

  const navigateToDashboard = () => {
    window.location.href = '/dashboard';
  };

  // Send message to backend API
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
      // Call the chat API
      const response = await apiCall('/chat/userChat', {
        method: 'POST',
        body: JSON.stringify({
          message: currentMessage
        }),
      });

      // Update session ID if provided
      if (response.sessionId && !sessionId) {
        setSessionId(response.sessionId);
      }

      const botMessage = {
        id: Date.now() + 1,
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
        // Check if this is a booking confirmation
        isConfirmation: response.message.includes('✅') || response.message.includes('booked successfully')
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team at +123-456-7890.",
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
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: "I'd be happy to help you with another appointment. What type of service do you need?",
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  const handleQuickAction = async (service) => {
    const message = `I need to book ${service.toLowerCase()}`;
    setInputMessage(message);
    
    // Auto-send the message
    setTimeout(async () => {
      const userMessage = {
        id: Date.now(),
        text: message,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setIsChatLoading(true);

      try {
        const response = await apiCall('/chat/userChat', {
          method: 'POST',
          body: JSON.stringify({ message }),
        });

        if (response.sessionId && !sessionId) {
          setSessionId(response.sessionId);
        }

        const botMessage = {
          id: Date.now() + 1,
          text: response.message,
          sender: 'bot',
          timestamp: new Date(),
          isConfirmation: response.message.includes('✅') || response.message.includes('booked successfully')
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error with quick action:', error);
        const errorMessage = {
          id: Date.now() + 1,
          text: "Sorry, I couldn't process that request. Please try typing your message manually.",
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsChatLoading(false);
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load user profile</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Go to Login
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
                  <p className="text-sm text-gray-600 hidden sm:block">AI Assistant</p>
                </div>
              </div>
            </div>

            {/* Right side - Back to Dashboard and User Menu */}
            <div className="flex items-center space-x-4">
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
                        {userProfile.mobileNo && `Phone: ${userProfile.mobileNo}`}
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
            </nav>

            {/* Contact Information */}
            <div className="p-4 border-t">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-blue-800 mb-3">Contact Us</h3>
                <div className="space-y-2 text-xs text-blue-700">
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-2" />
                    <span>+123-456-7890</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-2" />
                    <span>care@cancermitr.com</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-2" />
                    <span>24/7 Support Available</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
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
                  Call Now: 911
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
                    AI Care Assistant
                  </h2>
                  <p className="text-sm text-gray-600">
                    Book appointments and get assistance
                  </p>
                  {sessionId && (
                    <p className="text-xs text-gray-500">Session: {sessionId}</p>
                  )}
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
                      : message.isConfirmation
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
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
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t p-4 flex-shrink-0">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="1"
                  style={{
                    minHeight: '50px',
                    maxHeight: '120px'
                  }}
                  disabled={isChatLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isChatLoading}
                className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 p-4 border-t flex-shrink-0">
            <div className="flex space-x-2 overflow-x-auto">
              {['Consultation', 'Treatment', 'Test'].map((service) => (
                <button
                  key={service}
                  onClick={() => handleQuickAction(service)}
                  className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
                  disabled={isChatLoading}
                >
                  {service === 'Consultation' && <Calendar className="w-4 h-4" />}
                  {service === 'Treatment' && <Heart className="w-4 h-4" />}
                  {service === 'Test' && <Shield className="w-4 h-4" />}
                  <span>{service}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Tips */}
          <div className="bg-blue-50 border-t border-blue-200 p-3 flex-shrink-0">
            <div className="text-center">
              <p className="text-xs text-blue-700">
                💡 <strong>Try asking:</strong> "Book consultation for breast cancer on 2024-12-25 at 10:00" or "What are common treatments?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;