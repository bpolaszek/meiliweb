// REST configurations of the embedding providers documented by Meilisearch, so that users don't have to write
// request/response templates by hand. Source: https://www.meilisearch.com/docs/capabilities/hybrid_search/providers

export type EmbedderPresetModel = {
  name: string
  dimensions: number
}

export type EmbedderPresetSettings = {
  url: string
  request: Record<string, any>
  response: Record<string, any>
  headers?: Record<string, string>
  dimensions: number
}

export type EmbedderPreset = {
  id: string
  label: string
  docUrl: string
  models: EmbedderPresetModel[]
  build: (model: EmbedderPresetModel) => EmbedderPresetSettings
}

const DOCS_BASE_URL = 'https://www.meilisearch.com/docs/capabilities/hybrid_search'

// Request/response shape shared by the providers mimicking OpenAI's embeddings API
const openAiLike = (url: string) => (model: EmbedderPresetModel) => ({
  url,
  request: { model: model.name, input: ['{{text}}', '{{..}}'] },
  response: { data: [{ embedding: '{{embedding}}' }, '{{..}}'] },
  dimensions: model.dimensions,
})

export const EMBEDDER_PRESETS: EmbedderPreset[] = [
  {
    id: 'cohere',
    label: 'Cohere',
    docUrl: `${DOCS_BASE_URL}/how_to/configure_cohere_embedder`,
    models: [
      { name: 'embed-v4.0', dimensions: 1536 },
      { name: 'embed-english-v3.0', dimensions: 1024 },
      { name: 'embed-multilingual-v3.0', dimensions: 1024 },
      { name: 'embed-english-light-v3.0', dimensions: 384 },
      { name: 'embed-multilingual-light-v3.0', dimensions: 384 },
    ],
    build: (model) => ({
      url: 'https://api.cohere.com/v1/embed',
      request: { model: model.name, texts: ['{{text}}', '{{..}}'], input_type: 'search_document' },
      response: { embeddings: ['{{embedding}}', '{{..}}'] },
      dimensions: model.dimensions,
    }),
  },
  {
    id: 'voyage',
    label: 'Voyage AI',
    docUrl: `${DOCS_BASE_URL}/providers/voyage`,
    models: [
      { name: 'voyage-4-lite', dimensions: 1024 },
      { name: 'voyage-4', dimensions: 1024 },
      { name: 'voyage-4-large', dimensions: 1024 },
      { name: 'voyage-code-3', dimensions: 1024 },
      { name: 'voyage-finance-2', dimensions: 1024 },
      { name: 'voyage-law-2', dimensions: 1024 },
    ],
    build: openAiLike('https://api.voyageai.com/v1/embeddings'),
  },
  {
    id: 'mistral',
    label: 'Mistral',
    docUrl: `${DOCS_BASE_URL}/providers/mistral`,
    models: [{ name: 'mistral-embed', dimensions: 1024 }],
    build: openAiLike('https://api.mistral.ai/v1/embeddings'),
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    docUrl: `${DOCS_BASE_URL}/providers/gemini`,
    models: [{ name: 'gemini-embedding-001', dimensions: 3072 }],
    build: (model) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:batchEmbedContents`,
      request: {
        requests: [{ model: `models/${model.name}`, content: { parts: [{ text: '{{text}}' }] } }, '{{..}}'],
      },
      response: { embeddings: [{ values: '{{embedding}}' }, '{{..}}'] },
      // Gemini doesn't accept bearer tokens: the key goes in this header instead of the API key field
      headers: { 'x-goog-api-key': '<GEMINI_API_KEY>' },
      dimensions: model.dimensions,
    }),
  },
  {
    id: 'jina',
    label: 'Jina',
    docUrl: `${DOCS_BASE_URL}/providers/jina`,
    models: [
      { name: 'jina-embeddings-v5-text-small', dimensions: 1024 },
      { name: 'jina-embeddings-v5-text-nano', dimensions: 768 },
      { name: 'jina-embeddings-v3', dimensions: 1024 },
    ],
    build: openAiLike('https://api.jina.ai/v1/embeddings'),
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare Workers AI',
    docUrl: `${DOCS_BASE_URL}/providers/cloudflare`,
    models: [
      { name: '@cf/baai/bge-small-en-v1.5', dimensions: 384 },
      { name: '@cf/baai/bge-base-en-v1.5', dimensions: 768 },
      { name: '@cf/baai/bge-large-en-v1.5', dimensions: 1024 },
      { name: '@cf/google/embeddinggemma-300m', dimensions: 768 },
      { name: '@cf/qwen/qwen3-embedding-0.6b', dimensions: 1024 },
    ],
    build: (model) => ({
      url: `https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/run/${model.name}`,
      request: { text: ['{{text}}', '{{..}}'] },
      response: { result: { data: ['{{embedding}}', '{{..}}'] } },
      dimensions: model.dimensions,
    }),
  },
  {
    id: 'bedrock',
    label: 'AWS Bedrock',
    docUrl: `${DOCS_BASE_URL}/providers/bedrock`,
    models: [{ name: 'amazon.titan-embed-text-v2:0', dimensions: 1024 }],
    build: (model) => ({
      url: `https://bedrock-runtime.<REGION>.amazonaws.com/model/${model.name}/invoke`,
      request: { inputText: '{{text}}', dimensions: model.dimensions, normalize: true },
      response: { embedding: '{{embedding}}' },
      dimensions: model.dimensions,
    }),
  },
  {
    id: 'huggingFaceInference',
    label: 'Hugging Face Inference',
    docUrl: `${DOCS_BASE_URL}/providers/huggingface`,
    models: [
      { name: 'BAAI/bge-small-en-v1.5', dimensions: 384 },
      { name: 'BAAI/bge-large-en-v1.5', dimensions: 1024 },
      { name: 'sentence-transformers/all-MiniLM-L6-v2', dimensions: 384 },
      { name: 'sentence-transformers/all-mpnet-base-v2', dimensions: 768 },
      { name: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', dimensions: 384 },
      { name: 'intfloat/multilingual-e5-large', dimensions: 1024 },
    ],
    build: (model) => ({
      // Serverless inference: a dedicated Inference Endpoint takes the same payload at its own URL
      url: `https://router.huggingface.co/hf-inference/models/${model.name}/pipeline/feature-extraction`,
      request: { inputs: ['{{text}}', '{{..}}'] },
      response: ['{{embedding}}', '{{..}}'],
      dimensions: model.dimensions,
    }),
  },
]
