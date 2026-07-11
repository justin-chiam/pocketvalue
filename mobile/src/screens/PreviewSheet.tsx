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
            <AppButton label="Start over" onPress={onStartOver} />
          </View>
        </View>
      ) : form !== null ? (
        <>
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
              {estimating && <ActivityIndicator size="small" color="#999" />}
            </View>
          </ScrollView>
          <View style={styles.buttons}>
            <AppButton label="Start over" onPress={onStartOver} />
            <AppButton label="Continue" onPress={onContinue} />
          </View>
        </>
      ) : null}
    </BottomSheet>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
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
