import { RecycleIcon } from 'phosphor-react-native'
import { RecommendationDetail } from '../components/RecommendationDetail'

type Props = { blurb: string; onClose: () => void }

export function RecycleScreen({ blurb, onClose }: Props) {
  return <RecommendationDetail title="Recycle" blurb={blurb} icon={RecycleIcon} onClose={onClose} />
}
