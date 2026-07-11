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
  'These are photos of the front and back of a device. If a third photo is included, it shows the device\'s software About screen (e.g. iOS Settings > General > About) — use it to pin down the exact model, storage, and version. Identify the make and model, rate its visible condition (poor, good, excellent, or new), and estimate its used resale value in Australian dollars (AUD) as a low–high range.'

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
    resaleValueAud: {
      type: Type.OBJECT,
      properties: {
        low: { type: Type.NUMBER },
        high: { type: Type.NUMBER },
      },
      required: ['low', 'high'],
    },
  },
  required: ['make', 'model', 'condition', 'resaleValueAud'],
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
  deviceDetected: boolean
  model: string
  ramGb?: number
  storageGb?: number
  condition: PhoneCondition
  description: string
}

const previewPrompt =
  "These are photos submitted by a user who claims they show the front and back of a phone or other tech device. If a third photo is included, it shows the device's software About screen (e.g. iOS Settings > General > About) — use it to pin down the exact model and storage. First, check whether a phone or tech device is actually, clearly visible in the photos. If no such device is visible — e.g. the photos show a person, a room, an unrelated object, are blank, blurry, or otherwise don't contain a device — set deviceDetected to false and leave the other fields as zero/empty placeholders; do not guess or invent a device. Only if a device is clearly visible, set deviceDetected to true and identify the device, estimate its specs, rate its visible condition, and write a short description (under 50 words) of the physical condition you can actually see in the photos. Only report damage (scratches, dents, cracked screen or glass, worn edges, missing parts) that is clearly and unambiguously visible — screen glare, reflections, smudges, and photo artefacts are not damage. If you are not certain a flaw is real, leave it out. A device with no visible flaws should get a description saying it looks clean with no visible damage; never invent or exaggerate wear to seem thorough. Do not include the release year."

const previewSchema = {
  type: Type.OBJECT,
  properties: {
    deviceDetected: {
      type: Type.BOOLEAN,
      description:
        'True only if a phone or tech device is clearly visible in the photos. False if not — do not hallucinate a device.',
    },
    model: {
      type: Type.STRING,
      description: 'Make and model, e.g. "iPhone 14 Pro". No year.',
    },
    ramGb: { type: Type.NUMBER, description: 'Estimated RAM in GB' },
    storageGb: { type: Type.NUMBER, description: 'Estimated storage in GB' },
    condition: {
      type: Type.STRING,
      enum: ['poor', 'good', 'excellent', 'new'] satisfies PhoneCondition[],
    },
    description: {
      type: Type.STRING,
      description:
        'Under 50 words. Visible physical condition details only (e.g. cracked screen, scratches, dents).',
    },
  },
  required: ['deviceDetected', 'model', 'ramGb', 'storageGb', 'condition', 'description'],
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
    if (!preview.deviceDetected) {
      res.status(422).json({ error: "Couldn't find a device in that photo. Try again with it clearly in frame." })
      return
    }
    // RAM and storage can't be read off exterior photos — only trust them
    // when the About-screen photo was provided; otherwise the user fills
    // them in. No resale estimate here either: battery health is never
    // visible in photos, and the client only requests an estimate once
    // RAM, storage and battery are all known.
    if (!settings) {
      delete preview.ramGb
      delete preview.storageGb
    }
    res.json(preview)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

// Re-estimate resale value from (possibly user-edited) form fields.
const estimateSchema = {
  type: Type.OBJECT,
  properties: {
    low: { type: Type.NUMBER },
    high: { type: Type.NUMBER },
  },
  required: ['low', 'high'],
}

// Gemini 2.5 can't combine the googleSearch tool with responseSchema in one
// request (Gemini 3-only preview feature), so grounding is a separate
// plain-text call whose summary feeds the schema-constrained estimate call.
const searchMarketContext = async (deviceFacts: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Search for current used/second-hand prices in Australia for this device: ${deviceFacts}. Check channels like eBay Australia, Facebook Marketplace, Gumtree, CeX, and trade-in programs. Reply with at most 5 short bullet points of observed AUD prices (channel, price, storage/condition variant), 80 words total maximum. No introduction, prose, or caveats.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 300,
      },
    })
    console.log('[market context]', response.text)
    return response.text ?? null
  } catch (err) {
    console.error('Market search grounding failed, falling back to ungrounded estimate:', err)
    return null
  }
}

