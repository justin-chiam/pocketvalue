import { WrenchIcon } from 'phosphor-react-native'
import { RecommendationDetail } from '../components/RecommendationDetail'

type Props = { blurb: string; onClose: () => void }

export function RepairScreen({ blurb, onClose }: Props) {
  return <RecommendationDetail title="Repair" blurb={blurb} icon={WrenchIcon} onClose={onClose} />
}
