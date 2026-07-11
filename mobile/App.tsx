import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque'
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono'
import { ScanScreen } from './src/screens/ScanScreen'
import { PreviewSheet } from './src/screens/PreviewSheet'
import { RecommendationScreen } from './src/screens/RecommendationScreen'
import { usePhotoCapture } from './src/hooks/usePhotoCapture'
import { usePreviewForm } from './src/hooks/usePreviewForm'
import { useRecommendation } from './src/hooks/useRecommendation'
import { colors } from './src/theme'

export default function App() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  })
  const capture = usePhotoCapture()
  const previewForm = usePreviewForm()
  const recommendation = useRecommendation()

  const analyze = () => previewForm.submit(capture.photos)
  const recommend = () => {
    if (previewForm.form) recommendation.submit(previewForm.form)
  }
  const startOver = () => {
    capture.reset()
    previewForm.reset()
    recommendation.reset()
  }

  if (!fontsLoaded) return <View style={styles.container} />

  return (
    <View style={styles.container}>
      <ScanScreen capture={capture} onDone={analyze} />
      {previewForm.isOpen && !recommendation.isOpen && (
        <PreviewSheet
          state={previewForm}
          frontPhotoUri={capture.photos.front}
          onStartOver={startOver}
          onRetry={analyze}
          onContinue={recommend}
        />
      )}
      {recommendation.isOpen && previewForm.form !== null && (
        <RecommendationScreen
          state={recommendation}
          form={previewForm.form}
          onBack={recommendation.reset}
          onStartOver={startOver}
          onRetry={recommend}
        />
      )}
      <StatusBar style={recommendation.isOpen ? 'dark' : 'light'} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
})
