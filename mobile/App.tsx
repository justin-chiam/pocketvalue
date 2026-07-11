import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { ScanScreen } from './src/screens/ScanScreen'
import { PreviewSheet } from './src/screens/PreviewSheet'
import { usePhotoCapture } from './src/hooks/usePhotoCapture'
import { usePreviewForm } from './src/hooks/usePreviewForm'

export default function App() {
  const capture = usePhotoCapture()
  const previewForm = usePreviewForm()

  const analyze = () => previewForm.submit(capture.photos)
  const startOver = () => {
    capture.reset()
    previewForm.reset()
  }

  return (
    <View style={styles.container}>
      <ScanScreen capture={capture} onDone={analyze} />
      {previewForm.isOpen && (
        <PreviewSheet
          state={previewForm}
          frontPhotoUri={capture.photos.front}
          onStartOver={startOver}
          onRetry={analyze}
        />
      )}
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
})
