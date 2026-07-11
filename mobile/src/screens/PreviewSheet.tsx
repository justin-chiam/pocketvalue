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
import { InfoIcon } from 'phosphor-react-native'
import { AppButton, DisabledAppButton } from '../components/AppButton'
import { BottomSheet } from '../components/BottomSheet'
import { FormSkeleton } from '../components/FormSkeleton'
import type { PreviewFormState } from '../hooks/usePreviewForm'
import { CONDITIONS, SLOT_LABELS, type PreviewForm, type Slot } from '../types'
import { colors, fonts, radius } from '../theme'

const ERROR_COLOR = colors.danger
const PLACEHOLDER_COLOR = colors.muted
// The slider track is inset by half a stop cell on each side so the end
// stops sit centred in their cells (also mirrored in indexFromTouchX).
const TRACK_INSET = `${50 / CONDITIONS.length}%` as const

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
    // Track is inset by half a stop cell on each side so the end stops sit
    // centred in their cells (must match the styles' left/right insets).
    const inset = width * (0.5 / CONDITIONS.length)
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
  const stopIndices = CONDITIONS.map((_, i) => i)
  const conditionThumbLeft = conditionThumb.interpolate({
    inputRange: stopIndices,
    outputRange: CONDITIONS.map((_, i) => `${((i + 0.5) / CONDITIONS.length) * 100}%`),
  })
  // Percentage of conditionTrackActiveMask's own width (the inset span),
  // not of the full slider — the mask is what carries the border radius now.
  const conditionTrackActiveWidth = conditionThumb.interpolate({
    inputRange: stopIndices,
    outputRange: CONDITIONS.map((_, i) => `${(i / (CONDITIONS.length - 1)) * 100}%`),
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

  const formIsValid = form !== null && isFormValid(form)
  const hasEstimation = form?.resaleLow !== '' && form?.resaleHigh !== ''

  return (
    <BottomSheet>
      {submitting ? (
        <FormSkeleton photoCount={photoEntries.length} />
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
              <View style={styles.conditionTrackActiveMask}>
                <Animated.View
                  style={[styles.conditionTrackActiveFill, { width: conditionTrackActiveWidth }]}
                />
              </View>
              <View style={styles.conditionTicks} pointerEvents="none">
                {CONDITIONS.map((condition) => (
                  <View key={condition} style={styles.conditionTickCell}>
                    <View style={styles.conditionTick} />
                  </View>
                ))}
              </View>
              <View style={styles.conditionStops} pointerEvents="none">
                {CONDITIONS.map((condition) => {
                  const selected = form.condition === condition
                  const label = condition.charAt(0).toUpperCase() + condition.slice(1)

                  return (
                    <View key={condition} style={styles.conditionStop}>
                      <View style={styles.conditionLabelPill}>
                        <View
                          style={[styles.conditionLabelPillBg, { opacity: selected ? 1 : 0 }]}
                        />
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
            {form.resaleLow !== '' && form.resaleHigh !== '' ? (
              <View style={styles.resaleRow}>
                <Text style={styles.resaleValue}>
                  ${form.resaleLow}-${form.resaleHigh}
                </Text>
                {estimating && <ActivityIndicator size="small" color={colors.pine} />}
              </View>
            ) : (
              <View style={styles.resaleCallout}>
                {estimating ? (
                  <ActivityIndicator size="small" color={colors.pine} />
                ) : (
                  <InfoIcon size={20} color={colors.pine} />
                )}
                <Text style={styles.resaleCalloutText}>
                  Not enough info yet. Fill in RAM, storage and battery health to get an
                  estimate.
                </Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.buttons}>
            <AppButton label="Start over" onPress={onStartOver} variant="secondary" />
            {!formIsValid ? (
              <DisabledAppButton label="Continue" disabled={false} onPress={continueWithValidation} />
            ) : estimating || !hasEstimation ? (
              <DisabledAppButton label="Estimating" disabled={true} onPress={() => {}} />
            ) : (
              <AppButton label="Continue" onPress={continueWithValidation} />
            )}
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
    left: TRACK_INSET,
    right: TRACK_INSET,
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
  },
  // Static size/position — carries the border radius + clip. Animating width
  // and borderRadius on the same view is an RN/Android bug where the rounded
  // corners reset to square mid-animation; the fill inside stays a plain
  // rectangle and gets clipped by this fixed mask instead.
  conditionTrackActiveMask: {
    position: 'absolute',
    top: 10,
    left: TRACK_INSET,
    right: TRACK_INSET,
    height: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  conditionTrackActiveFill: {
    height: '100%',
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
  conditionTicks: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  conditionTickCell: {
    flex: 1,
    alignItems: 'center',
  },
  conditionTick: {
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: colors.line,
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
  },
  // The backdrop is a separate always-mounted view toggled via opacity only:
  // changing a view's backgroundColor mid-drag rebuilds its Android background
  // drawable and drops the borderRadius, but opacity never touches the
  // drawable, so the radius survives.
  conditionLabelPillBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
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
  resaleCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.pineSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.pineBody,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resaleCalloutText: {
    flex: 1,
    color: colors.pine,
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    lineHeight: 20,
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
