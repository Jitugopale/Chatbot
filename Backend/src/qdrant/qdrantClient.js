import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrantClient = new QdrantClient({
    url: 'http://localhost:6333',
});
