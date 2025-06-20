import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../secrets.js';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // or use your secrets file here
});

export const chatController = async (req, res) => {
    console.log("api hit")
  const { message, sessionId } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful cancer care assistant.' },
        { role: 'user', content: message }
      ]
    });

    const reply = response.choices[0].message.content;
    res.json({ message: reply });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ message: 'Error from OpenAI' });
  }
};
