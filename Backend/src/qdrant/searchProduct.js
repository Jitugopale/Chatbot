import { qdrantClient } from './qdrantClient.js';
import { getEmbedding } from './utils.js';

const COLLECTION_NAME = 'products';

export async function searchProduct(queryText, limit = 5) {
    const vector = await getEmbedding(queryText);
    const result = await qdrantClient.search(COLLECTION_NAME, {
        vector,
        limit,
        with_payload: true
    });

    return result.map(hit => ({
        id: hit.id,
        score: hit.score,
        name: hit.payload.name,
        description: hit.payload.description,
    }));
}