const estimateResale = async (
  deviceFacts: string,
  marketContext: string | null,
): Promise<{ low: number; high: number }> => {
  const prompt = `Estimate the current used resale value in Australian dollars (AUD), as a low–high range, for this device: ${deviceFacts}. A significantly degraded battery (well below 100%) should reduce the resale value even if the rest of the device is in good condition.${
    marketContext
      ? `\n\nCurrent Australian market data from Google Search:\n${marketContext}\n\nBase the range primarily on these observed prices rather than prior knowledge, adjusted for the device's specific condition and battery health.`
      : ''
  }`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: estimateSchema,
      thinkingConfig: { thinkingBudget: 0 },
    },
  })
  return JSON.parse(response.text ?? '{}')
}

app.post('/api/estimate', async (req, res) => {
  const { model, ramGb, storageGb, batteryPct, condition } = req.body ?? {}
  const ram = Number(ramGb)
  const storage = Number(storageGb)
  const battery = Number(batteryPct)

  if (
    typeof model !== 'string' ||
    !model.trim() ||
    !Number.isFinite(ram) ||
    !Number.isFinite(storage) ||
    !Number.isFinite(battery)
  ) {
    res.status(400).json({
      error: 'Not enough information for an estimate — model, RAM, storage and battery health are all required.',
    })
    return
  }

  const facts = `${model.trim()}, ${ram} GB RAM, ${storage} GB storage${typeof condition === 'string' && condition ? `, in ${condition} condition` : ''}, battery health at ${battery}% of original capacity`

  try {
    const marketContext = await searchMarketContext(facts)
    res.json(await estimateResale(facts, marketContext))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

// ---- Donate locations: grounded search for nearby tech-donation spots ----

const donateLocationsSchema = {
  type: Type.OBJECT,
  properties: {
    intro: {
      type: Type.STRING,
      description:
        'One sentence of the form "Based on your location, here\'s where you can donate your <device>."',
    },
    locations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          address: { type: Type.STRING, description: 'Street address including suburb' },
          note: {
            type: Type.STRING,
            description: 'Under 20 words: what tech they accept or how donating works there.',
          },
        },
        required: ['name', 'address', 'note'],
      },
    },
  },
  required: ['intro', 'locations'],
}

app.post('/api/donate-locations', async (req, res) => {
  const { model, location } = req.body ?? {}

  if (
    typeof model !== 'string' ||
    !model.trim() ||
    typeof location !== 'string' ||
    !location.trim()
  ) {
    res.status(400).json({ error: 'model and location (strings) are required' })
    return
  }

  try {
    // Same two-step dance as estimation: grounded search first (can't be
    // combined with a response schema on Gemini 2.5), then extraction.
    const search = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Search for places near ${location.trim()} where someone can donate used tech such as a ${model.trim()} — charities, op shops, community reuse programs, and e-waste donation drop-off points. List up to 6 real places, each with its name, street address, and a few words on what tech they accept. No prose introduction or caveats.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 600,
      },
    })
    if (!search.text) throw new Error('empty donation-spot search result')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `A user near ${location.trim()} wants to donate their ${model.trim()}. Using only the real places in the search findings below, write an intro sentence of the form "Based on your location, here's where you can donate your ${model.trim()}." and list the donation places.\n\nSearch findings:\n${search.text}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: donateLocationsSchema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    const parsed = JSON.parse(response.text ?? '{}') as {
      intro?: string
      locations?: { name: string; address: string; note: string }[]
    }
    // Build Maps links ourselves rather than asking Gemini for URLs it
    // could hallucinate; this URL form opens the Google Maps app when installed.
    const locations = (parsed.locations ?? []).slice(0, 6).map((loc) => ({
      ...loc,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${loc.name} ${loc.address}`,
      )}`,
    }))
    res.json({ intro: parsed.intro ?? '', locations })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

