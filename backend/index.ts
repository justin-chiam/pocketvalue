import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { GoogleGenAI } from '@google/genai'

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

interface ChatRequestBody {
  prompt?: string
}

app.post(
  '/api/chat',
  async (req: Request<unknown, unknown, ChatRequestBody>, res: Response) => {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' })
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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
