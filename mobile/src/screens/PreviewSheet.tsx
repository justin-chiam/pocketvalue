import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native'
import { AppButton } from '../components/AppButton'
import { BottomSheet } from '../components/BottomSheet'
import { FormSkeleton } from '../components/FormSkeleton'
import type { PreviewFormState } from '../hooks/usePreviewForm'
import { CONDITIONS, SLOT_LABELS, type PreviewForm, type Slot } from '../types'
import { colors, fonts, radius } from '../theme'

const ERROR_COLOR = colors.danger
const PLACEHOLDER_COLOR = colors.muted

type RequiredField = 'model' | 'ram' | 'storage' | 'battery' | 'description'

type Props = {
  state: PreviewFormState
  photos: Record<Slot, string | null>
  onStartOver: () => void
  onRetry: () => void
  onContinue: () => void
}

// The preview view: an iOS-style card over the camera showing a skeleton
// while Gemini analyzes, then the auto-filled editable form.
export function PreviewSheet({ state, photos, onStartOver, onRetry, onContinue }: Props) {
  const { submitting, form, error, estimating, setForm } = state
  const photoEntries = (Object.entries(photos) as [Slot, string | null][]).filter(
    (entry): entry is [Slot, string] => entry[1] !== null,
  )
  const selectedConditionIndex = form ? CONDITIONS.indexOf(form.condition) : 0
  const [attemptedContinue, setAttemptedContinue] = useState(false)
  const [focusedField, setFocusedField] = useState<RequiredField | null>(null)
  const [isDraggingCondition, setIsDraggingCondition] = useState(false)
  const conditionThumb = useRef(new Animated.Value(selectedConditionIndex)).current
  const trackWidthRef = useRef(0)

  // Keep the thumb in sync when the condition changes from outside a drag
  // (initial load, or re-fetched values) — but not mid-gesture.
  useEffect(() => {
    if (isDraggingCondition) return
    Animated.spring(conditionThumb, {
      toValue: selectedConditionIndex,
      useNativeDriver: false,
      bounciness: 6,
    }).start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConditionIndex, isDraggingCondition])

  const indexFromTouchX = (x: number) => {
    const width = trackWidthRef.current
    if (width <= 0) return selectedConditionIndex
    const inset = width * 0.125
    const usable = width - inset * 2
    const clamped = Math.min(Math.max(x, inset), width - inset)
    return ((clamped - inset) / usable) * (CONDITIONS.length - 1)
  }

  const updateConditionFromTouch = (evt: GestureResponderEvent) => {
    const rawIndex = indexFromTouchX(evt.nativeEvent.locationX)
    conditionThumb.setValue(rawIndex)
    const nearestCondition = CONDITIONS[Math.round(rawIndex)]
    if (form && nearestCondition !== form.condition) {
      setForm({ condition: nearestCondition })
    }
  }

  // Recreated each render (cheap) so its handlers always close over the
  // latest `form` — caching this in a ref would freeze them to stale state.
  const conditionPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsDraggingCondition(true)
      updateConditionFromTouch(evt)
    },
    onPanResponderMove: (evt) => {
      updateConditionFromTouch(evt)
    },
    onPanResponderRelease: () => setIsDraggingCondition(false),
    onPanResponderTerminate: () => setIsDraggingCondition(false),
  })
  const conditionThumbLeft = conditionThumb.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['12.5%', '37.5%', '62.5%', '87.5%'],
  })
  const conditionTrackActiveWidth = conditionThumb.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['0%', '25%', '50%', '75%'],
  })
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
            <AppButton label="Start over" onPress={onStartOver} variant="secondary" />
          </View>
        </View>
      ) : form !== null ? (
        <>
          <Text style={styles.sheetTitle}>Device report</Text>
          <ScrollView contentContainerStyle={styles.scroll}>
            {photoEntries.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Photos</Text>
                <View style={styles.photoGallery}>
                  {photoEntries.map(([slot, uri]) => (
                    <View key={slot} style={styles.photoCard}>
                      <Image source={{ uri }} style={styles.thumb} />
                      <Text style={styles.photoLabel}>{SLOT_LABELS[slot]}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

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
            <View
              style={styles.conditionSlider}
              onLayout={(e) => {
                trackWidthRef.current = e.nativeEvent.layout.width
              }}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Condition"
              accessibilityValue={{
                text: form.condition.charAt(0).toUpperCase() + form.condition.slice(1),
              }}
              onAccessibilityAction={(e) => {
                const step = e.nativeEvent.actionName === 'increment' ? 1 : -1
                const nextIndex = Math.min(
                  Math.max(selectedConditionIndex + step, 0),
                  CONDITIONS.length - 1,
                )
                setForm({ condition: CONDITIONS[nextIndex] })
              }}
              {...conditionPanResponder.panHandlers}
            >
              <View style={styles.conditionTrack} />
              <Animated.View
                style={[styles.conditionTrackActive, { width: conditionTrackActiveWidth }]}
              />
              <View style={styles.conditionStops} pointerEvents="none">
                {CONDITIONS.map((condition) => {
                  const selected = form.condition === condition
                  const label = condition.charAt(0).toUpperCase() + condition.slice(1)

                  return (
                    <View key={condition} style={styles.conditionStop}>
                      <View style={[styles.conditionLabelPill, selected && styles.conditionLabelPillSelected]}>
                        <Text
                          style={[
                            styles.conditionLabel,
                            selected && styles.conditionLabelSelected,
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </View>
              <Animated.View
                pointerEvents="none"
                style={[styles.conditionThumb, { left: conditionThumbLeft }]}
              />
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
              {estimating && <ActivityIndicator size="small" color={colors.pine} />}
            </View>
          </ScrollView>
          <View style={styles.buttons}>
            <AppButton label="Start over" onPress={onStartOver} variant="secondary" />
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
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
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
  photoLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 12,
    textAlign: 'center',
  },
  fieldLabel: {
    color: colors.muted,
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
  conditionSlider: {
    position: 'relative',
    minHeight: 58,
  },
  conditionTrack: {
    position: 'absolute',
    top: 10,
    left: '12.5%',
    right: '12.5%',
    height: 2,
    backgroundColor: colors.line,
  },
  conditionTrackActive: {
    position: 'absolute',
    top: 10,
    left: '12.5%',
    height: 2,
    backgroundColor: colors.pine,
  },
  conditionThumb: {
    position: 'absolute',
    top: -2,
    width: 26,
    height: 26,
    marginLeft: -13,
    borderRadius: radius.pill,
    backgroundColor: colors.pine,
  },
  conditionStops: {
    flexDirection: 'row',
  },
  conditionStop: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
  },
  conditionLabelPill: {
    marginTop: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  conditionLabelPillSelected: {
    backgroundColor: colors.pineSoft,
  },
  conditionLabel: {
    color: colors.body,
    fontFamily: fonts.displayMedium,
    fontSize: 12,
  },
  conditionLabelSelected: {
    color: colors.pine,
    fontFamily: fonts.displaySemiBold,
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
