// Remove OpenAI import and replace with fetch
// import OpenAI from 'openai';
import { prismaClient } from '../routes/index.js';
// import { OPENAI_API_KEY } from '../secrets.js';

// Replace OpenAI client with local LLM endpoint configuration
// const LOCAL_LLM_ENDPOINT = 'https://suspension-lap-standards-additions.trycloudflare.com/v1/api/generate';
const LOCAL_LLM_ENDPOINT = 'https://prophet-rotary-ladies-northern.trycloudflare.com/v1/api/generate';
const LOCAL_LLM_MODEL = 'mistral';

// ========================================
// UTILITY FUNCTIONS
// ========================================

function normalizeDateText(input) {
    const corrections = {
        "januray": "january", "febuary": "february", "marhc": "march", "apirl": "april",
        "mayy": "may", "junne": "june", "jully": "july", "agust": "august",
        "septembar": "september", "octomber": "october", "novembar": "november", "decembar": "december"
    };

    for (const [wrong, correct] of Object.entries(corrections)) {
        input = input.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct);
    }
    return input;
}

// Helper function to convert OpenAI messages format to a single prompt for local LLM
function convertMessagesToPrompt(systemMessage, messages) {
    let prompt = `${systemMessage}\n\n`;
    
    // Add conversation history
    for (const message of messages) {
        if (message.role === 'system') continue; // Skip system messages in history
        
        const roleLabel = message.role === 'user' ? 'Human' : 'Assistant';
        prompt += `${roleLabel}: ${message.content || message.message}\n\n`;
    }
    
    prompt += "Assistant: ";
    return prompt;
}

