
import OpenAI from 'openai';
import { prismaClient } from '../routes/index.js';
import { OPENAI_API_KEY } from '../secrets.js';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function extractServiceInfo(text) {
  const lower = text.toLowerCase();
  const serviceType = /(consultation|treatment|test|screening|checkup|follow-up|surgery)/.exec(lower)?.[1] || null;
  const cancerType = /(breast|lung|skin|prostate|colon|liver|kidney|brain|blood|bone)/.exec(lower)?.[1] || null;
  
  // Enhanced date extraction - supports multiple formats
  let preferredDate = null;
  
  // Format 1: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
  const standardDateMatch = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/.exec(text);
  if (standardDateMatch) {
    preferredDate = formatDate(standardDateMatch[1]);
  }
  
  // Format 2: "27th November 2025", "November 27, 2025", "27 Nov 2025"
  if (!preferredDate) {
    const monthNames = 'january|february|march|april|may|june|july|august|september|october|november|december';
    const monthShort = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
    
    // "27th November 2025" or "27 November 2025"
    const dayMonthYearMatch = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames}|${monthShort})\\s+(\\d{4})\\b`, 'i').exec(text);
    if (dayMonthYearMatch) {
      preferredDate = convertToStandardDate(dayMonthYearMatch[1], dayMonthYearMatch[2], dayMonthYearMatch[3]);
    }
    
    // "November 27, 2025" or "Nov 27, 2025"
    if (!preferredDate) {
      const monthDayYearMatch = new RegExp(`\\b(${monthNames}|${monthShort})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'i').exec(text);
      if (monthDayYearMatch) {
        preferredDate = convertToStandardDate(monthDayYearMatch[2], monthDayYearMatch[1], monthDayYearMatch[3]);
      }
    }
  }
  
  // Enhanced time extraction - supports AM/PM and 24hr format
  let preferredTime = null;
  
  // Format 1: "2:00 PM", "2:00pm", "14:00", "2:30 AM"
  const timeMatch = /\b(\d{1,2}:\d{2}(?:\s*(?:am|pm))?)\b/i.exec(text);
  if (timeMatch) {
    preferredTime = formatTime(timeMatch[1]);
  }
  
  // Format 2: "2 PM", "2pm", "14", "2 AM" (without minutes)
  if (!preferredTime) {
    const simpleTimeMatch = /\b(\d{1,2})(?:\s*(?:am|pm))\b/i.exec(text);
    if (simpleTimeMatch) {
      const hour = simpleTimeMatch[1];
      const period = simpleTimeMatch[0].toLowerCase().includes('pm') ? 'PM' : 'AM';
      preferredTime = `${hour}:00 ${period}`;
    }
  }
  
  // Format 3: "at 2", "around 14", "by 3" (assume 24hr if > 12, otherwise add context)
  if (!preferredTime) {
    const hourOnlyMatch = /(?:at|around|by)\s+(\d{1,2})\b/.exec(text.toLowerCase());
    if (hourOnlyMatch) {
      const hour = parseInt(hourOnlyMatch[1]);
      if (hour > 12) {
        preferredTime = `${hour}:00`;
      } else {
        // Default to PM for common appointment hours (9-17)
        preferredTime = hour >= 9 && hour <= 17 ? `${hour}:00 PM` : `${hour}:00 AM`;
      }
    }
  }
  
  return { serviceType, cancerType, preferredDate, preferredTime };
}

function convertToStandardDate(day, month, year) {
  const monthMap = {
    'january': '01', 'jan': '01',
    'february': '02', 'feb': '02',
    'march': '03', 'mar': '03',
    'april': '04', 'apr': '04',
    'may': '05', 'may': '05',
    'june': '06', 'jun': '06',
    'july': '07', 'jul': '07',
    'august': '08', 'aug': '08',
    'september': '09', 'sep': '09',
    'october': '10', 'oct': '10',
    'november': '11', 'nov': '11',
    'december': '12', 'dec': '12'
  };
  
  const monthNum = monthMap[month.toLowerCase()] || month;
  const dayPadded = day.toString().padStart(2, '0');
  
  return `${year}-${monthNum}-${dayPadded}`;
}

