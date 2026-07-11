import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { AppButton } from '../components/AppButton'
import { BottomSheet } from '../components/BottomSheet'
import { FormSkeleton } from '../components/FormSkeleton'
import type { PreviewFormState } from '../hooks/usePreviewForm'
import { CONDITIONS } from '../types'
import { colors, fonts, radius } from '../theme'

type Props = {
  state: PreviewFormState
  frontPhotoUri: string | null
  onStartOver: () => void
  onRetry: () => void
  onContinue: () => void
}

// The preview view: an iOS-style card over the camera showing a skeleton
// while Gemini analyzes, then the auto-filled editable form.
export function PreviewSheet({ state, frontPhotoUri, onStartOver, onRetry, onContinue }: Props) {
  const { submitting, form, error, estimating, setForm } = state

  return (
    <BottomSheet>
      {submitting ? (
        <FormSkeleton />
      ) : error !== null ? (
        <View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.buttons}>
            <AppButton label="Try again" onPress={onRetry} />
            <AppButton label="Start over" onPress={onStartOver} variant="secondary" />
          </View>
        </View>
      ) : form !== null ? (
        <>
          <Text style={styles.sheetTitle}>Device report</Text>
          <ScrollView contentContainerStyle={styles.scroll}>
            {frontPhotoUri && <Image source={{ uri: frontPhotoUri }} style={styles.thumb} />}

            <Text style={styles.fieldLabel}>Model</Text>
            <TextInput
              style={styles.input}
              value={form.model}
              onChangeText={(model) => setForm({ model })}
            />

            <View style={styles.rowInputs}>
              <View style={styles.inputHalf}>
                <Text style={styles.fieldLabel}>RAM (GB)</Text>
                <TextInput
                  style={styles.input}
                  value={form.ramGb}
                  keyboardType="numeric"
                  onChangeText={(ramGb) => setForm({ ramGb })}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.fieldLabel}>Storage (GB)</Text>
                <TextInput
                  style={styles.input}
                  value={form.storageGb}
                  keyboardType="numeric"
                  onChangeText={(storageGb) => setForm({ storageGb })}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Battery health (%)</Text>
            <TextInput
              style={styles.input}
              value={form.batteryPct}
              keyboardType="numeric"
              onChangeText={(batteryPct) => setForm({ batteryPct })}
            />

            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.pillRow}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, form.condition === c && styles.pillSelected]}
                  onPress={() => setForm({ condition: c })}
                >
                  <Text style={[styles.pillText, form.condition === c && styles.pillTextSelected]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={form.description}
              multiline
              onChangeText={(description) => setForm({ description })}
            />

            <Text style={styles.fieldLabel}>Estimated resale value (AUD)</Text>
            {/* AI-estimated, not editable — re-estimated when the fields above change */}
            <View style={styles.resaleRow}>
              <Text style={styles.resaleValue}>
                ${form.resaleLow} – ${form.resaleHigh}
              </Text>
              {estimating && <ActivityIndicator size="small" color={colors.pine} />}
            </View>
          </ScrollView>
          <View style={styles.buttons}>
            <AppButton label="Start over" onPress={onStartOver} variant="secondary" />
            <AppButton label="Continue" onPress={onContinue} />
          </View>
        </>
      ) : null}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 12,
  },
  sheetTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 26,
    letterSpacing: -0.4,
    marginTop: 8,
    marginBottom: 8,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignSelf: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    color: colors.muted,
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: colors.pine,
    borderColor: colors.pine,
  },
  pillText: {
    color: colors.body,
    fontFamily: fonts.displayMedium,
    fontSize: 14,
  },
  pillTextSelected: {
    color: colors.ctaText,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  resaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resaleValue: {
    color: colors.ink,
    fontFamily: fonts.monoMedium,
    fontSize: 24,
  },
  errorTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    marginBottom: 16,
  },
  errorText: {
    color: colors.body,
    fontSize: 16,
    lineHeight: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
})
