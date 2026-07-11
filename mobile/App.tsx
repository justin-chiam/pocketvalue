import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { StatusBar } from 'expo-status-bar'
import Constants from 'expo-constants'

type Slot = 'front' | 'back' | 'settings'

const SLOT_LABELS: Record<Slot, string> = {
  front: 'Front',
  back: 'Back',
  settings: 'About screen',
}

type PhoneCondition = 'good' | 'poor' | 'excellent' | 'new'
const CONDITIONS: PhoneCondition[] = ['new', 'excellent', 'good', 'poor']

// Editable form values, auto-filled from POST /api/preview.
// Numbers are kept as strings because they back TextInputs.
type PreviewForm = {
  model: string
  resaleLow: string
  resaleHigh: string
  ramGb: string
  storageGb: string
  condition: PhoneCondition
  description: string
}

// In Expo Go, "localhost" is the phone itself. Derive the dev machine's LAN IP
// from the Metro host that serves the JS bundle; EXPO_PUBLIC_API_URL overrides.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0]
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (devHost ? `http://${devHost}:3001` : 'http://localhost:3001')

export default function App() {
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)

  const [photos, setPhotos] = useState<Record<Slot, string | null>>({
    front: null,
    back: null,
    settings: null,
  })
  // Optional third photo (iOS Settings > General > About), offered once
  // after both required photos are in.
  const [wantSettings, setWantSettings] = useState(false)
  const [settingsPromptShown, setSettingsPromptShown] = useState(false)
  // Photo waiting for X / checkmark confirmation
  const [pendingUri, setPendingUri] = useState<string | null>(null)
  // Slot being viewed full-screen after tapping its preview box
  const [viewingSlot, setViewingSlot] = useState<Slot | null>(null)
  // Slot the next confirmed shot should replace (set by "Retake")
  const [retakeSlot, setRetakeSlot] = useState<Slot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState<PreviewForm | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!permission) {
    return <View style={styles.container} />
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>We need camera access to photograph your device</Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const targetSlot: Slot =
    retakeSlot ?? (photos.front === null ? 'front' : photos.back === null ? 'back' : 'settings')
  const bothTaken = photos.front !== null && photos.back !== null
  const canShoot =
    !bothTaken || retakeSlot !== null || (wantSettings && photos.settings === null)

  // Gemini doesn't need 12MP: cap the long edge at 1280px and recompress.
  // Cuts upload size and token count ~10x while keeping labels readable.
  const downscale = async (photo: { uri: string; width: number; height: number }) => {
    const MAX_EDGE = 1280
    if (Math.max(photo.width, photo.height) <= MAX_EDGE) return photo.uri
    const context = ImageManipulator.manipulate(photo.uri)
    context.resize(photo.width >= photo.height ? { width: MAX_EDGE } : { height: MAX_EDGE })
    const image = await context.renderAsync()
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 })
    return saved.uri
  }

  const takePicture = async () => {
    if (!cameraRef.current) return
    const photo = await cameraRef.current.takePictureAsync()
    setPendingUri(await downscale(photo))
  }

  const confirmPhoto = () => {
    if (!pendingUri) return
    const next = { ...photos, [targetSlot]: pendingUri }
    setPhotos(next)
    setPendingUri(null)
    setRetakeSlot(null)

    if (next.front && next.back && !settingsPromptShown) {
      setSettingsPromptShown(true)
      Alert.alert(
        'Is the device operational?',
        'If it powers on, you can add an optional photo of its About screen (Settings › General › About) so we can identify it more precisely.',
        [
          { text: 'Skip', style: 'cancel' },
          { text: 'Add photo', onPress: () => setWantSettings(true) },
        ],
      )
    }
  }

  const discardPhoto = () => {
    setPendingUri(null)
  }

  const startRetake = (slot: Slot) => {
    setViewingSlot(null)
    setRetakeSlot(slot)
  }

  const submit = async () => {
    if (!photos.front || !photos.back) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const form = new FormData()
      const filePart = (slot: Slot, uri: string) =>
        // React Native's FormData takes { uri, name, type } file descriptors
        ({ uri, name: `${slot}.jpg`, type: 'image/jpeg' }) as unknown as Blob
      form.append('front', filePart('front', photos.front))
      form.append('back', filePart('back', photos.back))
      if (photos.settings) {
        form.append('settings', filePart('settings', photos.settings))
      }

      const res = await fetch(`${API_URL}/api/preview`, {
        method: 'POST',
        body: form,
        // Ask both sides not to keep the socket alive; without this the
        // native HTTP stack pools connections between requests.
        headers: { Connection: 'close' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setPreview({
        model: data.model ?? '',
        resaleLow: String(data.resaleValueUsd?.low ?? ''),
        resaleHigh: String(data.resaleValueUsd?.high ?? ''),
        ramGb: String(data.ramGb ?? ''),
        storageGb: String(data.storageGb ?? ''),
        condition: data.condition ?? 'good',
        description: data.description ?? '',
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const startOver = () => {
    setPhotos({ front: null, back: null, settings: null })
    setPreview(null)
    setSubmitError(null)
    setRetakeSlot(null)
    setWantSettings(false)
    setSettingsPromptShown(false)
  }

  // Waiting on the backend / Gemini
  if (submitting) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.message}>Analyzing your device…</Text>
        <StatusBar style="light" />
      </View>
    )
  }

  // Error screen
  if (submitError) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <Text style={styles.resultTitle}>Something went wrong</Text>
          <Text style={styles.resultText}>{submitError}</Text>
        </ScrollView>
        <View style={styles.resultButtons}>
          <TouchableOpacity style={styles.grantButton} onPress={submit}>
            <Text style={styles.grantButtonText}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.grantButton} onPress={startOver}>
            <Text style={styles.grantButtonText}>Start over</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    )
  }

  // Auto-filled preview form, editable before continuing
  if (preview) {
    const set = (patch: Partial<PreviewForm>) => setPreview({ ...preview, ...patch })
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.formScroll}>
          {photos.front && <Image source={{ uri: photos.front }} style={styles.formThumb} />}

          <Text style={styles.fieldLabel}>Model</Text>
          <TextInput
            style={styles.input}
            value={preview.model}
            onChangeText={(model) => set({ model })}
          />

          <Text style={styles.fieldLabel}>Estimated resale value (USD)</Text>
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              value={preview.resaleLow}
              keyboardType="numeric"
              onChangeText={(resaleLow) => set({ resaleLow })}
            />
            <Text style={styles.rangeDash}>–</Text>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              value={preview.resaleHigh}
              keyboardType="numeric"
              onChangeText={(resaleHigh) => set({ resaleHigh })}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.inputHalf}>
              <Text style={styles.fieldLabel}>RAM (GB)</Text>
              <TextInput
                style={styles.input}
                value={preview.ramGb}
                keyboardType="numeric"
                onChangeText={(ramGb) => set({ ramGb })}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.fieldLabel}>Storage (GB)</Text>
              <TextInput
                style={styles.input}
                value={preview.storageGb}
                keyboardType="numeric"
                onChangeText={(storageGb) => set({ storageGb })}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Condition</Text>
          <View style={styles.pillRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.pill, preview.condition === c && styles.pillSelected]}
                onPress={() => set({ condition: c })}
              >
                <Text style={[styles.pillText, preview.condition === c && styles.pillTextSelected]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={preview.description}
            multiline
            onChangeText={(description) => set({ description })}
          />
        </ScrollView>
        <View style={styles.resultButtons}>
          <TouchableOpacity style={styles.grantButton} onPress={startOver}>
            <Text style={styles.grantButtonText}>Start over</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.grantButton}
            onPress={() => console.log('Preview confirmed:', preview)}
          >
            <Text style={styles.grantButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    )
  }

  // Full-screen confirmation: X to discard, checkmark to keep
  if (pendingUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: pendingUri }} style={styles.fullImage} />
        <Text style={styles.slotLabel}>{SLOT_LABELS[targetSlot]}</Text>
        <View style={styles.confirmControls}>
          <TouchableOpacity style={styles.roundButton} onPress={discardPhoto}>
            <Text style={styles.roundButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roundButton, styles.acceptButton]}
            onPress={confirmPhoto}
          >
            <Text style={styles.roundButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    )
  }

  // Full-screen viewer for a taken photo, with Retake
  if (viewingSlot && photos[viewingSlot]) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photos[viewingSlot]! }} style={styles.fullImage} />
        <Text style={styles.slotLabel}>{SLOT_LABELS[viewingSlot]}</Text>
        <View style={styles.confirmControls}>
          <TouchableOpacity style={styles.roundButton} onPress={() => setViewingSlot(null)}>
            <Text style={styles.roundButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => startRetake(viewingSlot)}
          >
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.controls}>
        {canShoot && (
          <Text style={styles.hint}>
            {retakeSlot
              ? `Retake the ${SLOT_LABELS[retakeSlot].toLowerCase()} photo`
              : targetSlot === 'front'
                ? 'Take a photo of the front'
                : targetSlot === 'back'
                  ? 'Take a photo of the back'
                  : 'Photograph Settings › General › About'}
          </Text>
        )}
        <View style={styles.previewRow}>
          {(['front', 'back', 'settings'] as Slot[]).map(
            (slot) =>
              photos[slot] && (
                <TouchableOpacity key={slot} onPress={() => setViewingSlot(slot)}>
                  <Image source={{ uri: photos[slot]! }} style={styles.previewBox} />
                </TouchableOpacity>
              ),
          )}
        </View>
        <View style={styles.shutterRow}>
          <TouchableOpacity
            style={[styles.shutterButton, !canShoot && styles.shutterDisabled]}
            onPress={takePicture}
            disabled={!canShoot}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          {bothTaken && (
            <TouchableOpacity style={styles.doneButton} onPress={submit}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  grantButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  grantButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    minHeight: 40,
  },
  previewBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
  },
  shutterRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterDisabled: {
    opacity: 0.35,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  doneButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: 60,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  slotLabel: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  confirmControls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  roundButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34c759',
  },
  roundButtonText: {
    color: '#fff',
    fontSize: 28,
  },
  retakeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 32,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultScroll: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  resultButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 48,
  },
  formScroll: {
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formThumb: {
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
    backgroundColor: '#1c1c1e',
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
  rangeDash: {
    color: '#999',
    fontSize: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
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
})
