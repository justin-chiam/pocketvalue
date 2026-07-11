import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { colors, fonts, radius } from '../theme'

type Props = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

export function AppButton({ label, onPress, variant = 'primary' }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'secondary' && styles.buttonSecondary]}
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
    >
      <Text style={[styles.label, variant === 'secondary' && styles.labelSecondary]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    backgroundColor: colors.pine,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: {
    color: colors.ctaText,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
  },
  labelSecondary: {
    color: colors.ink,
  },
})
