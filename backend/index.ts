import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { GoogleGenAI } from '@google/genai'

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

app.post(
  '/api/device',
  upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined
    const front = files?.front?.[0]
    const back = files?.back?.[0]

    if (!front || !back) {
      res.status(400).json({ error: 'front and back images are required' })
      return
    }

    const imagePart = (file: Express.Multer.File) => ({
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64'),
      },
    })

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              imagePart(front),
              imagePart(back),
              {
                text: 'These are photos of the front and back of a device. Identify the make and model, describe its visible condition, and estimate its resale value.',
              },
            ],
          },
        ],
      })
      res.json({ text: response.text })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Gemini request failed' })
    }
  },
)

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