function formatDate(dateStr) {
  // Convert various date formats to YYYY-MM-DD
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  }
  if (dateStr.includes('-') && dateStr.length === 10) {
    return dateStr;
  }
  return dateStr;
}

function formatTime(timeStr) {
  if (!timeStr) return null;
  
  // Normalize time format
  let time = timeStr.toLowerCase().trim();
  
  // Handle AM/PM formats
  if (time.includes('am') || time.includes('pm')) {
    // Ensure proper spacing and capitalization
    time = time.replace(/(\d+:\d+)\s*(am|pm)/, '$1 $2').toUpperCase();
    return time;
  }
  
  // Handle 24-hour format - convert to 12-hour with AM/PM
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

function extractFromHistory(messages) {
  const history = messages.map(m => m.message.toLowerCase()).join(' ');
  return extractServiceInfo(history);
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

  // Add any additional extracted information
  if (additionalInfo) {
    Object.assign(keyValuePairs, additionalInfo);
  }

  // Create readable notes with key-value pairs
  const readableNotes = `Appointment Details:
- Service Type: ${serviceType}
- Cancer Type: ${cancerType} cancer
- Preferred Date: ${preferredDate}
- Preferred Time: ${preferredTime}
- Status: pending
- Booked At: ${new Date().toLocaleString()}`;

  // Create structured notes for easy parsing
  const structuredNotes = JSON.stringify(keyValuePairs, null, 2);

  return {
    readable: readableNotes,
    structured: structuredNotes,
    keyValuePairs
  };
}

export const chatController = async (req, res) => {
  console.log("API hit");

  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'Missing message' });

  const unrelatedTopics = ['weather', 'joke', 'sports', 'math', 'history', 'movie', 'game', 'bitcoin'];
  const isUnrelated = unrelatedTopics.some(topic => message.toLowerCase().includes(topic));
  if (isUnrelated) {
    return res.json({
      message: "I'm sorry, I can only help with cancer-related information or booking appointments.",
      sessionId: null,
    });
  }

  try {
    // 1. Get or create chat session
    let session = await prismaClient.chatSession.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      session = await prismaClient.chatSession.create({
        data: { userId: req.user.id },
      });
    }

    // 2. Save user message
    await prismaClient.chatMessage.create({
      data: {
        role: 'user',
        message,
        sessionId: session.id,
      },
    });

    // 3. Get chat history
    const history = await prismaClient.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Extract info from current message and full history
    const currentMessageInfo = extractServiceInfo(message);
    const historyInfo = extractFromHistory(history);
    
    // Merge information - prioritize current message over history
    const { 
      serviceType = currentMessageInfo.serviceType || historyInfo.serviceType,
      cancerType = currentMessageInfo.cancerType || historyInfo.cancerType,
      preferredDate = currentMessageInfo.preferredDate || historyInfo.preferredDate,
      preferredTime = currentMessageInfo.preferredTime || historyInfo.preferredTime
    } = {};

    // 5. Detect update intent
    const isUpdating = /update|change|reschedule|modify/.test(message.toLowerCase());
    if (isUpdating) {
      // Delete existing service for this session
      await prismaClient.service.deleteMany({
        where: { sessionId: session.id },
      });
    }

    // 6. Get GPT reply with enhanced context
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `
You are CancerMitr, a professional and empathetic cancer care assistant chatbot.

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
- Preferred Date: any readable date format (e.g., "June 23, 2025", "23rd June 2025")
- Preferred Time: any time format (e.g., "2:00 PM", "14:00", "2 PM")

🧠 You're professional, empathetic, helpful, and direct. Always maintain a caring tone.

Current extracted info: ${JSON.stringify({ serviceType, cancerType, preferredDate, preferredTime })}

IMPORTANT: If you can see that information has been extracted in the current extracted info above, do NOT ask for that information again. For example, if preferredTime shows "2:00 PM", do not say you need the preferred time.
          `,
        },
        ...history.map(m => ({
          role: m.role,
          content: m.message,
        })),
        { role: 'user', content: message },
      ],
    });

    const gptReply = gptResponse.choices[0].message.content;

    // 7. Save GPT reply
    await prismaClient.chatMessage.create({
      data: {
        role: 'assistant',
        message: gptReply,
        sessionId: session.id,
      },
    });

    // 8. Check for confirmation intent
    const isConfirming = /yes|confirm|book|proceed|ok|sure|correct|right|agree/i.test(message);
    const isDeclining = /no|cancel|change|modify|wrong|incorrect/i.test(message);

    // 9. Check if we have all required fields for confirmation
    const hasAllFields = serviceType && cancerType && preferredDate && preferredTime;
    
    // 10. Check if appointment already exists
    const existingService = await prismaClient.service.findUnique({
      where: { sessionId: session.id },
    });

    // 11. Handle confirmation flow
    if (hasAllFields && !existingService) {
      if (isConfirming) {
        // User confirmed - create the appointment
        const notesData = createNotesFromAppointment(serviceType, cancerType, preferredDate, preferredTime);
        
        const newService = await prismaClient.service.create({
          data: {
            userId: req.user.id,
            sessionId: session.id,
            serviceType,
            cancerType,
            preferredDate,
            preferredTime,
            notes: notesData.readable,
            status: 'pending',
          },
        });

        console.log('Service created:', newService);
        console.log('Key-value pairs:', notesData.keyValuePairs);

        return res.json({
          message: `🎉 Your appointment has been successfully confirmed!\n\n📋 Booking Confirmation:\n- Appointment ID: ${newService.id}\n- Service: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}\n- Cancer Type: ${cancerType.charAt(0).toUpperCase() + cancerType.slice(1)} cancer\n- Date: ${preferredDate}\n- Time: ${preferredTime}\n- Status: Confirmed (Pending doctor approval)\n\n✅ You will receive a confirmation email shortly. Please arrive 15 minutes early for your appointment.\n\nIs there anything else I can help you with today?`,
          sessionId: session.id,
          appointmentId: newService.id,
          appointmentDetails: notesData.keyValuePairs,
          confirmed: true
        });
      } else if (isDeclining) {
        // User wants to change something - reset and ask what to change
        return res.json({
          message: `No problem! Let me help you modify your appointment details.\n\nCurrent details:\n- Service Type: ${serviceType}\n- Cancer Type: ${cancerType} cancer\n- Preferred Date: ${preferredDate}\n- Preferred Time: ${preferredTime}\n\nWhat would you like to change?`,
          sessionId: session.id,
          requiresModification: true
        });
      } else {
        // Ask for confirmation
        return res.json({
          message: `${gptReply}\n\n📋 I have all the information needed for your appointment:\n\n- Service Type: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}\n- Cancer Type: ${cancerType.charAt(0).toUpperCase() + cancerType.slice(1)} cancer\n- Preferred Date: ${preferredDate}\n- Preferred Time: ${preferredTime}\n\n✅ Would you like to confirm this appointment? Please reply with "Yes" to confirm or "No" if you'd like to make changes.`,
          sessionId: session.id,
          requiresConfirmation: true,
          appointmentSummary: { serviceType, cancerType, preferredDate, preferredTime }
        });
      }
    }

    // 12. Provide guidance if missing information
    if (serviceType || cancerType || preferredDate || preferredTime) {
      const missing = [];
      if (!serviceType) missing.push('service type');
      if (!cancerType) missing.push('cancer type');
      if (!preferredDate) missing.push('preferred date');
      if (!preferredTime) missing.push('preferred time');

      if (missing.length > 0) {
        const missingInfo = missing.join(', ');
        return res.json({
          message: `${gptReply}\n\n📝 To complete your appointment booking, I still need: ${missingInfo}`,
          sessionId: session.id,
          missingFields: missing
        });
      }
    }

    // 13. Return normal GPT response
    res.json({ 
      message: gptReply, 
      sessionId: session.id 
    });

  } catch (err) {
    console.error('chatController error:', err);
    res.status(500).json({ 
      message: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};