// scripts/createCollection.js
import { qdrantClient } from '../src/qdrant/qdrantClient.js'

async function createCollection() {
    const collectionName = 'products_collection'

    const exists = await qdrantClient.getCollections()
    const collectionExists = exists.collections.some(col => col.name === collectionName)

    if (!collectionExists) {
        await qdrantClient.createCollection(collectionName, {
            vectors: {
                size: 1536, // match embedding size (e.g., OpenAI text-embedding-ada-002)
                distance: 'Cosine'
            }
        })
        console.log('✅ Collection created successfully.')
    } else {
        console.log('ℹ️ Collection already exists.')
    }
}

createCollection().catch(console.error)
