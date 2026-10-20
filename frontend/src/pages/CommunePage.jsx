import { ArrowLeft, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function CommunePage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <EmptyState
        icon={Building2}
        titleAs="h1"
        title="Commune & Fokontany"
        description="Tableau de bord CUA — bientôt disponible."
        action={(
          <div className="page-actions">
            <Badge tone="brand">Phase 3</Badge>
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate('/')}
            >
              Retour à la carte
            </Button>
          </div>
        )}
      />
    </div>
  )
}
