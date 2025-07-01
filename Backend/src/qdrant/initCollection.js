import { qdrantClient } from './qdrantClient.js';

const COLLECTION_NAME = 'products';

export async function initCollection() {
    const exists = await qdrantClient.getCollections().then(res =>
        res.collections.some(c => c.name === COLLECTION_NAME)
    );

    if (!exists) {
        await qdrantClient.createCollection(COLLECTION_NAME, {
            vectors: {
                size: 1536, // default OpenAI embedding size
                distance: 'Cosine',
            },
        });
        console.log(`✅ Collection '${COLLECTION_NAME}' created.`);
    } else {
        console.log(`ℹ️ Collection '${COLLECTION_NAME}' already exists.`);
    }
}