const recycleLocationsSchema = {
  type: Type.OBJECT,
  properties: {
    intro: {
      type: Type.STRING,
      description:
        'One sentence of the form "Based on your location, here\'s where you can recycle your <device>."',
    },
    locations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          address: { type: Type.STRING, description: 'Street address including suburb' },
          note: {
            type: Type.STRING,
            description: 'Under 20 words: what tech they accept or how recycling e-waste works there.',
          },
        },
        required: ['name', 'address', 'note'],
      },
    },
  },
  required: ['intro', 'locations'],
}

app.post('/api/recycle-locations', async (req, res) => {
  const { model, location } = req.body ?? {}

  if (
    typeof model !== 'string' ||
    !model.trim() ||
    typeof location !== 'string' ||
    !location.trim()
  ) {
    res.status(400).json({ error: 'model and location (strings) are required' })
    return
  }

  try {
    // Same two-step dance as estimation: grounded search first (can't be
    // combined with a response schema on Gemini 2.5), then extraction.
    const search = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Search for e-waste recycling centres near ${location.trim()} that accept used tech such as a ${model.trim()}. List up to 6 real locations, each with its name, street address, and a few words on the electronic items they accept. No prose introduction or caveats.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 600,
      },
    })
    if (!search.text) throw new Error('empty recycling-spot search result')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `A user near ${location.trim()} wants to recycle their ${model.trim()}. Using only the real e-waste recycling centres in the search findings below, write an intro sentence of the form "Based on your location, here's where you can recycle your ${model.trim()}." and list the recycling centres.\n\nSearch findings:\n${search.text}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: recycleLocationsSchema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    const parsed = JSON.parse(response.text ?? '{}') as {
      intro?: string
      locations?: { name: string; address: string; note: string }[]
    }
    // Build Maps links ourselves rather than asking Gemini for URLs it
    // could hallucinate; this URL form opens the Google Maps app when installed.
    const locations = (parsed.locations ?? []).slice(0, 6).map((loc) => ({
      ...loc,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${loc.name} ${loc.address}`,
      )}`,
    }))
    res.json({ intro: parsed.intro ?? '', locations })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

// ---- Recommendation: fix / sell / trade in / donate / recycle ----

type RecommendationAction = 'fix' | 'sell' | 'tradeIn' | 'donate' | 'recycle'
const RECOMMENDATION_ACTIONS: RecommendationAction[] = [
  'fix',
  'sell',
  'tradeIn',
  'donate',
  'recycle',
]

// One blurb per action, always all five, plus the single recommended pick.
const recommendSchema = {
  type: Type.OBJECT,
  properties: {
    recommended: { type: Type.STRING, enum: RECOMMENDATION_ACTIONS },
    fix: {
      type: Type.STRING,
      description:
        '2–3 sentences (80 words max) on repairing this device: what likely needs fixing and whether the cost is worth it.',
    },
    repairPlan: {
      type: Type.OBJECT,
      description: 'A practical, device-specific repair plan. All money values are AUD.',
      properties: {
        title: {
          type: Type.STRING,
          description:
            'A concise plan title naming all worthwhile fixes, e.g. "Replace the battery and screen".',
        },
        fixes: {
          type: Type.ARRAY,
          description:
            'One to three distinct, evidence-based fixes. Include multiple fixes when separate faults are supported.',
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Concise name for this individual fix, e.g. "Replace the battery".',
              },
              steps: {
                type: Type.ARRAY,
                description:
                  'Three to five concise bullet points explaining difficulty, key steps, and when to use a professional.',
                items: { type: Type.STRING },
              },
              guide: {
                type: Type.OBJECT,
                description: 'One relevant repair-guide search for this exact device and fix.',
                properties: {
                  title: { type: Type.STRING, description: 'Specific guide title.' },
                  description: {
                    type: Type.STRING,
                    description: 'One sentence on what the tutorial covers and who it suits.',
                  },
                  searchQuery: {
                    type: Type.STRING,
                    description:
                      'A concise search query containing only the exact device model and repair. Never include the word iFixit.',
                  },
                },
                required: ['title', 'description', 'searchQuery'],
              },
              estimatedDiyCostAud: {
                type: Type.OBJECT,
                description: 'Estimated total parts and basic tools cost for this DIY repair.',
                properties: {
                  low: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                },
                required: ['low', 'high'],
              },
              estimatedProfessionalCostAud: {
                type: Type.OBJECT,
                description:
                  'Estimated total price from a reputable independent professional for this repair.',
                properties: {
                  low: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                },
                required: ['low', 'high'],
              },
              projectedValueIncreaseAud: {
                type: Type.OBJECT,
                description:
                  'Conservative, non-overlapping contribution this fix makes to private resale value.',
                properties: {
                  low: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                },
                required: ['low', 'high'],
              },
            },
            required: [
              'title',
              'steps',
              'guide',
              'estimatedDiyCostAud',
              'estimatedProfessionalCostAud',
              'projectedValueIncreaseAud',
            ],
          },
        },
      },
      required: ['title', 'fixes'],
    },
    sell: {
      type: Type.STRING,
      description: '2–3 sentences (80 words max) on selling it privately: expected price, effort, best channels.',
    },
    tradeIn: {
      type: Type.STRING,
      description: '2–3 sentences (80 words max) on trading it in: typical trade-in value vs selling privately.',
    },
    donate: {
      type: Type.STRING,
      description: '2–3 sentences (80 words max) on donating it: who could still get good use out of it.',
    },
    recycle: {
      type: Type.STRING,
      description: '2–3 sentences (80 words max) on recycling it responsibly and when that is the right call.',
    },
  },
  required: ['recommended', ...RECOMMENDATION_ACTIONS, 'repairPlan'],
}

app.post('/api/recommend', async (req, res) => {
  const { model, ramGb, storageGb, batteryPct, condition, description, resaleLow, resaleHigh } =
    req.body ?? {}

  if (typeof model !== 'string' || !model.trim()) {
    res.status(400).json({ error: 'model is required' })
    return
  }

  const battery = Number(batteryPct)

  const facts = [
    `Device: ${model.trim()}`,
    Number.isFinite(Number(ramGb)) ? `${Number(ramGb)} GB RAM` : null,
    Number.isFinite(Number(storageGb)) ? `${Number(storageGb)} GB storage` : null,
    Number.isFinite(battery) ? `battery health: ${battery}% of original capacity` : null,
    typeof condition === 'string' && condition ? `condition: ${condition}` : null,
    typeof description === 'string' && description ? `condition notes: ${description}` : null,
    Number.isFinite(Number(resaleLow)) && Number.isFinite(Number(resaleHigh))
      ? `estimated resale value: A$${Number(resaleLow)}–${Number(resaleHigh)}`
      : null,
  ]
    .filter(Boolean)
    .join('; ')

  const prompt = `You are advising the owner of a used device in Australia on what to do with it. ${facts}. For each of the five actions — fix, sell, trade in, donate, recycle — write 2–3 sentences (80 words max) tailored to this specific device and its condition, explaining what that path looks like and its trade-offs (use AUD for any amounts). Also produce a structured repairPlan with one fix for every distinct, worthwhile fault supported by the supplied evidence, up to three fixes. For example, if the battery is degraded and the screen is broken, include separate battery and screen fixes. Each fix needs three to five concise steps, one device-specific guide search, separate realistic cost ranges for DIY parts/tools and an independent professional repairer, and a conservative projected resale-value contribution that does not overlap with the contributions of other fixes. The guide searchQuery must contain only the device model and repair terms; never add "iFixit" to the query. Do not invent faults. If there is no clear defect, return one professional diagnostic/maintenance fix with appropriately conservative values. If the battery health is significantly degraded (well below 100%), include battery replacement as its own fix and factor it into which action you recommend overall. Then pick the single action you would recommend for this device.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: recommendSchema,
      },
    })
    res.json(JSON.parse(response.text ?? '{}'))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})

// Node closes idle keep-alive sockets after 5s by default, but iOS pools
// them for ~60s — a POST sent down a socket the server just closed dies
// with "Network request failed" (POSTs are never auto-retried). Keep
// sockets alive longer than any client pool holds them.
server.keepAliveTimeout = 75_000
// Must exceed keepAliveTimeout, or Node can reset sockets mid-request.
server.headersTimeout = 80_000
