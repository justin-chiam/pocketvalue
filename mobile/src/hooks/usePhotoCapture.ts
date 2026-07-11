import { useRef, useState } from 'react'
import { Alert } from 'react-native'
import { CameraView } from 'expo-camera'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import type { Slot } from '../types'

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

// State machine for the scan flow: two required photos (front/back), an
// optional About-screen photo, per-shot confirmation, and retakes.
export function usePhotoCapture() {
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

  const targetSlot: Slot =
    retakeSlot ?? (photos.front === null ? 'front' : photos.back === null ? 'back' : 'settings')
  const bothTaken = photos.front !== null && photos.back !== null
  const canShoot = !bothTaken || retakeSlot !== null || (wantSettings && photos.settings === null)

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

  const reset = () => {
    setPhotos({ front: null, back: null, settings: null })
    setPendingUri(null)
    setViewingSlot(null)
    setRetakeSlot(null)
    setWantSettings(false)
    setSettingsPromptShown(false)
  }

  return {
    cameraRef,
    photos,
    pendingUri,
    viewingSlot,
    setViewingSlot,
    retakeSlot,
    targetSlot,
    bothTaken,
    canShoot,
    takePicture,
    confirmPhoto,
    discardPhoto,
    startRetake,
    reset,
  }
}

export type PhotoCapture = ReturnType<typeof usePhotoCapture>
