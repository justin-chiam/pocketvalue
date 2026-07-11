import Constants from 'expo-constants'
import type { PhoneCondition, PreviewForm, Recommendation, Slot } from './types'

// In Expo Go, "localhost" is the phone itself. Derive the dev machine's LAN IP
// from the Metro host that serves the JS bundle; EXPO_PUBLIC_API_URL overrides.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0]
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (devHost ? `http://${devHost}:3001` : 'http://localhost:3001')

// A request that dies on a stale pooled socket ("Network request failed")
// fails before reaching the server, so one retry on a fresh socket is safe.
const postWithRetry = async (url: string, init: RequestInit) => {
  try {
    return await fetch(url, init)
  } catch {
    return await fetch(url, init)
  }
}

const parseOrThrow = async (res: Response) => {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

export type PreviewResponse = {
  model?: string
  resaleValueAud?: { low?: number; high?: number }
  ramGb?: number
  storageGb?: number
  condition?: PhoneCondition
  description?: string
}

export async function requestPreview(photos: {
  front: string
  back: string
  settings: string | null
}): Promise<PreviewResponse> {
  const form = new FormData()
  const filePart = (slot: Slot, uri: string) =>
    // React Native's FormData takes { uri, name, type } file descriptors
    ({ uri, name: `${slot}.jpg`, type: 'image/jpeg' }) as unknown as Blob
  form.append('front', filePart('front', photos.front))
  form.append('back', filePart('back', photos.back))
  if (photos.settings) {
    form.append('settings', filePart('settings', photos.settings))
  }

  const res = await postWithRetry(`${API_URL}/api/preview`, { method: 'POST', body: form })
  return parseOrThrow(res)
}

export async function requestEstimate(input: {
  model: string
  ramGb: number
  storageGb: number
  batteryPct: number
  condition: PhoneCondition
}): Promise<{ low: number; high: number }> {
  const res = await postWithRetry(`${API_URL}/api/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseOrThrow(res)
}

export type DonateLocation = {
  name: string
  address: string
  note: string
  mapsUrl: string
}

export type RecycleLocation = {
  name: string
  address: string
  note: string
  mapsUrl: string
}


export async function requestDonateLocations(input: {
  model: string
  location: string
}): Promise<{ intro: string; locations: DonateLocation[] }> {
  const res = await postWithRetry(`${API_URL}/api/donate-locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseOrThrow(res)
}

export async function requestRecyclingLocations(input: {
  model: string
  location: string
}): Promise<{ intro: string; locations: RecycleLocation[] }> {
  const res = await postWithRetry(`${API_URL}/api/recycle-locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseOrThrow(res)
}

export async function requestRecommendation(form: PreviewForm): Promise<Recommendation> {
  const res = await postWithRetry(`${API_URL}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: form.model,
      ramGb: Number(form.ramGb),
      storageGb: Number(form.storageGb),
      batteryPct: Number(form.batteryPct),
      condition: form.condition,
      description: form.description,
      resaleLow: Number(form.resaleLow),
      resaleHigh: Number(form.resaleHigh),
    }),
  })
  return parseOrThrow(res)
}
