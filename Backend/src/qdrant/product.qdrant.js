import { qdrantClient } from './qdrantClient.js';
import { getEmbedding } from './utils.js';

const COLLECTION_NAME = 'products';

export async function upsertProduct({ id, name, description }) {
    const vector = await getEmbedding(`${name} ${description}`);
    await qdrantClient.upsert(COLLECTION_NAME, {
        points: [{
            id,
            vector,
            payload: { name, description }
        }]
    });
    console.log(`✅ Product ${id} indexed`);
}
