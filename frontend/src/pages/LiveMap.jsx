import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { mapAPI } from '../services/api'
import { MapPin, Filter, RefreshCw, AlertTriangle, Wifi, MessageSquare, Siren } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const createIcon = (color) => new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
})

const icons = {
  complaint: createIcon('#ef4444'),
  device: createIcon('#3b82f6'),
  incident: createIcon('#f59e0b'),
  emergency: createIcon('#a855f7'),
}

const AHMEDABAD_CENTER = [23.03, 72.58]

const FitBounds = ({ markers }) => {
  const map = useMap()
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [markers, map])
  return null
}

const LiveMap = () => {
  const [data, setData] = useState({ complaints: [], devices: [], incidents: [], emergencies: [] })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ types: 'complaints,devices,incidents,emergencies', zone: '' })
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await mapAPI.getData(filter)
      setData(res.data.data)
    } catch (err) {
      console.error('Map data error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const allMarkers = []

  const showTypes = filter.types.split(',')

  if (showTypes.includes('complaints') && data.complaints) {
    data.complaints.forEach((c) => {
      if (c.coordinates?.lat) {
        allMarkers.push({ lat: c.coordinates.lat, lng: c.coordinates.lng, type: 'complaint', data: c })
      }
    })
  }
  if (showTypes.includes('devices') && data.devices) {
    data.devices.forEach((d) => {
      if (d.coordinates?.lat) {
        allMarkers.push({ lat: d.coordinates.lat, lng: d.coordinates.lng, type: 'device', data: d })
      }
    })
  }
  if (showTypes.includes('incidents') && data.incidents) {
    data.incidents.forEach((i) => {
      if (i.coordinates?.lat) {
        allMarkers.push({ lat: i.coordinates.lat, lng: i.coordinates.lng, type: 'incident', data: i })
      }
    })
  }
  if (showTypes.includes('emergencies') && data.emergencies) {
    data.emergencies.forEach((e) => {
      if (e.coordinates?.lat) {
        allMarkers.push({ lat: e.coordinates.lat, lng: e.coordinates.lng, type: 'emergency', data: e })
      }
    })
  }

  const stats = {
    complaints: data.complaints?.length || 0,
    devices: data.devices?.length || 0,
    incidents: data.incidents?.length || 0,
    emergencies: data.emergencies?.length || 0,
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header">
        <div>
          <h1><MapPin size={20} style={{ display: 'inline', marginRight: 8 }} />Live City Map</h1>
          <p>Real-time geospatial view of all city systems</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setRefreshing(true); fetchData() }} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { key: 'complaints', label: 'Complaints', icon: <MessageSquare size={14} />, color: '#ef4444', count: stats.complaints },
          { key: 'devices', label: 'IoT Devices', icon: <Wifi size={14} />, color: '#3b82f6', count: stats.devices },
          { key: 'incidents', label: 'Incidents', icon: <AlertTriangle size={14} />, color: '#f59e0b', count: stats.incidents },
          { key: 'emergencies', label: 'Emergencies', icon: <Siren size={14} />, color: '#a855f7', count: stats.emergencies },
        ].map((s) => (
          <div
            key={s.key}
            onClick={() => {
              const current = filter.types.split(',')
              const updated = current.includes(s.key) ? current.filter((t) => t !== s.key) : [...current, s.key]
              setFilter({ ...filter, types: updated.join(',') })
            }}
            className="card"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', cursor: 'pointer',
              opacity: showTypes.includes(s.key) ? 1 : 0.4,
              borderColor: showTypes.includes(s.key) ? s.color : undefined,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
            {s.icon}
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.count}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}

        <select
          className="filter-bar"
          value={filter.zone}
          onChange={(e) => setFilter({ ...filter, zone: e.target.value })}
          style={{ padding: '0.5rem 0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="">All Zones</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
          <option value="central">Central</option>
        </select>
      </div>

      {/* Map */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-lg)', height: 'calc(100vh - 280px)', minHeight: 450 }}>
        <MapContainer center={AHMEDABAD_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          {allMarkers.length > 0 && <FitBounds markers={allMarkers} />}
          {allMarkers.map((marker, idx) => (
            <Marker key={`${marker.type}-${idx}`} position={[marker.lat, marker.lng]} icon={icons[marker.type]}>
              <Popup>
                <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                    {marker.data.title || marker.data.name || marker.data.deviceId}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>
                    {marker.data.location} • {marker.data.zone}
                  </div>
                  {marker.data.status && (
                    <span className={`badge badge-${marker.data.status}`} style={{ fontSize: '0.7rem' }}>
                      {marker.data.status}
                    </span>
                  )}
                  {marker.data.priority && (
                    <span className={`badge badge-${marker.data.priority}`} style={{ fontSize: '0.7rem', marginLeft: 4 }}>
                      {marker.data.priority}
                    </span>
                  )}
                  {marker.data.category && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                      Category: {marker.data.category}
                    </div>
                  )}
                  {marker.data.type && marker.type !== 'complaint' && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                      Type: {marker.data.type}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default LiveMap
