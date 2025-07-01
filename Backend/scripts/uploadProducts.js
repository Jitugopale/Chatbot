import fs from 'fs'
import { qdrantClient } from '../src/qdrant/qdrantClient.js'
import { getEmbedding } from '../src/qdrant/utils.js'
import { v4 as uuidv4 } from 'uuid'

const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf-8'))

async function uploadProducts() {
  const points = []

  for (const product of products) {
    const combinedText = `${product.product_name}. ${product.description}. ${product.recommended_for.join(', ')}`
    const embedding = await getEmbedding(combinedText)

    points.push({
      id: uuidv4(),
      vector: embedding,
      payload: {
        product_name: product.product_name,
        description: product.description,
        recommended_for: product.recommended_for
      }
    })
  }

  await qdrantClient.upsert('products_collection', {
    wait: true,
    points
  })

  console.log('✅ Products uploaded successfully to Qdrant')
}

uploadProducts()
