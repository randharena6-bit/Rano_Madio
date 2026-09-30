Recommandations de conception pour RanoMadio Map
1. Architecture technique recommandée
Stack technologique (hackathon-friendly)
Frontend:     React + TypeScript + Vite + Leaflet/MapLibre
Backend:      Node.js (Fastify) ou Python (FastAPI)
Base de données: PostgreSQL + PostGIS (géospatial)
Auth:         Supabase Auth ou Firebase Auth
Temps réel:   Socket.io ou Supabase Realtime
Déploiement:  Vercel (frontend) + Railway/Render (backend)
Pourquoi ce stack ?
- PostGIS indispensable pour requêtes géospatiales (proximité, zones, polygones)
- TypeScript partagé frontend/backend = moins d'erreurs
- Supabase = Auth + DB + Realtime + Storage en un service (gain de temps hackathon)
2. Modèle de données prioritaire (MVP)
-- Tables core
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  type VARCHAR(50),           -- 'problem' | 'need' | 'danger' | 'resource' | 'capacity'
  category VARCHAR(50),       -- eau, dechets, inondation, transport, etc.
  description TEXT,
  location GEOGRAPHY(POINT),
  zone VARCHAR(100),          -- fokontany/quartier
  urgency VARCHAR(20),        -- low, medium, high, critical
  status VARCHAR(30),         -- new, confirmed, assigned, in_progress, resolved, expired
  visibility VARCHAR(20),     -- public, partner, confidential
  author_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB              -- flexible: photos, audio, nb_personnes, etc.
);

CREATE TABLE resources (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  name VARCHAR(100),
  description TEXT,
  location GEOGRAPHY(POINT),
  quantity INT,
  capacity VARCHAR(50),
  availability VARCHAR(30),   -- available, limited, unavailable, expired
  schedule JSONB,             -- {open: "14:00", close: "17:00", days: [1,2,3,4,5]}
  manager_id UUID REFERENCES users(id),
  status VARCHAR(30),
  reliability_score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  access_conditions TEXT
);

