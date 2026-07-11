export type Slot = 'front' | 'back' | 'settings'

export const SLOT_LABELS: Record<Slot, string> = {
  front: 'Front',
  back: 'Back',
  settings: 'About screen',
}

export type PhoneCondition = 'good' | 'poor' | 'excellent' | 'new'
export const CONDITIONS: PhoneCondition[] = ['poor', 'good', 'excellent', 'new']

export type RecommendationAction = 'fix' | 'sell' | 'tradeIn' | 'donate' | 'recycle'

export type RepairGuide = {
  title: string
  description: string
  searchQuery: string
}

export type AudRange = {
  low: number
  high: number
}

export type RepairFix = {
  title: string
  steps: string[]
  guide: RepairGuide
  estimatedDiyCostAud: AudRange
  estimatedProfessionalCostAud: AudRange
  projectedValueIncreaseAud: AudRange
}

export type RepairPlan = {
  title: string
  fixes: RepairFix[]
}

export const ACTIONS: { key: RecommendationAction; label: string }[] = [
  { key: 'fix', label: 'Repair' },
  { key: 'sell', label: 'Resell' },
  { key: 'tradeIn', label: 'Trade in' },
  { key: 'donate', label: 'Donate' },
  { key: 'recycle', label: 'Recycle' },
]

// All five blurbs are always present; `recommended` is the AI's single pick.
export type Recommendation = {
  recommended: RecommendationAction
  repairPlan: RepairPlan
} & Record<RecommendationAction, string>

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
