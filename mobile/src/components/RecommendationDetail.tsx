import type { ReactNode } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { XIcon, type Icon } from 'phosphor-react-native'
import { colors, fonts } from '../theme'

type Props = {
  title: string
  blurb: string
  icon: Icon
  onClose: () => void
  // Optional extra content rendered below the blurb (e.g. donate locations).
  children?: ReactNode
}

export function RecommendationDetail({ title, blurb, icon: ActionIcon, onClose, children }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>PocketValue</Text>
        <TouchableOpacity
          style={styles.close}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <XIcon size={20} weight="bold" color={colors.ink} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ActionIcon size={38} weight="light" color={colors.pine} />
        <Text style={styles.label}>Route breakdown</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.divider} />
        <Text style={styles.body}>{blurb}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  topBar: {
    minHeight: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  wordmark: {
    color: colors.ink,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 64,
    alignItems: 'flex-start',
  },
  label: {
    color: colors.pine,
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 26,
    marginBottom: 10,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 28,
  },
  body: {
    color: colors.body,
    fontSize: 17,
    lineHeight: 28,
  },
})
