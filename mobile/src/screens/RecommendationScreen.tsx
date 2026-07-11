import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import {
  ArrowsLeftRightIcon,
  CaretLeftIcon,
  HandHeartIcon,
  RecycleIcon,
  TagIcon,
  WrenchIcon,
  type Icon,
} from 'phosphor-react-native'
import { AppButton } from '../components/AppButton'
import type { RecommendationState } from '../hooks/useRecommendation'
import { getTradeInEstimate } from '../tradeIn'
import { ACTIONS, type PreviewForm, type RecommendationAction } from '../types'
import { colors, fonts, radius } from '../theme'
import { RepairScreen } from './RepairScreen'
import { SellScreen } from './SellScreen'
import { DonateScreen } from './DonateScreen'
import { RecycleScreen } from './RecycleScreen'

const PAGE_WIDTH = Dimensions.get('window').width

type Props = {
  state: RecommendationState
  onBack: () => void
  onStartOver: () => void
  onRetry: () => void
  form: PreviewForm
}

type ExpandableAction = Exclude<RecommendationAction, 'tradeIn'>

const ACTION_ICONS: Record<RecommendationAction, Icon> = {
  fix: WrenchIcon,
  sell: TagIcon,
  tradeIn: ArrowsLeftRightIcon,
  donate: HandHeartIcon,
  recycle: RecycleIcon,
}

// The recommendation view: all five options (fix / sell / trade in / donate /
// recycle) as swipeable cards, with the AI's pick badged and shown first.
export function RecommendationScreen({ state, onBack, onStartOver, onRetry, form }: Props) {
  const { loading, data, error } = state
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<ExpandableAction | null>(null)
  const tradeInEstimate = getTradeInEstimate(form)

  const recommendedIndex = data ? ACTIONS.findIndex((a) => a.key === data.recommended) : 0

  // Keep the page indicator aligned with the recommended card when data arrives.
  useEffect(() => {
    if (!data) return
    setPage(recommendedIndex)
  }, [data, recommendedIndex])

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH))
  }

  const confirmStartOver = () => {
    Alert.alert(
      'Are you sure you want to start over?',
      'Your captured photos and current recommendation will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start over', style: 'destructive', onPress: onStartOver },
      ],
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.back}
            onPress={onBack}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <CaretLeftIcon size={22} weight="bold" color={colors.pine} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.startOver}
            onPress={confirmStartOver}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Start over"
          >
            <Text style={styles.startOverText}>Start over</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>What should you do with it?</Text>
      </View>

      {loading ? (
        <CardSkeleton />
      ) : error !== null ? (
        <View style={styles.page}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Something went wrong</Text>
            <Text style={styles.blurb}>{error}</Text>
            <View style={styles.cardButtons}>
              <AppButton label="Try again" onPress={onRetry} />
            </View>
          </View>
        </View>
      ) : data !== null ? (
        <>
          <FlatList
            data={ACTIONS}
            initialScrollIndex={recommendedIndex}
            keyExtractor={(a) => a.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            getItemLayout={(_, index) => ({
              length: PAGE_WIDTH,
              offset: PAGE_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => {
              const ActionIcon = ACTION_ICONS[item.key]

              return (
                <View style={styles.page}>
                  <TouchableOpacity
                    activeOpacity={item.key === 'tradeIn' ? 1 : 0.85}
                    style={[styles.card, item.key === data.recommended && styles.cardRecommended]}
                    disabled={item.key === 'tradeIn'}
                    onPress={() => {
                      if (item.key !== 'tradeIn') setExpanded(item.key)
                    }}
                  >
                    <ScrollView
                      contentContainerStyle={styles.cardContent}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {item.key === data.recommended && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Recommended</Text>
                        </View>
                      )}
                      <ActionIcon
                        size={28}
                        weight="light"
                        color={colors.pine}
                        style={styles.actionIcon}
                      />
                      <Text style={styles.cardTitle}>{item.label}</Text>
                      {item.key === 'tradeIn' ? (
                        <View style={styles.tradeInContent}>
                          <Text style={styles.tradeInModel}>{form.model || 'Detected device'}</Text>
                          <View style={styles.tradeInEstimate}>
                            <Text style={styles.tradeInLabel}>Estimated trade-in value</Text>
                            <Text style={styles.tradeInValue}>${tradeInEstimate.valueAud} AUD</Text>
                            <Text style={styles.tradeInNote}>
                              {tradeInEstimate.matchedModel
                                ? `Based on the ${tradeInEstimate.matchedModel} Apple trade-in value.`
                                : 'Temporary estimate while this device is not yet supported.'}
                            </Text>
                          </View>
                          <Text style={styles.tradeInBlurb}>{data.tradeIn}</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.blurb}>{data[item.key]}</Text>
                          <View style={styles.expandRow}>
                            <Text style={styles.expandRowText}>View full breakdown</Text>
                            <Text style={styles.expandRowChevron}>›</Text>
                          </View>
                        </>
                      )}
                    </ScrollView>
                  </TouchableOpacity>
                </View>
              )
            }}
          />
          <View style={styles.dots}>
            <View style={[styles.dot, page === 0 && styles.dotActive]} />
            <View style={[styles.dot, page === 1 && styles.dotActive]} />
            <View style={[styles.dot, page === 2 && styles.dotActive]} />
            <View style={[styles.dot, page === 3 && styles.dotActive]} />
            <View style={[styles.dot, page === 4 && styles.dotActive]} />
          </View>
        </>
      ) : null}

      {data && (
        <Modal
          visible={expanded !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setExpanded(null)}
        >
          {expanded !== null && data && (
            <DetailScreen
              action={expanded}
              blurb={data[expanded]}
              onClose={() => setExpanded(null)}
            />
          )}
        </Modal>
      )}
    </View>
  )
}

