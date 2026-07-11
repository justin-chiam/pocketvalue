import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  ArrowSquareOutIcon,
  BookOpenTextIcon,
  MapPinLineIcon,
  WrenchIcon,
  type Icon,
} from 'phosphor-react-native'
import type { AudRange, RepairFix, RepairGuide, RepairPlan } from '../types'
import { colors, fonts, radius } from '../theme'

type Props = {
  blurb: string
  plan?: RepairPlan | LegacyRepairPlan
  model: string
  onClose: () => void
}

type LegacyRepairPlan = {
  title?: unknown
  details?: unknown
  guides?: unknown
  fixes?: unknown
  estimatedDiyCostAud?: unknown
  estimatedProfessionalCostAud?: unknown
  estimatedCostAud?: unknown
  projectedValueIncreaseAud?: unknown
}

const IFIXIT_SEARCH_URL = 'https://www.ifixit.com/Search'
const GOOGLE_MAPS_SEARCH_URL = 'https://www.google.com/maps/search/'

export function RepairScreen({ blurb, plan, model, onClose }: Props) {
  const normalizedPlan = normalizeRepairPlan(plan, blurb, model)
  const fixes = normalizedPlan.fixes
  const totalCost = {
    low: sum(fixes.map((fix) => fix.estimatedDiyCostAud.low)),
    high: sum(fixes.map((fix) => fix.estimatedProfessionalCostAud.high)),
  }
  const totalValueIncrease = collateRanges(
    fixes.map((fix) => fix.projectedValueIncreaseAud),
  )

  const openGuide = async (fix: RepairFix) => {
    const guideQuery = cleanGuideQuery(fix.guide, model, fix.title)
    const url = `${IFIXIT_SEARCH_URL}?query=${encodeURIComponent(guideQuery)}&doctype=guide`
    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('Couldn’t open the guide', `Search iFixit Guides for “${guideQuery}”.`)
    }
  }

  const openRepairers = async (fix: RepairFix) => {
    const query = `${model || 'phone'} ${fix.title} repair shops`
    const url = `${GOOGLE_MAPS_SEARCH_URL}?api=1&query=${encodeURIComponent(query)}`
    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('Couldn’t open Maps', `Search Google Maps for “${query}”.`)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close repair plan"
          hitSlop={12}
          onPress={onClose}
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <View style={styles.routePill}>
          <WrenchIcon size={15} weight="bold" color={colors.pine} />
          <Text style={styles.routePillText}>Repair plan</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{normalizedPlan.title}</Text>

        <View style={styles.fixDetails}>
          <Text style={styles.sectionTitle}>What the fix involves</Text>
          <View style={styles.fixList}>
            {fixes.map((fix, fixIndex) => (
              <View key={`${fix.title}-${fixIndex}`} style={styles.fixBlock}>
                {fixes.length > 1 && <Text style={styles.fixTitle}>{fix.title}</Text>}
                <View style={styles.steps}>
                  {fix.steps.map((step, stepIndex) => (
                    <View key={`${step}-${stepIndex}`} style={styles.stepRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.whyText}>{blurb}</Text>
        </View>

        <View style={styles.guidesSection}>
          <Text style={styles.sectionTitle}>Guides & tutorials</Text>
          <Text style={styles.sectionIntro}>
            Start with the guide that matches your experience. Parts, tools and exact steps can
            vary by model.
          </Text>
          <View style={styles.guides}>
            {fixes.map((fix, fixIndex) => (
              <View
                key={`${fix.title}-resources-${fixIndex}`}
                style={[styles.resourceGroup, fixIndex > 0 && styles.resourceGroupFollowing]}
              >
                {fixes.length > 1 && <Text style={styles.resourceFixTitle}>{fix.title}</Text>}
                <RepairResource
                  source="IFIXIT GUIDE"
                  title={fix.guide.title}
                  description={fix.guide.description}
                  costLabel="EST. DIY COST"
                  cost={fix.estimatedDiyCostAud}
                  icon={BookOpenTextIcon}
                  accessibilityLabel={`Search iFixit Guides for ${fix.guide.title}`}
                  onPress={() => void openGuide(fix)}
                />
                <RepairResource
                  source="GOOGLE MAPS"
                  title="Search for professional repairers around you"
                  description={`Compare nearby repairers, reviews and quotes for ${fix.title.toLowerCase()}.`}
                  costLabel="EST. PROFESSIONAL COST"
                  cost={fix.estimatedProfessionalCostAud}
                  icon={MapPinLineIcon}
                  accessibilityLabel={`Search Google Maps for professional ${fix.title.toLowerCase()} repairers nearby`}
                  onPress={() => void openRepairers(fix)}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.valueBox}>
          <Text style={styles.valueBoxTitle}>Cost & value</Text>
          <View style={styles.valueRow}>
            <ValueMetric
              label="ESTIMATED COST"
              value={formatRange(totalCost, 'Quote needed')}
            />
            <View style={styles.valueDivider} />
            <ValueMetric
              label="VALUE INCREASE"
              value={`+${formatRange(totalValueIncrease)}`}
            />
          </View>
          <Text style={styles.valueNote}>
            Combined AUD estimates for all suggested fixes. Get a repair quote before deciding;
            resale value depends on the quality of the completed work.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

type RepairResourceProps = {
  source: string
  title: string
  description: string
  costLabel: string
  cost: AudRange
  icon: Icon
  accessibilityLabel: string
  onPress: () => void
}

function RepairResource({
  source,
  title,
  description,
  costLabel,
  cost,
  icon: ResourceIcon,
  accessibilityLabel,
  onPress,
}: RepairResourceProps) {
  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.72}
      style={styles.guide}
      onPress={onPress}
    >
      <View style={styles.guideIcon}>
        <ResourceIcon size={21} weight="light" color={colors.pine} />
      </View>
      <View style={styles.guideCopy}>
        <Text style={styles.guideSource}>{source}</Text>
        <Text style={styles.guideTitle}>{title}</Text>
        <Text style={styles.guideDescription}>{description}</Text>
        <View style={styles.guideCostRow}>
          <Text style={styles.guideCostLabel}>{costLabel}</Text>
          <Text style={styles.guideCost}>{formatRange(cost, 'Quote needed', ' AUD')}</Text>
        </View>
      </View>
      <ArrowSquareOutIcon size={19} weight="bold" color={colors.pine} />
    </TouchableOpacity>
  )
}

function ValueMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.valueMetric}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

function formatRange(range: AudRange, emptyLabel?: string, suffix = '') {
  const low = Math.max(0, Math.round(range.low))
  const high = Math.max(low, Math.round(range.high))
  if (low === 0 && high === 0 && emptyLabel) return emptyLabel
  return `${low === high ? `$${low}` : `$${low}–$${high}`}${suffix}`
}

function collateRanges(ranges: AudRange[]) {
  return {
    low: sum(ranges.map((range) => range.low)),
    high: sum(ranges.map((range) => range.high)),
  }
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0)
}

function cleanGuideQuery(guide: RepairGuide, model: string, repairTitle: string) {
  const cleaned = guide.searchQuery
    .replace(/\bifixit\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || `${model} ${repairTitle}`.trim()
}

function normalizeRepairPlan(
  plan: Props['plan'],
  blurb: string,
  model: string,
): RepairPlan {
  const source: LegacyRepairPlan = plan ?? {}
  const planTitle = textOrFallback(source.title, `Repair ${model || 'your device'}`)
  const suppliedFixes = Array.isArray(source.fixes) ? source.fixes.slice(0, 3) : []

  if (suppliedFixes.length > 0) {
    return {
      title: planTitle,
      fixes: suppliedFixes.map((fix, index) =>
        normalizeFix(fix, `${planTitle} ${index + 1}`, model, blurb),
      ),
    }
  }

  const legacyGuides = Array.isArray(source.guides) ? source.guides : []
  return {
    title: planTitle,
    fixes: [
      normalizeFix(
        {
          title: planTitle,
          steps: stepsFromText(source.details, blurb),
          guide: legacyGuides[0],
          estimatedDiyCostAud: source.estimatedDiyCostAud ?? source.estimatedCostAud,
          estimatedProfessionalCostAud:
            source.estimatedProfessionalCostAud ?? source.estimatedCostAud,
          projectedValueIncreaseAud: source.projectedValueIncreaseAud,
        },
        planTitle,
        model,
        blurb,
      ),
    ],
  }
}

function normalizeFix(value: unknown, fallbackTitle: string, model: string, blurb: string): RepairFix {
  const source = isRecord(value) ? value : {}
  const title = textOrFallback(source.title, fallbackTitle)
  const steps = Array.isArray(source.steps)
    ? source.steps
        .filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
        .slice(0, 5)
    : []

  return {
    title,
    steps: steps.length ? steps : stepsFromText(undefined, blurb),
    guide: normalizeGuide(source.guide, model, title),
    estimatedDiyCostAud: normalizeRange(source.estimatedDiyCostAud),
    estimatedProfessionalCostAud: normalizeRange(source.estimatedProfessionalCostAud),
    projectedValueIncreaseAud: normalizeRange(source.projectedValueIncreaseAud),
  }
}

function normalizeGuide(value: unknown, model: string, repairTitle: string): RepairGuide {
  const source = isRecord(value) ? value : {}
  return {
    title: textOrFallback(source.title, `${repairTitle} guide`),
    description: textOrFallback(
      source.description,
      'Find a model-specific walkthrough, required tools and replacement parts.',
    ),
    searchQuery: textOrFallback(source.searchQuery, `${model} ${repairTitle}`),
  }
}

function normalizeRange(value: unknown): AudRange {
  const source = isRecord(value) ? value : {}
  const low = finiteNumber(source.low)
  const high = finiteNumber(source.high)
  return { low: Math.max(0, low), high: Math.max(low, high, 0) }
}

function stepsFromText(value: unknown, fallback: string) {
  const text = textOrFallback(value, fallback)
  const sentences = text.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []
  const steps = sentences.map((sentence) => sentence.trim()).filter(Boolean).slice(0, 5)
  return steps.length
    ? steps
    : ['Confirm the fault with a professional diagnostic before ordering parts.']
}

function textOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function finiteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  topBar: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  closeText: {
    color: colors.pine,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
  },
  routePill: {
    minHeight: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.pineSoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routePillText: {
    color: colors.pine,
    fontFamily: fonts.displaySemiBold,
    fontSize: 13,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.6,
  },
  fixDetails: {
    marginTop: 25,
    paddingBottom: 26,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 19,
    lineHeight: 24,
  },
  fixList: {
    gap: 20,
    marginTop: 10,
  },
  fixBlock: {
    gap: 9,
  },
  fixTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  steps: {
    gap: 9,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.pine,
    marginTop: 8,
  },
  stepText: {
    flex: 1,
    color: colors.body,
    fontSize: 16,
    lineHeight: 23,
  },
  whyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  guidesSection: {
    marginTop: 26,
  },
  sectionIntro: {
    color: colors.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
  },
  guides: {
    marginTop: 16,
  },
  resourceGroup: {
    gap: 12,
  },
  resourceGroupFollowing: {
    marginTop: 26,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  resourceFixTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  guide: {
    minHeight: 118,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guideIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.pineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCopy: {
    flex: 1,
  },
  guideSource: {
    color: colors.pine,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  guideTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  guideDescription: {
    color: colors.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  guideCostRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  guideCostLabel: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  guideCost: {
    color: colors.ink,
    fontFamily: fonts.monoMedium,
    fontSize: 12,
  },
  valueBox: {
    marginTop: 28,
    borderRadius: radius.card,
    backgroundColor: colors.pineSoft,
    padding: 18,
  },
  valueBoxTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 18,
  },
  valueMetric: {
    flex: 1,
  },
  valueDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.pineBody,
    marginHorizontal: 14,
  },
  valueLabel: {
    color: colors.pine,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  value: {
    color: colors.ink,
    fontFamily: fonts.monoMedium,
    fontSize: 20,
    lineHeight: 27,
    marginTop: 5,
  },
  valueNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 17,
  },
})
