import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { GoogleGenAI, Type } from '@google/genai'

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
})

// Authenticates via Application Default Credentials
// (GOOGLE_APPLICATION_CREDENTIALS), not an API key.
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

const deviceUpload = upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'settings', maxCount: 1 },
])

const imagePart = (file: Express.Multer.File) => ({
  inlineData: {
    mimeType: file.mimetype,
    data: file.buffer.toString('base64'),
  },
})

const devicePrompt =
  'These are photos of the front and back of a device. If a third photo is included, it shows the device\'s software About screen (e.g. iOS Settings > General > About) — use it to pin down the exact model, storage, and version. Identify the make and model, rate its visible condition (poor, good, excellent, or new), and estimate its used resale value in USD as a low–high range.'

// Constrained decoding: Gemini can only emit JSON matching this schema.
const deviceSchema = {
  type: Type.OBJECT,
  properties: {
    make: { type: Type.STRING },
    model: { type: Type.STRING },
    condition: {
      type: Type.STRING,
      enum: ['poor', 'good', 'excellent', 'new'],
    },
    resaleValueUsd: {
      type: Type.OBJECT,
      properties: {
        low: { type: Type.NUMBER },
        high: { type: Type.NUMBER },
      },
      required: ['low', 'high'],
    },
  },
  required: ['make', 'model', 'condition', 'resaleValueUsd'],
}

app.post('/api/device', deviceUpload, async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined
  const front = files?.front?.[0]
  const back = files?.back?.[0]
  // Optional photo of the device's About screen
  const settings = files?.settings?.[0]

  if (!front || !back) {
    res.status(400).json({ error: 'front and back images are required' })
    return
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            imagePart(front),
            imagePart(back),
            ...(settings ? [imagePart(settings)] : []),
            { text: devicePrompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: deviceSchema,
      },
    })
    res.json(JSON.parse(response.text ?? '{}'))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

// ---- Preview form (auto-filled device appraisal) ----

type PhoneCondition = 'good' | 'poor' | 'excellent' | 'new'

interface DevicePreview {
  model: string
  resaleValueUsd: { low: number; high: number }
  ramGb: number
  storageGb: number
  condition: PhoneCondition
  description: string
}

const previewPrompt =
  "These are photos of the front and back of a phone or other tech device. If a third photo is included, it shows the device's software About screen (e.g. iOS Settings > General > About) — use it to pin down the exact model and storage. Identify the device, estimate its specs and used resale value, rate its visible condition, and write a short description (under 50 words) focused on the physical condition you can actually see in the photos — scratches, dents, cracked screen or glass, worn edges, missing parts. Do not include the release year."

const previewSchema = {
  type: Type.OBJECT,
  properties: {
    model: {
      type: Type.STRING,
      description: 'Make and model, e.g. "iPhone 14 Pro". No year.',
    },
    resaleValueUsd: {
      type: Type.OBJECT,
      properties: {
        low: { type: Type.NUMBER },
        high: { type: Type.NUMBER },
      },
      required: ['low', 'high'],
    },
    ramGb: { type: Type.NUMBER, description: 'Estimated RAM in GB' },
    storageGb: { type: Type.NUMBER, description: 'Estimated storage in GB' },
    condition: {
      type: Type.STRING,
      enum: ['good', 'poor', 'excellent', 'new'] satisfies PhoneCondition[],
    },
    description: {
      type: Type.STRING,
      description:
        'Under 50 words. Visible physical condition details only (e.g. cracked screen, scratches, dents).',
    },
  },
  required: ['model', 'resaleValueUsd', 'ramGb', 'storageGb', 'condition', 'description'],
}

app.post('/api/preview', deviceUpload, async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined
  const front = files?.front?.[0]
  const back = files?.back?.[0]
  const settings = files?.settings?.[0]

  if (!front || !back) {
    res.status(400).json({ error: 'front and back images are required' })
    return
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            imagePart(front),
            imagePart(back),
            ...(settings ? [imagePart(settings)] : []),
            { text: previewPrompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: previewSchema,
      },
    })
    const preview: DevicePreview = JSON.parse(response.text ?? '{}')
    res.json(preview)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