// Function to call local LLM
async function callLocalLLM(systemMessage, messages) {
    try {
        const prompt = convertMessagesToPrompt(systemMessage, messages);
        
        console.log("🤖 === LOCAL LLM DEBUG START ===");
        console.log("🌐 Endpoint:", LOCAL_LLM_ENDPOINT);
        console.log("📝 Prompt length:", prompt.length);
        console.log("📝 First 200 chars of prompt:", prompt.substring(0, 200) + "...");
        
        const requestBody = {
            model: LOCAL_LLM_MODEL,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 1000,
                stop: ["Human:", "\nHuman:"]
            }
        };
        
        console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(LOCAL_LLM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        console.log("📥 Response status:", response.status);
        console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Response not OK. Status:", response.status);
            console.error("❌ Error response body:", errorText);
            throw new Error(`Local LLM API responded with status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("📥 Full response data:", JSON.stringify(data, null, 2));
        
        // Handle Ollama response format
        if (data.response) {
            console.log("✅ Found response in data.response");
            const cleanResponse = data.response.trim();
            console.log("✅ Clean response:", cleanResponse);
            console.log("🤖 === LOCAL LLM DEBUG END ===");
            return cleanResponse;
        } else if (data.choices && data.choices[0] && data.choices[0].text) {
            console.log("✅ Found response in data.choices[0].text");
            const cleanResponse = data.choices[0].text.trim();
            console.log("✅ Clean response:", cleanResponse);
            console.log("🤖 === LOCAL LLM DEBUG END ===");
            return cleanResponse;
        } else {
            console.error("❌ Unexpected response format. Available keys:", Object.keys(data));
            console.error("❌ Full data:", JSON.stringify(data, null, 2));
            throw new Error('Unexpected response format from local LLM');
        }

    } catch (error) {
        console.error("❌ === LOCAL LLM ERROR ===");
        console.error("❌ Error name:", error.name);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
        console.error("❌ === LOCAL LLM ERROR END ===");
        
        // Provide different error messages based on error type
        if (error.name === 'TimeoutError') {
            throw new Error("The AI service is taking too long to respond. Please try again.");
        } else if (error.message.includes('fetch') || error.code === 'ECONNREFUSED') {
            throw new Error("Unable to connect to the AI service. Please check if Ollama is running and the tunnel is active.");
        } else {
            throw new Error(`AI service error: ${error.message}`);
        }
    }
}

// Test function to debug the endpoint directly
async function testLocalLLMEndpoint() {
    try {
        console.log("🧪 Testing Local LLM Endpoint...");
        
        const testResponse = await fetch(LOCAL_LLM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: LOCAL_LLM_MODEL,
                prompt: "Hello, can you respond with 'Test successful'?",
                stream: false
            }),
            signal: AbortSignal.timeout(10000) // 10 second timeout for test
        });

        console.log("🧪 Test response status:", testResponse.status);
        
        if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log("🧪 Test response data:", JSON.stringify(testData, null, 2));
            console.log("✅ Endpoint test successful!");
            return true;
        } else {
            const errorText = await testResponse.text();
            console.error("❌ Test failed with status:", testResponse.status);
            console.error("❌ Test error body:", errorText);
            return false;
        }
        
    } catch (error) {
        console.error("❌ Endpoint test failed:", error.message);
        return false;
    }
}

function extractServiceInfo(text) {
text = normalizeDateText(text);
const lower = text.toLowerCase();
  const serviceType = /(consultation|treatment|test|screening|checkup|follow-up|surgery)/.exec(lower)?.[1] || null;
  const cancerType = /(breast|lung|skin|prostate|colon|liver|kidney|brain|blood|bone)/.exec(lower)?.[1] || null;
  
  // Enhanced date extraction - supports multiple formats
  let preferredDate = null;
  
  // Handle relative dates first
  if (/\btomorrow\b/i.test(text)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    preferredDate = tomorrow.toISOString().split('T')[0];
  } else if (/\btoday\b/i.test(text)) {
    const today = new Date();
    preferredDate = today.toISOString().split('T')[0];
  } else if (/\bnext week\b/i.test(text)) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    preferredDate = nextWeek.toISOString().split('T')[0];
  }
  
  // Format 1: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
  if (!preferredDate) {
    const standardDateMatch = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/.exec(text);
    if (standardDateMatch) {
      const formattedDate = formatDate(standardDateMatch[1]);
      // Validate the formatted date
      if (formattedDate && isValidDateString(formattedDate)) {
        preferredDate = formattedDate;
      }
    }
  }
  
  
  // Format 2: "24 june", "24 June 2025", "june 24", "June 24 2025"
  if (!preferredDate) {
    const monthNames = 'january|february|march|april|may|june|july|august|september|october|november|december';
    const monthShort = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
    
    // Find all date matches and validate them
    const dayMonthMatches = [...text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames}|${monthShort})(?:\\s+(\\d{4}))?\\b`, 'gi'))];
    
    for (const match of dayMonthMatches) {
      const day = match[1];
      const month = match[2];
      const year = match[3] || new Date().getFullYear();
      
      // Skip obviously invalid days
      if (parseInt(day) > 31 || parseInt(day) < 1) {
        console.log(`⚠️ Skipping invalid day: ${day}`);
        continue;
      }
      
      const convertedDate = convertToStandardDate(day, month, year);
      if (convertedDate) {
        preferredDate = convertedDate;
        break; // Use the first valid date found
      }
    }
    
    // Try month-day format if no valid date found
    if (!preferredDate) {
      const monthDayMatches = [...text.matchAll(new RegExp(`\\b(${monthNames}|${monthShort})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?(?:\\s+(\\d{4}))?\\b`, 'gi'))];
      
      for (const match of monthDayMatches) {
        const month = match[1];
        const day = match[2];
        const year = match[3] || new Date().getFullYear();
        
        // Skip obviously invalid days
        if (parseInt(day) > 31 || parseInt(day) < 1) {
          console.log(`⚠️ Skipping invalid day: ${day}`);
          continue;
        }
        
        const convertedDate = convertToStandardDate(day, month, year);
        if (convertedDate) {
          preferredDate = convertedDate;
          break; // Use the first valid date found
        }
      }
    }
  }
  
  // Enhanced time extraction
  let preferredTime = null;
  
  const timeMatch = /\b(\d{1,2}:\d{2}(?:\s*(?:am|pm))?)\b/i.exec(text);
  if (timeMatch) {
    preferredTime = formatTime(timeMatch[1]);
  }
  
  if (!preferredTime) {
    const simpleTimeMatch = /\b(\d{1,2})(?:\s*(?:am|pm))\b/i.exec(text);
    if (simpleTimeMatch) {
      const hour = simpleTimeMatch[1];
      const period = simpleTimeMatch[0].toLowerCase().includes('pm') ? 'PM' : 'AM';
      preferredTime = `${hour}:00 ${period}`;
    }
  }
  
  if (!preferredTime) {
    const hourOnlyMatch = /(?:at|around|by)\s+(\d{1,2})\b/.exec(text.toLowerCase());
    if (hourOnlyMatch) {
      const hour = parseInt(hourOnlyMatch[1]);
      if (hour > 12) {
        preferredTime = `${hour}:00`;
      } else {
        preferredTime = hour >= 9 && hour <= 17 ? `${hour}:00 PM` : `${hour}:00 AM`;
      }
    }
  }
  
  console.log('Date extraction debug:', {
    originalText: text,
    extractedDate: preferredDate,
    extractedTime: preferredTime
  });
  
  return { serviceType, cancerType, preferredDate, preferredTime };
}

