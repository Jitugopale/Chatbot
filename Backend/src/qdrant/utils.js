import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../secrets.js'; // adjust based on your path

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function getEmbedding(text) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
    });
    return response.data[0].embedding;
}
