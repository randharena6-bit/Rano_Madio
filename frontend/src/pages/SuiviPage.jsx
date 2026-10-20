import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function SuiviPage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <EmptyState
        icon={ClipboardCheck}
        titleAs="h1"
        title="Suivi des actions"
        description="Preuves et résolutions — bientôt disponibles."
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