// Helper function to validate date strings
function isValidDateString(dateStr) {
  if (!dateStr || dateStr.length !== 10) return false;
  
  const dateObj = new Date(dateStr);
  return !isNaN(dateObj.getTime()) && dateObj.toISOString().split('T')[0] === dateStr;
}

function formatDate(dateStr) {
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts[2].length === 4) {
      const formatted = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      return isValidDateString(formatted) ? formatted : null;
    }
  }
  if (dateStr.includes('-') && dateStr.length === 10) {
    return isValidDateString(dateStr) ? dateStr : null;
  }
  return null;
}


function convertToStandardDate(day, month, year) {
  const monthMap = {
    'january': '01', 'jan': '01', 'february': '02', 'feb': '02',
    'march': '03', 'mar': '03', 'april': '04', 'apr': '04',
    'may': '05', 'may': '05', 'june': '06', 'jun': '06',
    'july': '07', 'jul': '07', 'august': '08', 'aug': '08',
    'september': '09', 'sep': '09', 'october': '10', 'oct': '10',
    'november': '11', 'nov': '11', 'december': '12', 'dec': '12'
  };
  
  const monthNum = monthMap[month.toLowerCase()] || month;
  const dayPadded = day.toString().padStart(2, '0');
  const fullDate = `${year}-${monthNum}-${dayPadded}`;
  
  // 🔑 KEY FIX: Validate the date is actually valid
  const dateObj = new Date(fullDate);
  const isValidDate = dateObj.getFullYear() == year && 
                     (dateObj.getMonth() + 1) == parseInt(monthNum) && 
                     dateObj.getDate() == parseInt(day);
  
  if (!isValidDate) {
    console.log(`⚠️ Invalid date detected: ${fullDate} (day ${day} doesn't exist in month ${month})`);
    return null; // Return null for invalid dates
  }
  
  return fullDate;
}

function formatTime(timeStr) {
  if (!timeStr) return null;
  
  let time = timeStr.toLowerCase().trim();
  
  if (time.includes('am') || time.includes('pm')) {
    time = time.replace(/(\d+:\d+)\s*(am|pm)/, '$1 $2').toUpperCase();
    return time;
  }
  
  if (time.includes(':') && !time.includes('am') && !time.includes('pm')) {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    
    if (hour24 === 0) {
      return `12:${minutes} AM`;
    } else if (hour24 < 12) {
      return `${hour24}:${minutes} AM`;
    } else if (hour24 === 12) {
      return `12:${minutes} PM`;
    } else {
      return `${hour24 - 12}:${minutes} PM`;
    }
  }
  
  return time;
}

// Improved history extraction that prioritizes recent valid dates
function extractFromHistory(messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  
  console.log('Extracting from history:', {
    totalMessages: messages.length,
    userMessages: userMessages.length
  });
  
  // Try to extract from recent messages first (better chance of getting current intent)
  let extractedInfo = { serviceType: null, cancerType: null, preferredDate: null, preferredTime: null };
  
  // Go through messages in reverse order (most recent first)
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const message = userMessages[i];
    const messageInfo = extractServiceInfo(message.message);
    
    // Fill in missing fields with found values
    if (!extractedInfo.serviceType && messageInfo.serviceType) {
      extractedInfo.serviceType = messageInfo.serviceType;
    }
    if (!extractedInfo.cancerType && messageInfo.cancerType) {
      extractedInfo.cancerType = messageInfo.cancerType;
    }
    if (!extractedInfo.preferredDate && messageInfo.preferredDate) {
      extractedInfo.preferredDate = messageInfo.preferredDate;
    }
    if (!extractedInfo.preferredTime && messageInfo.preferredTime) {
      extractedInfo.preferredTime = messageInfo.preferredTime;
    }
    
    // If we have all fields, stop searching
    if (extractedInfo.serviceType && extractedInfo.cancerType && 
        extractedInfo.preferredDate && extractedInfo.preferredTime) {
      break;
    }
  }
  
  console.log('History extraction result:', extractedInfo);
  return extractedInfo;
}

function createNotesFromAppointment(serviceType, cancerType, preferredDate, preferredTime, additionalInfo = null) {
  const keyValuePairs = {
    serviceType: serviceType,
    cancerType: cancerType,
    preferredDate: preferredDate,
    preferredTime: preferredTime,
    status: 'pending',
    bookedAt: new Date().toISOString()
  };

  if (additionalInfo) {
    Object.assign(keyValuePairs, additionalInfo);
  }

  const readableNotes = `Appointment Details:
- Service Type: ${serviceType}
- Cancer Type: ${cancerType} cancer
- Preferred Date: ${preferredDate}
- Preferred Time: ${preferredTime}
- Status: pending
- Booked At: ${new Date().toLocaleString()}`;

  const structuredNotes = JSON.stringify(keyValuePairs, null, 2);

  return {
    readable: readableNotes,
    structured: structuredNotes,
    keyValuePairs
  };
}