CREATE TABLE help_offers (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES users(id),
  help_type VARCHAR(50),      -- transport, eau, distribution, reparation, etc.
  description TEXT,
  zone VARCHAR(100),
  capacity VARCHAR(100),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status VARCHAR(30),         -- available, matched, in_progress, done, cancelled
  linked_report_id UUID REFERENCES reports(id),
  validator_id UUID REFERENCES users(id),
  proof JSONB,                -- photos, confirmation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables de liaison
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  resource_id UUID REFERENCES resources(id),
  help_offer_id UUID REFERENCES help_offers(id),
  match_type VARCHAR(30),     -- need_resource, problem_intervenor, help_volunteer
  score DECIMAL(3,2),
  distance_meters INT,
  reason TEXT,                -- explication lisible
  status VARCHAR(30),         -- suggested, accepted, rejected, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE reactions (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(30),           -- confirm, still_exists, resolved, incorrect, know_resource, can_help, share
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  name VARCHAR(100),
  role VARCHAR(30),           -- resident, moderator, fokontany, association, commune, partner
  zone VARCHAR(100),
  trust_level VARCHAR(30),    -- new, active, verifier, reliable, verified_partner
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
3. API REST minimale (MVP)
POST   /api/reports              # Créer signalement (Voix du quartier)
GET    /api/reports              # Liste avec filtres (type, zone, statut, urgence)
GET    /api/reports/:id          # Détail + réactions + matches
PATCH  /api/reports/:id          # Maj statut (modérateur/auteur)
POST   /api/reports/:id/reactions # Ajouter réaction

POST   /api/resources            # Créer ressource
GET    /api/resources            # Liste dispo près d'un point
PATCH  /api/resources/:id        # Maj dispo/quantité

POST   /api/help-offers          # "Je peux aider"
GET    /api/help-offers          # Offres dispo par zone/type
PATCH  /api/help-offers/:id      # Maj statut

POST   /api/matches              # Créer mise en relation (auto ou manuelle)
GET    /api/matches              # Pour un report ou une resource
PATCH  /api/matches/:id/accept   # Accepter match
PATCH  /api/matches/:id/complete # Marquer réalisé

GET    /api/dashboard/stats      # KPIs pour 4 vues
GET    /api/map/layers           # GeoJSON pour carte (besoins, ressources, capacités)
4. Frontend - Structure des pages (MVP)
src/
├── pages/
│   ├── MapPage.tsx              # Carte principale (besoins + capacités)
│   ├── ReportFormPage.tsx       # Formulaire Voix du quartier (< 1 min)
│   ├── ReportDetailPage.tsx     # Détail + réactions + matcher
│   ├── ResourceFormPage.tsx     # Publier ressourse
│   ├── HelpOfferFormPage.tsx    # "Je peux aider"
│   ├── DashboardPage.tsx        # 4 onglets: Problèmes, Ressources, Besoins, Solidarité
│   ├── ProfilePage.tsx          # Profil + historique actions
│   └── AuthPages.tsx
├── components/
│   ├── map/MapView.tsx          # Leaflet/MapLibre wrapper
│   ├── map/ReportMarker.tsx
│   ├── map/ResourceMarker.tsx
│   ├── forms/ReportForm.tsx     # 7 étapes guidées
│   ├── forms/ResourceForm.tsx
│   ├── forms/HelpOfferForm.tsx
│   ├── dashboard/StatsCards.tsx
│   ├── dashboard/Charts.tsx
│   └── ui/ (Button, Input, Select, Badge, Modal, Toast)
├── hooks/
│   ├── useReports.ts
│   ├── useResources.ts
│   ├── useHelpOffers.ts
│   ├── useMatches.ts
│   └── useGeolocation.ts
├── services/api.ts              # Client API typé
├── types/                       # Types TypeScript partagés
└── utils/matching.ts            # Algo score simple (règles MVP)
5. Algorithme de matching MVP (règles simples)
// utils/matching.ts
export function findMatches(report: Report): Match[] {
  const candidates = report.type === 'need' 
    ? getAvailableResources(report.category, report.location)
    : report.type === 'problem'
      ? getAvailableIntervenors(report.category, report.location)
      : getAvailableVolunteers(report.category, report.location);

  return candidates
    .map(c => ({
      ...c,
      score: calculateScore(report, c),
      reason: explainMatch(report, c)
    }))
    .filter(m => m.score > 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function calculateScore(report: Report, candidate: Resource | HelpOffer): number {
  let score = 0;
  // 1. Même catégorie (0.3)
  if (candidate.category === report.category) score += 0.30;
  // 2. Même zone ou voisine (0.25)
  if (candidate.zone === report.zone || isNeighborZone(candidate.zone, report.zone)) score += 0.25;
  // 3. Disponible maintenant (0.20)
  if (candidate.availability === 'available') score += 0.20;
  // 4. Info récente < 48h (0.15)
  if (hoursSince(candidate.updated_at) < 48) score += 0.15;
  // 5. Accessible (route praticable) (0.10)
  if (candidate.accessible) score += 0.10;
  return score;
}

function explainMatch(report: Report, candidate: any): string {
  const reasons = [];
  if (candidate.category === report.category) reasons.push("même catégorie");
  if (candidate.zone === report.zone) reasons.push("même zone");
  if (candidate.availability === 'available') reasons.push("disponible maintenant");
  if (hoursSince(candidate.updated_at) < 48) reasons.push("info vérifiée récemment");
  if (candidate.accessible) reasons.push("zone accessible");
  return `Recommandé car : ${reasons.join(", ")}.`;
}
6. Ordre d'implémentation suggéré (2-3 jours hackathon)
Jour	Focus	Livrables
J1 matin	Setup + DB + Auth	Projet Vite + Supabase connecté, tables créées, auth fonctionnel
J1 aprem	Carte + Signalements	Carte Leaflet, formulaire Voix du quartier, liste signalements, géolocalisation
J2 matin	Ressources + Aide	Formulaires Ressource & "Je peux aider", marqueurs carte différenciés
J2 aprem	Matching + Dashboard	Algo matching simple, page détaillée report avec matches, dashboard 4 vues
J3 matin	Polish + Demo data	Données démo réalistes (10+ signalements, 5+ ressources, 5+ offres aide), UX fluide
J3 aprem	Tests + Déploiement	Vercel + Railway, README, vidéo démo 2min
7. Points d'attention critiques
1. Géolocalisation : Fallback manuel (clic carte + recherche adresse) si GPS refusé
2. Photos : Compression client-side avant upload (max 500KB)
3. Offline-first : IndexedDB pour brouillons formulaires (sync quand online)
4. Confidentialité : Floutage coordonnées exact
+ Thought: 5.3s
8. Tâches concrètes à démarrer maintenant
# 1. Initialiser le projet
npm create vite@latest ranomadio-map -- --template react-ts
cd ranomadio-map
npm i leaflet @types/leaflet react-leaflet @supabase/supabase-client zod react-hook-form @hookform/resolvers date-fns lucide-react clsx tailwind-merge
npm i -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
# 2. Créer le schéma Supabase (SQL Editor)
# Copier le SQL de la section 2 ci-dessus
# 3. Structure dossiers
mkdir -p src/{pages,components/{map,forms,dashboard,ui},hooks,services,types,utils}
Premier fichier à écrire : src/services/supabase.ts (client typé) → puis src/hooks/useReports.ts → puis MapPage.tsx
9. Données de démo réalistes (à préparer)
Type	Exemples (Madagascar)
Signalements	Panne pompe Anosizato, Inondation Ambohimanarina, Déchets Andoharanofotsy, Besoin eau Ankadivato
Ressources	Puits Association Soa (120 bidons, 14-17h), Eau commerçant Tsaralalana (20 bidons), Camion mairie
Offres aide	Transport volontaire Ambohimanarina 15-18h, Bénévoles nettoyage Association Fanilo, Bidons famille Anosizato