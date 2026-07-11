import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { CONDITIONS } from '../types'

// Skeleton mirroring the preview form's layout, pulsing while Gemini analyzes.
export function FormSkeleton() {
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

  const block = (extra: object, key?: string) => (
    <Animated.View key={key} style={[styles.block, { opacity: pulse }, extra]} />
  )

  return (
    <View>
      {block({ width: 88, height: 88, borderRadius: 12, alignSelf: 'center', marginBottom: 8 })}
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
        {CONDITIONS.map((c) => block({ width: 72, height: 34, borderRadius: 16 }, c))}
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
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
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
