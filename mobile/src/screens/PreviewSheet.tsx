import { useState } from 'react'
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
import { CONDITIONS, type PreviewForm } from '../types'

const ERROR_COLOR = '#ff453a'
const PLACEHOLDER_COLOR = '#a1a1a6'

type RequiredField = 'model' | 'ram' | 'storage' | 'battery' | 'description'

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
  const [attemptedContinue, setAttemptedContinue] = useState(false)
  const [focusedField, setFocusedField] = useState<RequiredField | null>(null)
  const showModelError =
    attemptedContinue &&
    focusedField !== 'model' &&
    form !== null &&
    !isRequiredTextValid(form.model)
  const showRamError =
    attemptedContinue &&
    focusedField !== 'ram' &&
    form !== null &&
    !isPositiveNumberValid(form.ramGb)
  const showStorageError =
    attemptedContinue &&
    focusedField !== 'storage' &&
    form !== null &&
    !isPositiveNumberValid(form.storageGb)
  const showBatteryError =
    attemptedContinue &&
    focusedField !== 'battery' &&
    form !== null &&
    !isBatteryHealthValid(form.batteryPct)
  const showDescriptionError =
    attemptedContinue &&
    focusedField !== 'description' &&
    form !== null &&
    !isRequiredTextValid(form.description)

  const requiredPlaceholder = (field: RequiredField) =>
    focusedField === field ? '' : 'Required field'

  const continueWithValidation = () => {
    if (!form || !isFormValid(form)) {
      setAttemptedContinue(true)
      return
    }
    onContinue()
  }

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
            <AppButton label="Start over" onPress={onStartOver} />
          </View>
        </View>
      ) : form !== null ? (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            {frontPhotoUri && <Image source={{ uri: frontPhotoUri }} style={styles.thumb} />}

            <Text style={styles.fieldLabel}>Model</Text>
            <TextInput
              style={[
                styles.input,
                showModelError && styles.inputError,
                showModelError && styles.inputErrorText,
              ]}
              value={form.model}
              placeholder={requiredPlaceholder('model')}
              placeholderTextColor={showModelError ? ERROR_COLOR : PLACEHOLDER_COLOR}
              accessibilityLabel="Device model, required"
              onFocus={() => setFocusedField('model')}
              onBlur={() => setFocusedField(null)}
              onChangeText={(model) => setForm({ model })}
            />

            <View style={styles.rowInputs}>
              <View style={styles.inputHalf}>
                <Text style={styles.fieldLabel}>RAM (GB)</Text>
                <TextInput
                  style={[
                    styles.input,
                    showRamError && styles.inputError,
                    showRamError && styles.inputErrorText,
                  ]}
                  value={form.ramGb}
                  placeholder={requiredPlaceholder('ram')}
                  placeholderTextColor={showRamError ? ERROR_COLOR : PLACEHOLDER_COLOR}
                  keyboardType="numeric"
                  accessibilityLabel="RAM in gigabytes, required"
                  onFocus={() => setFocusedField('ram')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(ramGb) => setForm({ ramGb })}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.fieldLabel}>Storage (GB)</Text>
                <TextInput
                  style={[
                    styles.input,
                    showStorageError && styles.inputError,
                    showStorageError && styles.inputErrorText,
                  ]}
                  value={form.storageGb}
                  placeholder={requiredPlaceholder('storage')}
                  placeholderTextColor={showStorageError ? ERROR_COLOR : PLACEHOLDER_COLOR}
                  keyboardType="numeric"
                  accessibilityLabel="Storage in gigabytes, required"
                  onFocus={() => setFocusedField('storage')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(storageGb) => setForm({ storageGb })}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Battery health (%)</Text>
            <TextInput
              style={[
                styles.input,
                showBatteryError && styles.inputError,
                showBatteryError && styles.inputErrorText,
              ]}
              value={form.batteryPct}
              placeholder={requiredPlaceholder('battery')}
              placeholderTextColor={showBatteryError ? ERROR_COLOR : PLACEHOLDER_COLOR}
              keyboardType="numeric"
              maxLength={3}
              accessibilityLabel="Battery health percentage, required"
              onFocus={() => setFocusedField('battery')}
              onBlur={() => setFocusedField(null)}
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
              style={[
                styles.input,
                styles.descriptionInput,
                showDescriptionError && styles.inputError,
                showDescriptionError && styles.inputErrorText,
              ]}
              value={form.description}
              placeholder={requiredPlaceholder('description')}
              placeholderTextColor={showDescriptionError ? ERROR_COLOR : PLACEHOLDER_COLOR}
              multiline
              accessibilityLabel="Device description, required"
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              onChangeText={(description) => setForm({ description })}
            />

            <Text style={styles.fieldLabel}>Estimated resale value (AUD)</Text>
            {/* AI-estimated, not editable — re-estimated when the fields above change */}
            <View style={styles.resaleRow}>
              <Text style={styles.resaleValue}>
                ${form.resaleLow} – ${form.resaleHigh}
              </Text>
              {estimating && <ActivityIndicator size="small" color="#999" />}
            </View>
          </ScrollView>
          <View style={styles.buttons}>
            <AppButton label="Start over" onPress={onStartOver} />
            <AppButton label="Continue" onPress={continueWithValidation} />
          </View>
        </>
      ) : null}
    </BottomSheet>
  )
}

function isFormValid(form: PreviewForm) {
  return (
    isRequiredTextValid(form.model) &&
    isPositiveNumberValid(form.ramGb) &&
    isPositiveNumberValid(form.storageGb) &&
    isBatteryHealthValid(form.batteryPct) &&
    isRequiredTextValid(form.description)
  )
}

function isRequiredTextValid(value: string) {
  return value.trim() !== ''
}

function isPositiveNumberValid(value: string) {
  const number = Number(value)
  return value.trim() !== '' && Number.isFinite(number) && number > 0
}

function isBatteryHealthValid(value: string) {
  const batteryHealth = Number(value)
  return (
    value.trim() !== '' &&
    Number.isFinite(batteryHealth) &&
    batteryHealth >= 1 &&
    batteryHealth <= 100
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 8,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    alignSelf: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    color: '#999',
    fontSize: 13,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2c2c2e',
    color: '#fff',
    fontSize: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: ERROR_COLOR,
  },
  inputErrorText: {
    color: ERROR_COLOR,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
  },
  pillSelected: {
    backgroundColor: '#fff',
  },
  pillText: {
    color: '#fff',
    fontSize: 14,
  },
  pillTextSelected: {
    color: '#000',
    fontWeight: '600',
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
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 20,
  },
})
