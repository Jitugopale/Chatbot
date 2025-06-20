
import OpenAI from 'openai';
import { prismaClient } from '../routes/index.js';
import { OPENAI_API_KEY } from '../secrets.js';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Simple keyword-based extractor (can be replaced with OpenAI function calling later)
function extractServiceInfo(message) {
  const lower = message.toLowerCase();

  const serviceType = /consultation|treatment|test/.exec(lower)?.[0] || null;
  const cancerType = /breast|lung|skin|prostate/.exec(lower)?.[0] || null;
  const preferredDate = /\b\d{4}-\d{2}-\d{2}\b/.exec(lower)?.[0] || null;
  const preferredTime = /\b\d{2}:\d{2}\b/.exec(lower)?.[0] || null;

  return { serviceType, cancerType, preferredDate, preferredTime };
}

export const chatController = async (req, res) => {
  console.log("API hit");

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Missing message or userId' });
  }

   const unrelatedTopics = ['weather', 'joke', 'sports', 'math', 'history', 'movie', 'game', 'bitcoin'];
  const isUnrelated = unrelatedTopics.some(topic => message.toLowerCase().includes(topic));
  if (isUnrelated) {
    return res.json({
      message: "I'm sorry, I can only help with cancer-related information or booking appointments.",
      sessionId: null,
    });
  }

  try {
    // 1. Check for latest existing ChatSession
    let session = await prismaClient.chatSession.findFirst({
      where: { userId : req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // 2. If no session, create a new one
    if (!session) {
      session = await prismaClient.chatSession.create({
        data: { userId : req.user.id },
      });
    }

    // 3. Save User Message
    await prismaClient.chatMessage.create({
      data: {
        role: 'user',
        message,
        sessionId: session.id,
      },
    });

    // 4. Get GPT response
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
 {
  role: 'system',
  content: `
You are CancerMitr, a professional and empathetic cancer care assistant chatbot.

Your responsibilities:
1. **Answer user questions** about cancer types (e.g., breast, lung, prostate, skin), symptoms, treatments, tests, and procedures.
2. **Help users book appointments** step-by-step for consultation, treatment, or tests:
   - Service Type → Cancer Type → Preferred Date → Preferred Time
3. **Confirm appointment** once all fields are filled. After booking, optionally provide brief related info (e.g., common treatments).
4. **Update appointment** only if the user clearly asks to change it.

If the user wants to update an appointment:
- Say: "You're updating your appointment. Let's go step-by-step again."

If a user asks unrelated questions (e.g., jokes, sports, weather, movies), respond with:
"I'm sorry, I can only assist with cancer-related information or appointment booking."

You are:
- Professional
- Polite
- Helpful
- To-the-point
`
}

,
        { role: 'user', content: message },
      ],
    });

    const gptReply = gptResponse.choices[0].message.content;

    // 5. Save GPT message
    await prismaClient.chatMessage.create({
      data: {
        role: 'gpt',
        message: gptReply,
        sessionId: session.id,
      },
    });

    // 6. Try to extract service data
    const { serviceType, cancerType, preferredDate, preferredTime } = extractServiceInfo(message);

    // 7. If all service data is present and not already booked for this session
    const existingService = await prismaClient.service.findUnique({
      where: { sessionId: session.id },
    });

    if (!existingService && serviceType && cancerType && preferredDate && preferredTime) {
      await prismaClient.service.create({
        data: {
          userId : req.user.id,
          sessionId: session.id,
          serviceType,
          cancerType,
          preferredDate,
          preferredTime,
          status: 'pending',
        },
      });

      return res.json({
        message: `${gptReply}\n\n✅ Your appointment for ${cancerType} (${serviceType}) on ${preferredDate} at ${preferredTime} has been booked successfully.`,
        sessionId: session.sessionId,
      });
    }

    // 8. Return GPT reply
    res.json({ message: gptReply, sessionId: session.sessionId });
  } catch (err) {
    console.error('chatController error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

