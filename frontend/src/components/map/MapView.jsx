import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CLUSTER_MIN,
  DISABLE_CLUSTER_AT_ZOOM,
  MAX_CLUSTER_RADIUS,
  PILOT_BOUNDS,
  PILOT_CENTER,
  TILE_URL,
  ZOOM_FICHE,
  ZOOM_INITIAL,
} from '../../config/place'
import { markerHtml, getMarkerStyles } from './markerHtml'
import { clusterHtml, getClusterStyles } from './clusterHtml'

export default function MapView({
  places = [],
  filteredPlaces = places,
  onSelect = () => {},
  selectedId = null,
  ...props
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const clusterRef = useRef(null)
  const individualLayerRef = useRef(null)
  const markersRef = useRef([])
  const resizeObserverRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    const styleId = 'map-marker-styles'
    if (!document.getElementById(styleId)) {
      const div = document.createElement('div')
      div.id = styleId
      div.innerHTML = getMarkerStyles() + getClusterStyles()
      document.head.appendChild(div)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return undefined

    const map = L.map(containerRef.current, {
      center: PILOT_CENTER,
      zoom: ZOOM_INITIAL,
      maxBounds: PILOT_BOUNDS,
      maxBoundsViscosity: 0.8,
      minZoom: 11,
    })

    const tileLayer = L.tileLayer(TILE_URL, {
      attribution: '&copy; OpenStreetMap contributors | Données France/OSM',
      maxZoom: 19,
    })
    tileLayer.addTo(map)

    const clusters = L.markerClusterGroup({
      maxClusterRadius: MAX_CLUSTER_RADIUS,
      disableClusteringAtZoom: DISABLE_CLUSTER_AT_ZOOM,
      iconCreateFunction: (cluster) => {
        const markers = cluster.getAllChildMarkers()
        const count = cluster.getChildCount()
        const html = clusterHtml(count, markers)
        return L.divIcon({
          html,
          className: 'cluster-icon',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        })
      },
    })

    const individualLayer = L.layerGroup()

    mapRef.current = map
    clusterRef.current = clusters
    individualLayerRef.current = individualLayer

    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        map.invalidateSize({ pan: false, debounceMoveend: true })
      })
      resizeObserverRef.current.observe(containerRef.current)
    }

    return () => {
      if (resizeObserverRef.current && containerRef.current) {
        resizeObserverRef.current.unobserve(containerRef.current)
      }
      resizeObserverRef.current = null
      map.remove()
      mapRef.current = null
      clusterRef.current = null
      individualLayerRef.current = null
      markersRef.current = []
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const clusters = clusterRef.current
    const individualLayer = individualLayerRef.current
    if (!map || !clusters || !individualLayer) return

    clusters.clearLayers()
    individualLayer.clearLayers()
    markersRef.current = []

    const data = filteredPlaces || []

    const markers = data.map((place) => {
      const [lat, lng] = place.coords || []
      const latitude = Number(lat)
      const longitude = Number(lng)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null
      }

      const isSelected = selectedId === place.id
      const html = markerHtml({ place, selected: isSelected })

      const marker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          html,
          className: 'custom-marker',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        }),
        place: place,
      })

      marker.on('click', (e) => {
        e.originalEvent.stopPropagation()
        onSelectRef.current(place.id, e.originalEvent.target?.closest?.('.marker'))
      })

      marker.on('keydown', (e) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
          e.originalEvent.preventDefault()
          onSelectRef.current(place.id, e.originalEvent.target?.closest?.('.marker'))
        }
      })

      return marker
    }).filter(Boolean)

    markersRef.current = markers

    if (markers.length > CLUSTER_MIN) {
      clusters.addLayers(markers)
      map.addLayer(clusters)
      if (map.hasLayer(individualLayer)) {
        map.removeLayer(individualLayer)
      }
    } else {
      markers.forEach((marker) => {
        individualLayer.addLayer(marker)
      })
      map.addLayer(individualLayer)
      if (map.hasLayer(clusters)) {
        map.removeLayer(clusters)
      }
    }
  }, [filteredPlaces, selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const focusId = searchParams.get('focus')
    const zone = searchParams.get('zone')

    if (focusId) {
      const marker = markersRef.current.find((m) => {
        const place = m.options?.place || m.place
        return place && place.id === focusId
      })
      if (marker) {
        const latlng = marker.getLatLng()
        map.setView(latlng, ZOOM_FICHE, { animate: true, duration: 0.5 })
      }
      return
    }

    if (zone) {
      const nzone = zone.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const zonePlaces = (filteredPlaces || places || []).filter((p) => {
        const nf = (p.fokontany || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const nc = (p.commune || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return nf.includes(nzone) || nc.includes(nzone)
      })
      if (zonePlaces.length > 0) {
        const bounds = L.latLngBounds(zonePlaces.map((p) => p.coords))
        map.fitBounds(bounds.pad(0.2), { animate: true, duration: 0.5 })
      }
    }
  }, [searchParams, filteredPlaces, places])

  return (
    <div
      ref={containerRef}
      className="map-view"
      role="region"
      aria-label="Carte des lieux"
      style={{ width: '100%', height: '100%' }}
      {...props}
    />
  )
}
