import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { CONDITIONS } from '../types'
import { colors, radius } from '../theme'

type Props = {
  // Number of photo thumbnails to placeholder in the photo row — matches
  // however many shots were actually taken (2 or 3), not a fixed guess.
  photoCount?: number
}

// Skeleton mirroring the preview form's layout, pulsing while Gemini analyzes.
export function FormSkeleton({ photoCount = 3 }: Props) {
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

  const block = (extra: object, key?: string) => (
    <Animated.View key={key} style={[styles.block, { opacity: pulse }, extra]} />
  )

  return (
    <View>
      <View style={styles.photoGallery}>
        {Array.from({ length: photoCount }, (_, i) => (
          <View key={i} style={styles.photoCard}>
            {block({ width: '100%', aspectRatio: 1, borderRadius: radius.card })}
            {block({ width: '60%', height: 10, alignSelf: 'center' })}
          </View>
        ))}
      </View>
      {block({ width: 48, height: 12, marginTop: 16 })}
      {block({ height: 42, marginTop: 6 })}
      <View style={styles.row}>
        <View style={styles.half}>
          {block({ width: 64, height: 12, marginTop: 16 })}
          {block({ height: 42, marginTop: 6 })}
        </View>
        <View style={styles.half}>
          {block({ width: 80, height: 12, marginTop: 16 })}
          {block({ height: 42, marginTop: 6 })}
        </View>
      </View>
      {block({ width: 72, height: 12, marginTop: 16 })}
      <View style={styles.pillRow}>
        {CONDITIONS.map((c) => block({ flex: 1, height: 34, borderRadius: radius.pill }, c))}
      </View>
      {block({ width: 88, height: 12, marginTop: 16 })}
      {block({ height: 80, marginTop: 6 })}
      {block({ width: 180, height: 12, marginTop: 16 })}
      {block({ width: 150, height: 30, marginTop: 6 })}
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.line,
    borderRadius: radius.card,
  },
  photoGallery: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  photoCard: {
    flex: 1,
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
})
