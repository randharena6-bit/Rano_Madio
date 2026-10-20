import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReportForm from '../components/forms/ReportForm'
import ReportConfirmation from '../components/forms/ReportConfirmation'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

export default function ReportFormPage() {
  const navigate = useNavigate()
  const [sent, setSent] = useState(null)

  return (
    <div className="page page--form">
      <div className="page-actions" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/')}
        >
          Carte
        </Button>
        <h1 style={{ margin: 0, fontSize: 20 }}>Signaler un problème</h1>
        <Badge tone="brand">Voix du quartier</Badge>
      </div>

      {sent ? (
        <ReportConfirmation
          report={sent}
          onNew={() => setSent(null)}
          onViewMap={() => navigate(`/?focus=${sent.id}`)}
        />
      ) : (
        <ReportForm onSuccess={setSent} />
      )}
    </div>
  )
}
