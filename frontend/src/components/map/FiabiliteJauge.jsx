import { Info } from 'lucide-react'

export default function FiabiliteJauge({ fiabilite }) {
  if (!fiabilite) return null

  const { score, niveau, justification } = fiabilite
  const segments = Array.from({ length: 5 }, (_, i) => i < score)
  
  const raisonTexte = () => {
    const raisons = []
    
    if (score >= 4) {
      raisons.push(`${score * 2} habitants ont confirmé`)
      if (score === 5) {
        raisons.push("Vérifié par l'association hier")
      }
    } else if (score >= 2) {
      raisons.push("Plusieurs sources indépendantes")
      raisons.push("Vérifié cette semaine")
    } else if (score === 1) {
      raisons.push("Une seule source, non confirmée")
    } else {
      raisons.push("Informations non vérifiées")
      raisons.push("Source unique ou ancienne")
    }
    
    return raisons
  }

  const niveauLabel = niveau === 'élevé' ? 'Élevée' : niveau === 'moyen' ? 'Moyenne' : 'Faible'

  return (
    <div className="fiabilite-jauge">
      <div className="flex items-center gap-2 mb-2">
        <Info size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Fiabilité</h3>
        <span className="text-sm font-medium text-gray-700 ml-auto">{niveauLabel}</span>
      </div>
      
      <div
        className="flex gap-1 mb-2"
        role="img"
        aria-label={`Score de fiabilité : ${score} sur 5`}
      >
        {segments.map((filled, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full ${
              filled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      
      <div className="space-y-1">
        {raisonTexte().map((raison, index) => (
          <p key={index} className="text-sm text-gray-600 flex items-start gap-1">
            <span className="text-gray-500 mt-0.5">•</span>
            {raison}
          </p>
        ))}
        {justification && (
          <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
            {justification}
          </p>
        )}
      </div>
    </div>
  )
}
