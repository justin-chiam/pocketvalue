export type Slot = 'front' | 'back' | 'settings'

export const SLOT_LABELS: Record<Slot, string> = {
  front: 'Front',
  back: 'Back',
  settings: 'About screen',
}

export type PhoneCondition = 'good' | 'poor' | 'excellent' | 'new'
export const CONDITIONS: PhoneCondition[] = ['new', 'excellent', 'good', 'poor']

export type RecommendationAction = 'fix' | 'sell' | 'tradeIn' | 'donate' | 'recycle'

export const ACTIONS: { key: RecommendationAction; label: string; emoji: string }[] = [
  { key: 'fix', label: 'Fix', emoji: '🔧' },
  { key: 'sell', label: 'Sell', emoji: '💸' },
  { key: 'tradeIn', label: 'Trade in', emoji: '🔁' },
  { key: 'donate', label: 'Donate', emoji: '🎁' },
  { key: 'recycle', label: 'Recycle', emoji: '♻️' },
]

// All five blurbs are always present; `recommended` is the AI's single pick.
export type Recommendation = { recommended: RecommendationAction } & Record<
  RecommendationAction,
  string
>

// Editable form values, auto-filled from POST /api/preview.
// Numbers are kept as strings because they back TextInputs.
export type PreviewForm = {
  model: string
  resaleLow: string
  resaleHigh: string
  ramGb: string
  storageGb: string
  batteryPct: string
  condition: PhoneCondition
  description: string
}
