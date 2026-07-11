import { HandHeartIcon } from 'phosphor-react-native'
import { RecommendationDetail } from '../components/RecommendationDetail'

type Props = { blurb: string; onClose: () => void }

export function DonateScreen({ blurb, onClose }: Props) {
  return <RecommendationDetail title="Donate" blurb={blurb} icon={HandHeartIcon} onClose={onClose} />
}
