import ipadTradeIn from '../data/ipad_tradein.json'
import iphoneTradeIn from '../data/iphone_tradein.json'
import macTradeIn from '../data/mac_tradein.json'
import type { PreviewForm } from './types'

const FALLBACK_VALUE_AUD = 100

type TradeInDevice = 'MacBook' | 'iPhone' | 'iPad'
type TradeInRow = { device: string; trade_in_up_to: number }

const TABLES: Record<TradeInDevice, TradeInRow[]> = {
  MacBook: macTradeIn,
  iPhone: iphoneTradeIn,
  iPad: ipadTradeIn,
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function detectDevice(model: string): TradeInDevice | null {
  const normalized = normalize(model)
  if (normalized.includes('macbook')) return 'MacBook'
  if (normalized.includes('iphone')) return 'iPhone'
  if (normalized.includes('ipad')) return 'iPad'
  return null
}

export function getTradeInEstimate(form: PreviewForm) {
  const device = detectDevice(form.model)
  const model = normalize(form.model)

  if (!device || !model) {
    return { valueAud: FALLBACK_VALUE_AUD, matchedModel: null, device: null }
  }

  // Prefer an exact model match, then support the extra generation/configuration
  // detail commonly returned by the preview form (for example, "iPhone 16 Pro
  // Max 256GB") by matching the most specific table row contained in the model.
  const rows = TABLES[device]
  const match =
    rows.find((row) => normalize(row.device) === model) ??
    [...rows]
      .sort((a, b) => normalize(b.device).length - normalize(a.device).length)
      .find((row) => model.includes(normalize(row.device)))

  return {
    valueAud: match?.trade_in_up_to ?? FALLBACK_VALUE_AUD,
    matchedModel: match?.device ?? null,
    device,
  }
}