type DetailScreenProps = { blurb: string; onClose: () => void }

function DetailScreen({
  action,
  blurb,
  onClose,
}: DetailScreenProps & { action: ExpandableAction }) {
  switch (action) {
    case 'fix':
      return <RepairScreen blurb={blurb} onClose={onClose} />
    case 'sell':
      return <SellScreen blurb={blurb} onClose={onClose} />
    case 'donate':
      return <DonateScreen blurb={blurb} onClose={onClose} />
    case 'recycle':
      return <RecycleScreen blurb={blurb} onClose={onClose} />
  }
}

// Pulsing placeholder card while Gemini decides.
function CardSkeleton() {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 650,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const block = (extra: object) => (
    <Animated.View style={[styles.skeletonBlock, { opacity: pulse }, extra]} />
  )

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        {block({ width: 56, height: 56, borderRadius: 28, marginBottom: 16 })}
        {block({ width: 120, height: 24, marginBottom: 16 })}
        {block({ height: 14, marginBottom: 8 })}
        {block({ height: 14, marginBottom: 8 })}
        {block({ width: 200, height: 14 })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.paper,
    paddingTop: 56,
    paddingBottom: 48,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  navRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: -8,
    paddingHorizontal: 8,
  },
  backText: {
    color: colors.pine,
    fontFamily: fonts.displayMedium,
    fontSize: 17,
  },
  startOver: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
  },
  startOverText: {
    color: colors.ctaText,
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 25,
    letterSpacing: -0.4,
    textAlign: 'left',
    marginTop: 12,
  },
  page: {
    width: PAGE_WIDTH,
    paddingHorizontal: 24,
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
  },
  cardRecommended: {
    borderColor: colors.pine,
    borderWidth: 2,
    backgroundColor: colors.pineSoft,
  },
  cardContent: {
    flexGrow: 1,
  },
  badge: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderWidth: 2,
    borderColor: colors.pine,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: {
    color: colors.pine,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  actionIcon: {
    marginBottom: 22,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 23,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  blurb: {
    flex: 1,
    color: colors.body,
    fontSize: 16,
    lineHeight: 25,
  },
  tradeInContent: {
    flex: 1,
  },
  tradeInModel: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 18,
  },
  tradeInEstimate: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingVertical: 18,
    marginBottom: 18,
  },
  tradeInLabel: {
    color: colors.muted,
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  tradeInValue: {
    color: colors.ink,
    fontFamily: fonts.monoMedium,
    fontSize: 34,
    marginBottom: 7,
  },
  tradeInNote: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  tradeInBlurb: {
    color: colors.body,
    fontSize: 16,
    lineHeight: 24,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    marginTop: 16,
    paddingTop: 16,
  },
  expandRowText: {
    color: colors.pine,
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
  },
  expandRowChevron: {
    color: colors.pine,
    fontFamily: fonts.displayBold,
    fontSize: 17,
  },
  cardButtons: {
    flexDirection: 'row',
    paddingTop: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotActive: {
    backgroundColor: colors.pine,
  },
  skeletonBlock: {
    backgroundColor: colors.line,
    borderRadius: radius.card,
  },
})
