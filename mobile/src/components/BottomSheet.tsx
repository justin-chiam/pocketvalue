import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'

// iOS-style bottom sheet: dimmed backdrop fades in while the card
// springs up from below the screen.
export function BottomSheet({ children }: { children: ReactNode }) {
  const translateY = useRef(new Animated.Value(600)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 22,
        stiffness: 240,
        useNativeDriver: true,
      }),
    ]).start()
  }, [translateY, backdropOpacity])

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetContainer}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.grabber} />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 34,
    maxHeight: '88%',
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#48484a',
    alignSelf: 'center',
    marginBottom: 4,
  },
})