function validateFutureDate(dateString) {
  if (!dateString) return { isValid: false, error: 'No date provided' };
  
  try {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(appointmentDate.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }
    
    if (appointmentDate < today) {
      const pastDate = appointmentDate.toLocaleDateString();
      return { 
        isValid: false, 
        error: `The date ${pastDate} is in the past. Please provide a date that is today or in the future.` 
      };
    }
    
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    
    if (appointmentDate > twoYearsFromNow) {
      return { 
        isValid: false, 
        error: 'Appointment date cannot be more than 2 years in the future. Please choose a nearer date.' 
      };
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Date validation error' };
  }
}

// ========================================
// ROBUST MESSAGE & SESSION HANDLING
// ========================================

async function saveMessageWithRetry(messageData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`💾 Saving message (attempt ${attempt}/${maxRetries}):`, {
        role: messageData.role,
        sessionId: messageData.sessionId,
        messageLength: messageData.message?.length || 0
      });

      const savedMessage = await prismaClient.chatMessage.create({
        data: messageData
      });

      console.log(`✅ Message saved successfully:`, {
        id: savedMessage.id,
        role: savedMessage.role,
        sessionId: savedMessage.sessionId
      });

      return savedMessage;
    } catch (error) {
      console.error(`❌ Failed to save message (attempt ${attempt}/${maxRetries}):`, {
        error: error.message,
        code: error.code
      });

      if (attempt === maxRetries) {
        throw new Error(`Failed to save message after ${maxRetries} attempts: ${error.message}`);
      }

      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

async function getOrCreateSession(userId, providedSessionId = null) {
  try {
    let session = null;

    // Try to use provided session ID first
    if (providedSessionId) {
      console.log(`🔍 Looking for session ID: ${providedSessionId}`);
      
      let sessionQuery;
      
      // Handle both UUID and integer session IDs
      if (providedSessionId.includes('-')) {
        // It's a UUID - use sessionId field for lookup
        sessionQuery = {
          sessionId: providedSessionId,
          userId: userId
        };
        console.log('🔍 Using UUID sessionId lookup in getOrCreateSession');
      } else {
        // It's a number - use id field for lookup
        const sessionIdInt = parseInt(providedSessionId);
        if (isNaN(sessionIdInt)) {
          console.log(`⚠️ Invalid session ID format: ${providedSessionId}`);
          // Don't return error, just proceed to create new session
        } else {
          sessionQuery = {
            id: sessionIdInt,
            userId: userId
          };
          console.log('🔍 Using integer id lookup in getOrCreateSession');
        }
      }

      // Only query if we have a valid sessionQuery
      if (sessionQuery) {
        session = await prismaClient.chatSession.findFirst({
          where: sessionQuery
        });

        if (session) {
          console.log(`✅ Found existing session: ${session.id} (sessionId: ${session.sessionId})`);
          return session;
        } else {
          console.log(`⚠️ Session ${providedSessionId} not found or doesn't belong to user ${userId}`);
        }
      }
    }

    // If no valid session, find the most recent one for this user
    session = await prismaClient.chatSession.findFirst({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    if (session) {
      console.log(`✅ Using most recent session: ${session.id} (sessionId: ${session.sessionId})`);
      return session;
    }

    // Create new session if none exists
    console.log(`🆕 Creating new session for user: ${userId}`);
    
    // Generate a UUID for the sessionId field
    const { v4: uuidv4 } = await import('uuid');
    
    session = await prismaClient.chatSession.create({
      data: { 
        userId: userId,
        sessionId: uuidv4() // Generate UUID for sessionId field
      }
    });

    console.log(`✅ New session created: ${session.id} (sessionId: ${session.sessionId})`);
    return session;

  } catch (error) {
    console.error('❌ Session management error:', error);
    throw new Error(`Session management failed: ${error.message}`);
  }
}

async function createAppointmentWithTransaction(appointmentData) {
  try {
    console.log('🏥 Creating appointment with transaction...');
    
    // Use Prisma transaction to ensure data consistency
    const result = await prismaClient.$transaction(async (prisma) => {
      // Create the service record
      const newService = await prisma.service.create({
        data: appointmentData
      });

      // Create confirmation message
      const confirmationMessage = `🎉 Your appointment has been successfully confirmed!\n\n📋 Booking Confirmation:\n- Appointment ID: ${newService.id}\n- Service: ${appointmentData.serviceType.charAt(0).toUpperCase() + appointmentData.serviceType.slice(1)}\n- Cancer Type: ${appointmentData.cancerType.charAt(0).toUpperCase() + appointmentData.cancerType.slice(1)} cancer\n- Date: ${appointmentData.preferredDate}\n- Time: ${appointmentData.preferredTime}\n- Status: Confirmed (Pending doctor approval)\n\n✅ You will receive a confirmation email shortly. Please arrive 15 minutes early for your appointment.\n\nIs there anything else I can help you with today?`;

      // Save confirmation message in the same transaction
      const savedMessage = await prisma.chatMessage.create({
        data: {
          role: 'assistant',
          message: confirmationMessage,
          sessionId: appointmentData.sessionId // This should be the integer session.id
        }
      });

      return { newService, confirmationMessage, savedMessage };
    });

    console.log('✅ Appointment and confirmation message created successfully');
    return result;

  } catch (error) {
    console.error('❌ Transaction failed:', error);
    throw new Error(`Appointment creation failed: ${error.message}`);
  }
}

// ========================================
// MAIN CHAT CONTROLLER
// ========================================

export const chatController = async (req, res) => {
  console.log("🚀 API hit - Chat Controller Started");
  console.log("📨 Request body:", req.body);

  const { message, sessionId } = req.body;
  
  if (!message || message.trim() === '') {
    console.error("❌ Missing or empty message");
    return res.status(400).json({ 
      message: 'Message is required',
      error: 'MISSING_MESSAGE'
    });
  }

  // Mock user for development (replace with proper auth)
  if (!req.user) {
    req.user = { id: 1 };
    console.log('⚠️ Using mock user ID for development');
  }

  console.log(`👤 Processing request for user: ${req.user.id}`);

  // Check for unrelated topics
  const unrelatedTopics = ['weather', 'joke', 'sports', 'math', 'history', 'movie', 'game', 'bitcoin'];
  const isUnrelated = unrelatedTopics.some(topic => message.toLowerCase().includes(topic));
  
  if (isUnrelated) {
    console.log("🚫 Unrelated topic detected");
    return res.json({
      message: "I'm sorry, I can only help with cancer-related information or booking appointments.",
      sessionId: null,
    });
  }

  try {
    // ========================================
    // 1. SESSION MANAGEMENT
    // ========================================
    console.log("📋 Managing session...");
    
    const session = await getOrCreateSession(req.user.id, sessionId);

    // ========================================
    // 2. SAVE USER MESSAGE
    // ========================================
    console.log("💾 Saving user message...");
    
    const userMessageData = {
      role: 'user',
      message: message.trim(),
      sessionId: session.id
    };

    let savedUserMessage;
    try {
      savedUserMessage = await saveMessageWithRetry(userMessageData);
    } catch (error) {
      console.error("❌ CRITICAL: Failed to save user message");
      return res.status(500).json({
        message: 'Failed to save your message. Please try again.',
        error: 'MESSAGE_SAVE_FAILED',
        sessionId: session.id
      });
    }

    // ========================================
    // 3. GET CHAT HISTORY
    // ========================================
    console.log("📚 Retrieving chat history...");
    
    let history = [];
    try {
      history = await prismaClient.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
        take: 30 // Limit for performance
      });
      console.log(`📚 Retrieved ${history.length} messages from history`);
    } catch (error) {
      console.error("⚠️ Failed to retrieve chat history:", error);
      // Continue without history
    }

    // ========================================
    // 4. CHECK CONFIRMATION INTENT EARLY
    // ========================================
    const isConfirming = /yes|confirm|book|proceed|ok|sure|correct|right|agree/i.test(message);
    const isDeclining = /no|cancel|change|modify|wrong|incorrect/i.test(message);
    
    console.log("🎯 Early confirmation check:", { isConfirming, isDeclining });

    // ========================================
    // 5. EXTRACT APPOINTMENT INFO
    // ========================================
    console.log("🔍 Extracting appointment information...");
    
    const currentMessageInfo = extractServiceInfo(message);
    const historyInfo = extractFromHistory(history);
    
    const extractedInfo = {
      serviceType: currentMessageInfo.serviceType || historyInfo.serviceType,
      cancerType: currentMessageInfo.cancerType || historyInfo.cancerType,
      preferredDate: currentMessageInfo.preferredDate || historyInfo.preferredDate,
      preferredTime: currentMessageInfo.preferredTime || historyInfo.preferredTime
    };

    console.log("📋 Extracted info:", extractedInfo);

    // ========================================
    // 6. DATE VALIDATION (SKIP IF CONFIRMING)
    // ========================================
    // 🔑 KEY FIX: Only validate date if NOT confirming an existing appointment
    if (extractedInfo.preferredDate && !isConfirming) {
      const dateValidation = validateFutureDate(extractedInfo.preferredDate);
      if (!dateValidation.isValid) {
        console.log("❌ Date validation failed:", dateValidation.error);
        
        const errorResponse = `I understand you want to schedule an appointment, but there's an issue with the date: ${dateValidation.error}. Please provide a valid future date.`;
        
        // Save error response
        try {
          await saveMessageWithRetry({
            role: 'assistant',
            message: errorResponse,
            sessionId: session.id
          });
        } catch (error) {
          console.error("❌ Failed to save date validation error");
        }
        
        return res.json({
          message: errorResponse,
          sessionId: session.id,
          dateError: dateValidation.error
        });
      }
    }

    // If confirming, validate that we have all required fields from history
    if (isConfirming) {
      console.log("✅ User is confirming, checking if all fields are present...");
      
      // If confirming but missing fields, try to get them from a more recent history search
      if (!extractedInfo.serviceType || !extractedInfo.cancerType || !extractedInfo.preferredDate || !extractedInfo.preferredTime) {
        console.log("⚠️ Missing fields during confirmation, trying extended history search...");
        
        try {
          // Get more history to find missing info
          const extendedHistory = await prismaClient.chatMessage.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: 'desc' },
            take: 50 // Get more messages
          });
          
          const extendedHistoryInfo = extractFromHistory(extendedHistory.reverse());
          
          // Update extracted info with extended search
          extractedInfo.serviceType = extractedInfo.serviceType || extendedHistoryInfo.serviceType;
          extractedInfo.cancerType = extractedInfo.cancerType || extendedHistoryInfo.cancerType;
          extractedInfo.preferredDate = extractedInfo.preferredDate || extendedHistoryInfo.preferredDate;
          extractedInfo.preferredTime = extractedInfo.preferredTime || extendedHistoryInfo.preferredTime;
          
          console.log("📋 Updated extracted info after extended search:", extractedInfo);
        } catch (error) {
          console.error("❌ Extended history search failed:", error);
        }
      }
    }

    // ========================================
    // 7. HANDLE UPDATE INTENT
    // ========================================
    const isUpdating = /update|change|reschedule|modify|reset|start over|new appointment/i.test(message);
    if (isUpdating) {
      console.log("🔄 Update intent detected, clearing existing services");
      try {
        await prismaClient.service.deleteMany({
          where: { sessionId: session.id }
        });
        console.log("✅ Existing services cleared");
      } catch (error) {
        console.error("⚠️ Failed to clear existing services:", error);
      }
    }

    // ========================================
    // 8. GENERATE LOCAL LLM RESPONSE
    // ========================================
    console.log("🤖 Generating Local LLM response...");
    
    let gptReply;
    try {
      const systemMessage = `You are CancerMitr, a professional and empathetic cancer care assistant chatbot.

🎯 Responsibilities:
1. Answer questions about cancer (types, treatments, symptoms, prevention, etc.)
2. Help book appointments step-by-step: serviceType → cancerType → preferredDate → preferredTime
3. Once all information is collected, ask for confirmation before booking
4. Guide user clearly when they want to update an appointment
5. Be supportive and understanding given the sensitive nature of cancer care
6. Do not answer unrelated topics

📋 For appointments, collect:
- Service Type: consultation, treatment, test, screening, checkup, follow-up, surgery
- Cancer Type: breast, lung, skin, prostate, colon, liver, kidney, brain, blood, bone
- Preferred Date: any readable date format - MUST BE FUTURE DATE
- Preferred Time: any time format (e.g., "2:00 PM", "14:00", "2 PM")

Current extracted info: ${JSON.stringify(extractedInfo)}

IMPORTANT: If information is already extracted above, do NOT ask for it again.`;

      const conversationHistory = [
        ...history.slice(-15).map(m => ({
          role: m.role,
          content: m.message
        })),
        { role: 'user', content: message }
      ];

      gptReply = await callLocalLLM(systemMessage, conversationHistory);
      console.log("✅ Local LLM response generated");
      
    } catch (error) {
      console.error("❌ Local LLM API error:", error);
      gptReply = "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
    }

    // ========================================
    // 9. CHECK FINAL BOOKING STATUS
    // ========================================
    const hasAllFields = extractedInfo.serviceType && extractedInfo.cancerType && extractedInfo.preferredDate && extractedInfo.preferredTime;

    console.log("🎯 Final booking status check:", {
      hasAllFields,
      isConfirming,
      isDeclining,
      extractedInfo
    });

    // Check for existing appointments
    let existingService = null;
    try {
      existingService = await prismaClient.service.findFirst({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' }
      });
      console.log(`📋 Existing service: ${existingService ? `Found (ID: ${existingService.id})` : 'None'}`);
    } catch (error) {
      console.error("⚠️ Error checking existing services:", error);
    }

    // ========================================
    // 10. HANDLE APPOINTMENT CONFIRMATION
    // ========================================
