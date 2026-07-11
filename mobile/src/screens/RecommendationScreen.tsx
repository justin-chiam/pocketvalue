import { useEffect, useRef, useState, type ReactElement } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { AppButton } from '../components/AppButton'
import type { RecommendationState } from '../hooks/useRecommendation'
import { ACTIONS, Recommendation, type RecommendationAction } from '../types'
import { RepairScreen } from './RepairScreen'
import { SellScreen } from './SellScreen'
import { TradeInScreen } from './TradeInScreen'
import { DonateScreen } from './DonateScreen'
import { RecycleScreen } from './RecycleScreen'

const PAGE_WIDTH = Dimensions.get('window').width

type Props = {
  state: RecommendationState
  onBack: () => void
  onStartOver: () => void
  onRetry: () => void
}

// The recommendation view: all five options (fix / sell / trade in / donate /
// recycle) as swipeable cards, with the AI's pick badged and shown first.
export function RecommendationScreen({ state, onBack, onStartOver, onRetry }: Props) {
  const { loading, data, error } = state
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<RecommendationAction | null>(null)
  const listRef = useRef<FlatList>(null)

  const recommendedIndex = data ? ACTIONS.findIndex((a) => a.key === data.recommended) : 0

  // Land on the recommended card once data arrives.
  useEffect(() => {
    if (!data) return
    setPage(recommendedIndex)
    // The list may not have laid out yet on the same frame.
    requestAnimationFrame(() =>
      listRef.current?.scrollToIndex({ index: recommendedIndex, animated: false }),
    )
  }, [data, recommendedIndex])

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH))
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What should you do with it?</Text>

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
            ref={listRef}
            data={ACTIONS}
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
            renderItem={({ item }) => (
              <View style={styles.page}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.card, item.key === data.recommended && styles.cardRecommended]}
                  onPress={() => setExpanded(item.key)}
                >
                  {item.key === data.recommended && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>✨ Recommended</Text>
                    </View>
                  )}
                  <View style={styles.cardHeader}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                    <Text style={styles.cardTitle}>{item.label}</Text>
                  </View>
                  <Text style={styles.blurb} numberOfLines={5}>
                    {data[item.key as keyof Recommendation]}
                  </Text>
                  <View style={styles.expandRow}>
                    <Text style={styles.expandRowText}>View full breakdown</Text>
                    <Text style={styles.expandRowChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.dots}>
            {ACTIONS.map((a, i) => (
              <View key={a.key} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.buttons}>
        <AppButton label="Back" onPress={onBack} />
        <AppButton label="Start over" onPress={onStartOver} />
      </View>

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

const DETAIL_SCREENS: Record<RecommendationAction, (props: DetailScreenProps) => ReactElement> = {
  fix: RepairScreen,
  sell: SellScreen,
  tradeIn: TradeInScreen,
  donate: DonateScreen,
  recycle: RecycleScreen,
}

function DetailScreen({
  action,
  blurb,
  onClose,
}: DetailScreenProps & { action: RecommendationAction }) {
  const Screen = DETAIL_SCREENS[action]
  return <Screen blurb={blurb} onClose={onClose} />
}

// Pulsing placeholder card while Gemini decides.
function CardSkeleton() {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
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
    backgroundColor: '#000',
    paddingTop: 84,
    paddingBottom: 48,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  page: {
    width: PAGE_WIDTH,
    paddingHorizontal: 24,
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    padding: 24,
  },
  cardRecommended: {
    borderWidth: 1,
    borderColor: '#34c759',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#34c759',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  blurb: {
    flex: 1,
    color: '#ddd',
    fontSize: 16,
    lineHeight: 24,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    marginTop: 16,
    paddingTop: 16,
  },
  expandRowText: {
    color: '#0a84ff',
    fontSize: 15,
    fontWeight: '600',
  },
  expandRowChevron: {
    color: '#0a84ff',
    fontSize: 17,
    fontWeight: '700',
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
    backgroundColor: '#48484a',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 20,
  },
  skeletonBlock: {
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
  },
})