const isSameAsExisting = existingService &&
    existingService.serviceType === extractedInfo.serviceType &&
    existingService.cancerType === extractedInfo.cancerType &&
    existingService.preferredDate === extractedInfo.preferredDate &&
    existingService.preferredTime === extractedInfo.preferredTime;

if (hasAllFields && isConfirming && (!existingService || !isSameAsExisting)) {
      console.log("✅ Creating confirmed appointment...");
      console.log("📋 Final appointment data:", extractedInfo);
      
      try {
        const notesData = createNotesFromAppointment(
          extractedInfo.serviceType,
          extractedInfo.cancerType,
          extractedInfo.preferredDate,
          extractedInfo.preferredTime
        );

        const appointmentData = {
          userId: req.user.id,
          sessionId: session.id,
          serviceType: extractedInfo.serviceType,
          cancerType: extractedInfo.cancerType,
          preferredDate: extractedInfo.preferredDate,
          preferredTime: extractedInfo.preferredTime,
          notes: notesData.readable,
          status: 'pending'
        };

        const result = await createAppointmentWithTransaction(appointmentData);

        console.log(`🎉 Appointment created successfully: ID ${result.newService.id}`);

        return res.json({
          message: result.confirmationMessage,
          sessionId: session.sessionId || session.id, // Return the UUID sessionId for frontend
          appointmentId: result.newService.id,
          appointmentDetails: notesData.keyValuePairs,
          confirmed: true,
          messagesSaved: {
            userMessage: true,
            confirmationMessage: true
          }
        });

      } catch (error) {
        console.error("❌ Failed to create appointment:", error);
        
        const errorMessage = "I apologize, but there was an error creating your appointment. Please try again or contact support.";
        
        // Save error message
        try {
          await saveMessageWithRetry({
            role: 'assistant',
            message: errorMessage,
            sessionId: session.id
          });
        } catch (saveError) {
          console.error("❌ Failed to save error message");
        }
        
        return res.status(500).json({
          message: errorMessage,
          sessionId: session.sessionId || session.id,
          error: 'APPOINTMENT_CREATION_FAILED'
        });
      }
    }

    // ========================================
    // 11. SAVE LLM RESPONSE
    // ========================================
    let responseToSend = gptReply;
    let savedAssistantMessage = null;

    // Handle confirmation request
    if (hasAllFields && !existingService && !isConfirming && !isDeclining) {
      responseToSend = `${gptReply}\n\n📋 I have all the information needed for your appointment:\n\n- Service Type: ${extractedInfo.serviceType.charAt(0).toUpperCase() + extractedInfo.serviceType.slice(1)}\n- Cancer Type: ${extractedInfo.cancerType.charAt(0).toUpperCase() + extractedInfo.cancerType.slice(1)} cancer\n- Preferred Date: ${extractedInfo.preferredDate}\n- Preferred Time: ${extractedInfo.preferredTime}\n\n✅ Would you like to confirm this appointment? Please reply with "Yes" to confirm or "No" if you'd like to make changes.`;
    }

    // Handle decline/modification request
    if (hasAllFields && !existingService && isDeclining) {
      responseToSend = `No problem! Let me help you modify your appointment details.\n\nCurrent details:\n- Service Type: ${extractedInfo.serviceType}\n- Cancer Type: ${extractedInfo.cancerType} cancer\n- Preferred Date: ${extractedInfo.preferredDate}\n- Preferred Time: ${extractedInfo.preferredTime}\n\nWhat would you like to change?`;
    }

    // Handle missing information (but not if user is confirming)
    if ((extractedInfo.serviceType || extractedInfo.cancerType || extractedInfo.preferredDate || extractedInfo.preferredTime) && !hasAllFields && !isConfirming) {
      const missing = [];
      if (!extractedInfo.serviceType) missing.push('service type');
      if (!extractedInfo.cancerType) missing.push('cancer type');
      if (!extractedInfo.preferredDate) missing.push('preferred date');
      if (!extractedInfo.preferredTime) missing.push('preferred time');

      if (missing.length > 0) {
        responseToSend = `${gptReply}\n\n📝 To complete your appointment booking, I still need: ${missing.join(', ')}`;
      }
    }

    console.log("💾 Saving assistant response...");
    
    try {
      savedAssistantMessage = await saveMessageWithRetry({
        role: 'assistant',
        message: responseToSend,
        sessionId: session.id
      });
    } catch (error) {
      console.error("❌ Failed to save assistant message:", error);
      // Continue with response even if save fails
    }

    // ========================================
    // 12. RETURN RESPONSE
    // ========================================
    const response = {
      message: responseToSend,
      sessionId: session.sessionId || session.id, // Return UUID for frontend
      messagesSaved: {
        userMessage: !!savedUserMessage,
        assistantMessage: !!savedAssistantMessage
      },
      debug: {
        extractedInfo,
        hasAllFields,
        existingService: !!existingService,
        isConfirming,
        isDeclining
      }
    };

    // Add specific response flags
    if (hasAllFields && !existingService && !isConfirming && !isDeclining) {
      response.requiresConfirmation = true;
      response.appointmentSummary = extractedInfo;
    }

    if (hasAllFields && !existingService && isDeclining) {
      response.requiresModification = true;
    }

    if (!hasAllFields && (extractedInfo.serviceType || extractedInfo.cancerType || extractedInfo.preferredDate || extractedInfo.preferredTime) && !isConfirming) {
      const missing = [];
      if (!extractedInfo.serviceType) missing.push('service type');
      if (!extractedInfo.cancerType) missing.push('cancer type');
      if (!extractedInfo.preferredDate) missing.push('preferred date');
      if (!extractedInfo.preferredTime) missing.push('preferred time');
      response.missingFields = missing;
    }

    console.log("✅ Sending response to client");
    return res.json(response);

  } catch (err) {
    console.error('❌ CRITICAL chatController error:', err);
    console.error('Error stack:', err.stack);
    
    return res.status(500).json({
      message: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
      error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_SERVER_ERROR',
      sessionId: req.body.sessionId || null
    });
  }
};

export const chatHistoryController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.user;

    console.log('📚 Chat History Request:', { sessionId, userId });

    // Validate sessionId
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Handle both UUID and integer session IDs
    let sessionQuery;

    // Check if sessionId looks like a UUID (contains dashes) or is a number
    if (sessionId.includes('-')) {
      // It's a UUID - use sessionId field for lookup
      sessionQuery = {
        sessionId: sessionId,
        userId: userId
      };
      console.log('🔍 Using UUID sessionId lookup');
    } else {
      // It's a number - use id field for lookup
      const sessionIdInt = parseInt(sessionId);
      if (isNaN(sessionIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session ID format'
        });
      }
      sessionQuery = {
        id: sessionIdInt,
        userId: userId
      };
      console.log('🔍 Using integer id lookup');
    }

    // Verify session belongs to the authenticated user
    const chatSession = await prismaClient.chatSession.findFirst({
      where: sessionQuery
    });

    console.log('🔍 Session lookup result:', { 
      found: !!chatSession, 
      searchCriteria: sessionQuery,
      chatSession: chatSession ? { id: chatSession.id, sessionId: chatSession.sessionId } : null 
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found or access denied'
      });
    }

    // 🔑 KEY FIX: Use chatSession.id (integer) for ChatMessage lookup, not sessionId (UUID)
    const messageSessionId = chatSession.id; // Always use the integer ID for messages

    console.log('🔍 Looking for messages with sessionId (integer):', messageSessionId);

    // Fetch all messages for this session using the INTEGER id
    const messages = await prismaClient.chatMessage.findMany({
      where: {
        sessionId: messageSessionId // Use integer ID, not UUID
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      },
      select: {
        id: true,
        message: true,
        role: true,
        createdAt: true
      }
    });

    console.log(`📨 Found ${messages.length} messages for session ${messageSessionId}`);

    // Format messages for frontend
    const formattedMessages = messages.map(message => ({
      id: message.id,
      text: message.message,
      sender: message.role === 'assistant' ? 'bot' : message.role,
      timestamp: message.createdAt,
      messageType: 'text'
    }));

    // Get session metadata - return the UUID sessionId for frontend
    const sessionMetadata = {
      sessionId: chatSession.sessionId || chatSession.id, // Return UUID for frontend
      userId: chatSession.userId,
      status: 'active',
      startedAt: chatSession.createdAt,
      lastActivity: chatSession.updatedAt,
      messageCount: messages.length
    };

    console.log('✅ Returning chat history successfully');

    return res.status(200).json({
      success: true,
      message: 'Chat history retrieved successfully',
      data: {
        session: sessionMetadata,
        messages: formattedMessages,
        totalMessages: messages.length
      }
    });

  } catch (error) {
    console.error('❌ Error retrieving chat history:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Database constraint error'
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};