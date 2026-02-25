import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, ZoomControl, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PremiumFeatures.css';
import {
  Navigation, MapPin, Clock, Zap, Milestone, ChevronRight, Activity, Cpu, Plus, Trash2,
  AlertTriangle, XCircle, Truck, Plane, Compass, Briefcase, ShieldAlert, Leaf, Fuel,
  CloudRain, Users, Terminal, Eye, BarChart3, Database, Workflow, Settings, CheckCircle2,
  Mic, Info, History, Map as MapIcon, Loader2, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import _ from 'lodash';

// --- MAS CONSTANTS ---
const FUEL_RATES = { petrol: 104.2, diesel: 92.4, cng: 89.5, ev: 0.15 }; // ₹ per unit
const AGENT_CLUSTERS = [
  {
    id: 'personalization',
    label: 'Personalization',
    agents: [
      { id: 'preference', name: 'Preference-Aware', icon: Users, desc: 'Diet, Culture, History' },
      { id: 'multimodal', name: 'Multi-Modal Opt', icon: Workflow, desc: 'Flights, Trains, Walking' }
    ]
  },
  {
    id: 'predictive',
    label: 'Intelligence',
    agents: [
      { id: 'disruption', name: 'Disruption Forecast', icon: CloudRain, desc: 'Weather, Events, Traffic' },
      { id: 'costbenefit', name: 'Cost-Benefit Sim', icon: BarChart3, desc: 'What-if scenarios' }
    ]
  },
  {
    id: 'logistics',
    label: 'Fleet & Logistics',
    agents: [
      { id: 'capacity', name: 'Capacity & Compliance', icon: Database, desc: 'Loading & Regulations' },
      { id: 'iot', name: 'IoT Integration', icon: Cpu, desc: 'Live Sensor Monitoring' }
    ]
  },
  {
    id: 'sustainability',
    label: 'Sustainability',
    agents: [
      { id: 'carbon', name: 'Carbon Optimizer', icon: Leaf, desc: 'Eco-Friendly & EV' },
      { id: 'posttrip', name: 'Post-Trip Analytics', icon: History, desc: 'Reinforcement Learning' }
    ]
  },
  {
    id: 'immersive',
    label: 'Immersive UX',
    agents: [
      { id: 'voice', name: 'Voice Assistant', icon: Mic, desc: 'Natural Language NLU' },
      { id: 'collaborative', name: 'Collab Planner', icon: Users, desc: 'Multi-User Voting' }
    ]
  },
  {
    id: 'energy',
    label: 'Energy & Fuel',
    agents: [
      { id: 'fuelopt', name: 'Fuel Optimizer', icon: Fuel, desc: 'Usage & CNG Profiling' },
      { id: 'grid', name: 'Grid Intelligence', icon: Zap, desc: 'EV & Infrastructure' }
    ]
  }
];

// --- UTILS ---
const createIcon = (color, size = 24) => new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${color};"></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2]
});

const startIcon = createIcon('#3b82f6');
const stopIcon = createIcon('#06b6d4', 20);
const endIcon = createIcon('#ec4899');

const poiIcons = {
  fuel: new L.DivIcon({
    className: 'poi-marker fuel',
    html: '<div style="display:flex;align-items:center;justify-content:center;height:100%;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22L15 22"></path><path d="M4 9L14 9"></path><path d="M14 22L14 11"></path><path d="M15 9L21 12"></path><path d="M15 5L15 22"></path><path d="M17 12L17 19"></path><path d="M4 11V19C4 20.66 5.34 22 7 22H11C12.66 22 14 20.66 14 19V11"></path></svg></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  }),
  toll: new L.DivIcon({
    className: 'poi-marker toll',
    html: '<div style="display:flex;align-items:center;justify-content:center;height:100%;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13V15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V13"/><path d="M12 7V3"/><path d="M9 11V7h6v4"/><rect x="8" y="11" width="8" height="2"/><path d="M5 21h14"/></svg></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  }),
  hotel: new L.DivIcon({
    className: 'poi-marker hotel',
    html: '<div style="display:flex;align-items:center;justify-content:center;height:100%;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10"/><path d="M12 18v2"/><path d="M3 21h18"/><path d="M7 11h2"/><path d="M15 11h2"/></svg></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
};

function MapController({ bounds, center, onBoundsChange }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [100, 100], duration: 1.5 });
    else if (center) map.flyTo(center, 13, { duration: 1.5 });
  }, [bounds, center]);

  useEffect(() => {
    const handleMoveEnd = () => {
      onBoundsChange(map.getBounds());
    };
    map.on('moveend', handleMoveEnd);
    // Initial bounds report
    onBoundsChange(map.getBounds());
    return () => map.off('moveend', handleMoveEnd);
  }, [map, onBoundsChange]);

  return null;
}

const App = () => {
  // --- STATE ---
  const [appMode, setAppMode] = useState('travel');
  const [activeAgents, setActiveAgents] = useState(['preference', 'disruption', 'carbon']);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isArMode, setIsArMode] = useState(false);

  const [origin, setOrigin] = useState({ query: '', point: null });
  const [destination, setDestination] = useState({ query: '', point: null });
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ type: '', data: [] });
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [logs, setLogs] = useState([]);
  const [personalization, setPersonalization] = useState({ dietary: 'Vegan', culture: 'Historical', history: 'Frequent Traveler' });
  const [disruptions, setDisruptions] = useState({ weather: 'Sunny', events: 'None', traffic: 'Dynamic' });
  const [discovery, setDiscovery] = useState({ fuel: true, toll: true, hotel: true, weather: false });
  const [discoveredPOIs, setDiscoveredPOIs] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);
  const [isQuantumView, setIsQuantumView] = useState(false);
  const [activeDashboardTab, setActiveDashboardTab] = useState('logs'); // logs, fuel
  const [carbonCredits, setCarbonCredits] = useState(742);
  const [iotStatus, setIotStatus] = useState('healthy'); // healthy, warning, critical
  const [currentFuelUsage, setCurrentFuelUsage] = useState(null);

  // --- POI FETCHING LOGIC ---
  const fetchLivePOIs = async (bounds) => {
    if (!bounds || (!discovery.fuel && !discovery.toll && !discovery.hotel)) return;

    // Zoom sensitivity check
    if (bounds.getNorthEast().lat - bounds.getSouthWest().lat > 2) {
      addLog('POI AGENT', 'Zoom in closer for live infrastructure data.');
      return;
    }

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const bbox = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`;

    let queries = [];
    if (discovery.fuel) queries.push(`node["amenity"="fuel"](${bbox});`);
    if (discovery.toll) queries.push(`node["barrier"="toll_booth"](${bbox});`);
    if (discovery.hotel) queries.push(`node["tourism"="hotel"](${bbox});`);

    if (queries.length === 0) return;

    const overpassQuery = `
      [out:json][timeout:25];
      (${queries.join('')});
      out body;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });
      const data = await response.json();

      const newPOIs = data.elements.map(el => {
        let type = 'fuel';
        if (el.tags.barrier === 'toll_booth') type = 'toll';
        else if (el.tags.tourism === 'hotel') type = 'hotel';

        return {
          type,
          latlng: [el.lat, el.lon],
          name: el.tags.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          details: el.tags.brand || el.tags.operator || (type === 'hotel' ? `Stars: ${el.tags.stars || 'N/A'}` : 'Live Infrastructure Point')
        };
      });

      setDiscoveredPOIs(prev => {
        // Simple merge: keep existing that are outside this bbox, or just replace
        // For simplicity and to avoid duplicates, we'll replace for the current view
        return newPOIs;
      });
      addLog('POI AGENT', `Visualizing ${newPOIs.length} active nodes in viewport.`);
    } catch (e) {
      addLog('SYS', 'POI network timeout.');
    }
  };

  const debouncedFetchPOIs = useRef(_.debounce(fetchLivePOIs, 1000)).current;

  useEffect(() => {
    if (mapBounds) debouncedFetchPOIs(mapBounds);
  }, [mapBounds, discovery.fuel, discovery.toll, discovery.hotel]);

  const downloadReport = () => {
    if (!origin.point || !destination.point) return;

    const report = `
=== PATHFINDER AI: DIGITAL VOYAGE LOG ===
Timestamp: ${new Date().toLocaleString()}
Mission Status: COMPLETED

[MISSION OVERVIEW]
Origin: ${origin.point.name}
Destination: ${destination.point.name}
Waypoints: ${stops.map(s => s.point?.name).filter(Boolean).join(' -> ') || 'Direct Route'}
Distance: ${totalDistance.toFixed(2)} km

[MAS OPTIMIZATION RESULTS]
Active Agents: ${activeAgents.join(', ')}
Efficiency Profile: ${currentFuelUsage ? `
- Petrol: ${currentFuelUsage.petrol.toFixed(2)} L
- Diesel: ${currentFuelUsage.diesel.toFixed(2)} L
- CNG: ${currentFuelUsage.cng.toFixed(2)} kg
- EV: ${currentFuelUsage.ev.toFixed(2)} kWh
` : 'Standard Calculation'}

[SUSTAINABILITY IMPACT]
Carbon Credits Earned: ${carbonCredits}
Eco-Rank: Sustainability Voyager

=== END OF LOG ===
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voyage_log_${origin.point.name}_to_${destination.point.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog('SYS', 'Digital Voyage Log exported successfully.');
  };

  // --- MAS LOGIC ---
  const addLog = (agent, msg) => {
    setLogs(prev => [{ agent: agent.toUpperCase(), msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
  };

  const addStop = () => {
    if (stops.length < 5) setStops([...stops, { query: '', point: null }]);
  };

  const removeStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const fetchSuggestions = useRef(_.debounce(async (query, type, index = null) => {
    if (query.length < 3) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=3`);
      const data = await response.json();
      setSuggestions({ type: index !== null ? `stop-${index}` : type, data });
    } catch (error) { console.error('Geocoding error:', error); }
  }, 300)).current;

  const handleSelectSuggestion = (suggestion, type, index = null) => {
    const latlng = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    const name = suggestion.display_name.split(',')[0];
    if (type === 'origin') {
      setOrigin({ query: suggestion.display_name, point: { name, latlng } });
      addLog('REFLEX', `Anchored: ${name}`);
    } else if (type === 'destination') {
      setDestination({ query: suggestion.display_name, point: { name, latlng } });
      addLog('REFLEX', `Locked: ${name}`);
    } else if (type === 'stop') {
      const ns = [...stops];
      ns[index] = { query: suggestion.display_name, point: { name, latlng } };
      setStops(ns);
      addLog('EXPLORER', `Waypoint: ${name}`);
    }
    setSuggestions({ type: '', data: [] });
    setMapCenter(latlng);
  };

  const toggleAgent = (id) => {
    setActiveAgents(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    const agentName = _.flatten(AGENT_CLUSTERS.map(c => c.agents)).find(a => a.id === id).name;
    addLog('COORDINATOR', `${activeAgents.includes(id) ? 'Deactivated' : 'Activated'} ${agentName}`);
  };

  const toggleDiscovery = (type) => {
    setDiscovery(prev => {
      const next = { ...prev, [type]: !prev[type] };
      return next;
    });
    addLog('POI AGENT', `${discovery[type] ? 'Hiding' : 'Activating'} ${type} intelligence...`);
  };

  const calculateRoutes = async () => {
    if (!origin.point || !destination.point) return;
    setLoading(true);
    addLog('COORDINATOR', `Synthesizing route across ${activeAgents.length} active agents...`);

    // Call Backend for MAS Optimization
    try {
      const response = await fetch('http://127.0.0.1:5000/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cities: [origin.point.name, ...stops.filter(s => s.point).map(s => s.point.name), destination.point.name],
          agents: activeAgents
        })
      });
      const masResult = await response.json();
      addLog('COORDINATOR', `MAS Score: ${masResult.score.toFixed(2)}`);
      if (masResult.fuel_usage) {
        // Sync with enhanced backend metrics
        setCurrentFuelUsage(masResult.fuel_usage);
        addLog('FUEL OPTIMIZER', `Optimal profile: ${masResult.fuel_usage.usage.cng.toFixed(1)}kg CNG predicted.`);
      }
    } catch (e) {
      addLog('SYS', 'Standard calculation fallback active.');
    }

    // Simulate Agent processing
    let routeDelay = 0;
    if (activeAgents.includes('disruption')) {
      const weatherStates = ['Storm Front', 'Clear Skies', 'Heavy Rainfall', 'Fog Warning'];
      const randomWeather = weatherStates[Math.floor(Math.random() * weatherStates.length)];
      setDisruptions(prev => ({ ...prev, weather: randomWeather }));
      addLog('DISRUPTION', `Analyzing weather: ${randomWeather}.`);
      if (randomWeather === 'Storm Front') {
        addLog('COORDINATOR', 'DANGER: Storm Front detected. Engaging emergency rerouting.');
        routeDelay = 45; // 45 minute delay simulation
      }
    }

    if (activeAgents.includes('carbon')) {
      addLog('SUSTAINABILITY', 'Eco-Agent: Computing low-carbon trajectory and EV charging density.');
    }

    const allStops = [origin.point, ...stops.filter(s => s.point).map(s => s.point), destination.point];
    try {
      const coords = allStops.map(p => `${p.latlng[1]},${p.latlng[0]}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&alternatives=true&overview=full`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes) {
        // --- SIMULATE POIs ---
        const newPOIs = [];
        const geometry = data.routes[0].geometry.coordinates;

        // Randomly pick points along the geometry for POIs
        ['fuel', 'toll', 'hotel'].forEach(type => {
          for (let k = 0; k < 2; k++) {
            const idx = Math.floor(Math.random() * (geometry.length - 20)) + 10;
            const coord = geometry[idx];
            newPOIs.push({
              type,
              latlng: [coord[1], coord[0]],
              name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Math.floor(Math.random() * 900) + 100}`,
              details: type === 'fuel' ? 'Petrol: ₹104.2 | Diesel: ₹92.4' :
                type === 'toll' ? 'Toll Charge: ₹165 | Wait: 5m' :
                  'Available: 12 Rooms | Rating: 4.2★'
            });
          }
        });
        setDiscoveredPOIs(newPOIs);
        addLog('POI AGENT', `Discovered ${newPOIs.length} infrastructure nodes along path.`);

        setRoutes(data.routes.map((r, i) => {
          const dist = (r.distance / 1000).toFixed(1);
          const dur = Math.round(r.duration / 60) + routeDelay;

          // --- SIMULATE TRAFFIC SEGMENTS ---
          // Divide route into 5-10 segments with different "traffic" levels
          const fullGeom = r.geometry.coordinates.map(c => [c[1], c[0]]);
          const segCount = 8;
          const segments = [];
          for (let j = 0; j < segCount; j++) {
            const start = Math.floor((j / segCount) * fullGeom.length);
            const end = Math.floor(((j + 1) / segCount) * fullGeom.length);
            const trafficLevel = Math.random();
            segments.push({
              coords: fullGeom.slice(start, end + 1),
              level: trafficLevel > 0.8 ? 'heavy' : trafficLevel > 0.5 ? 'med' : 'low'
            });
          }

          return {
            distance: dist,
            duration: dur,
            geometry: fullGeom,
            segments,
            color: i === 0 ? 'var(--primary)' : '#475569',
            co2: (dist * (activeAgents.includes('carbon') ? 0.04 : 0.12)).toFixed(2),
            cost: {
              petrol: (dist * 0.08 * FUEL_RATES.petrol).toFixed(0),
              diesel: (dist * 0.1 * FUEL_RATES.diesel).toFixed(0),
              cng: (dist * 0.05 * FUEL_RATES.cng).toFixed(0)
            },
            volume: {
              petrol: (dist * 0.08).toFixed(1),
              diesel: (dist * 0.1).toFixed(1),
              cng: (dist * 0.05).toFixed(1)
            },
            id: i
          };
        }));
        setSelectedRouteIdx(0);
        addLog('COORDINATOR', 'Optimal solution delivered with infrastructure overlay.');
      }
    } catch (error) { addLog('SYS', 'Oversight Error: Routing engine timeout.'); }
    finally { setLoading(false); }
  };

  return (
    <div className={`app-container ${appMode}`}>
      {isArMode && <div className="ar-overlay"><div className="ar-scanline" /></div>}

      {/* COMMAND CENTER DASHBOARD */}
      <AnimatePresence>
        {isCommandCenterOpen && (
          <motion.div className="command-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div className="cc-header">
              <div className="cc-title">
                <h2>MAS Command Center</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Real-time coordination of 12 multi-agent clusters</p>
                  <button
                    onClick={downloadReport}
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid #10b981',
                      color: '#10b981',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={12} /> Download Voyage Log
                  </button>
                </div>
              </div>
              <button className="close-modal" onClick={() => setIsCommandCenterOpen(false)}><XCircle size={24} /></button>
            </div>

            <div className="cc-grid">
              <div className="cc-card">
                <div className="cc-stat-group">
                  <span className="cc-stat-label">Active Agents</span>
                  <span className="cc-stat-val">{activeAgents.length}/10</span>
                </div>
                <div className="cc-stat-group">
                  <span className="cc-stat-label">System Health</span>
                  <span className="cc-stat-val" style={{ color: '#10b981' }}>Optimal</span>
                </div>
              </div>
              <div className="cc-card">
                <span className="cc-stat-label">Logistics Efficiency</span>
                <span className="cc-stat-val">94.2%</span>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <div style={{ width: '94%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }} />
                </div>
              </div>
              <div className="cc-card">
                <span className="cc-stat-label">Carbon Saved (Total)</span>
                <span className="cc-stat-val">124.8 kg</span>
                <p style={{ fontSize: '0.75rem', color: '#10b981' }}>+12% vs last voyage</p>
              </div>
              <div className="cc-card">
                <div className="cc-stat-group">
                  <span className="cc-stat-label">Mission Fuel Analytics</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PETROL</span>
                      <div className="cc-stat-val" style={{ fontSize: '1.25rem' }}>
                        {currentFuelUsage ? currentFuelUsage.usage.petrol.toFixed(1) : '0.0'}L
                        <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '5px' }}>
                          (₹{currentFuelUsage ? currentFuelUsage.costs.petrol.toFixed(0) : '0'})
                        </span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DIESEL</span>
                      <div className="cc-stat-val" style={{ fontSize: '1.25rem' }}>
                        {currentFuelUsage ? currentFuelUsage.usage.diesel.toFixed(1) : '0.0'}L
                        <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '5px' }}>
                          (₹{currentFuelUsage ? currentFuelUsage.costs.diesel.toFixed(0) : '0'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', marginTop: '0.5rem' }}>
                  <div style={{
                    width: (currentFuelUsage && (currentFuelUsage.usage.petrol + currentFuelUsage.usage.diesel) > 0)
                      ? `${Math.min((currentFuelUsage.usage.petrol / (currentFuelUsage.usage.petrol + currentFuelUsage.usage.diesel)) * 100, 100)}%`
                      : '0%',
                    height: '100%',
                    background: 'var(--primary)'
                  }} />
                </div>
              </div>
              <div className="cc-card">
                <span className="cc-stat-label">System Adaptation</span>
                <span className="cc-stat-val">Active</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Optimizing for {personalization.dietary} preferences</p>
              </div>
            </div>

            <div className="cc-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="activity-header"><Terminal size={14} /> System Visualization</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={`discovery-chip ${activeDashboardTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveDashboardTab('logs')} style={{ fontSize: '0.65rem' }}>
                    Logs
                  </button>
                  <button className={`discovery-chip ${activeDashboardTab === 'quantum' ? 'active' : ''}`} onClick={() => setActiveDashboardTab('quantum')} style={{ fontSize: '0.65rem' }}>
                    Quantum View
                  </button>
                  <button className={`discovery-chip ${activeDashboardTab === 'fuel' ? 'active' : ''}`} onClick={() => setActiveDashboardTab('fuel')} style={{ fontSize: '0.65rem' }}>
                    <Fuel size={12} /> Fuel Metrics
                  </button>
                </div>
              </div>

              {activeDashboardTab === 'quantum' ? (
                <div className="quantum-visualization" style={{ height: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <div className="quantum-grid" />
                  <div className="quantum-particles">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <motion.div
                        key={i}
                        className="quantum-particle"
                        animate={{
                          x: [Math.random() * 400, Math.random() * 400],
                          y: [Math.random() * 200, Math.random() * 200],
                          opacity: [0.1, 0.5, 0.1]
                        }}
                        transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
                      />
                    ))}
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.6rem', color: 'var(--primary)' }}>
                    ANALYSING N-DIMENSIONAL SPACE...
                  </div>
                </div>
              ) : activeDashboardTab === 'fuel' ? (
                <div className="fuel-dashboard" style={{ flex: 1, padding: '1rem' }}>
                  <div className="fuel-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="dashboard-card">
                      <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Usage Analytics</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {currentFuelUsage ? Object.entries(currentFuelUsage.usage).map(([fuel, val]) => (
                          <div key={fuel} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                              <span style={{ textTransform: 'uppercase' }}>{fuel}</span>
                              <div style={{ textAlign: 'right' }}>
                                <div>{val.toFixed(2)} {fuel === 'cng' ? 'kg' : fuel === 'ev' ? 'kWh' : 'L'}</div>
                                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{currentFuelUsage.costs[fuel].toFixed(0)}</div>
                              </div>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${Math.min(val * 2, 100)}%` }}
                                style={{ height: '100%', background: fuel === 'cng' ? 'var(--accent)' : 'var(--primary)', borderRadius: '3px' }}
                              />
                            </div>
                          </div>
                        )) : <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generate a route to see analytics.</p>}
                      </div>
                    </div>
                    <div className="dashboard-card">
                      <h4 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Cost Comparison</h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                        <div className="cost-pie-mock" style={{
                          width: '100px', height: '100px', borderRadius: '50%',
                          border: '10px solid var(--primary)', borderRightColor: 'var(--accent)',
                          borderBottomColor: 'var(--success)', transform: 'rotate(45deg)'
                        }} />
                      </div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                        CNG provides 42% cost reduction vs Petrol for this mission.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="activity-feed" style={{ maxH: 'none', flex: 1 }}>
                  {logs.map((log, i) => (
                    <div key={i} className="log-entry">
                      <span style={{ opacity: 0.5 }}>[{log.time}]</span>
                      <span className="log-agent">[{log.agent}]</span>
                      <span className="log-msg">{log.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sidebar">
        <div className="brand" onClick={() => setIsCommandCenterOpen(true)} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity className="pulse-primary" color="var(--primary)" size={32} />
            <h1 style={{ background: `linear-gradient(135deg, #fff 0%, var(--primary) 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PathFinder AI</h1>
          </div>
          <p>Multi-Agent System v3.0</p>
        </div>

        <div className="mode-selector">
          <button className={`mode-tab ${appMode === 'travel' ? 'active' : ''}`} onClick={() => setAppMode('travel')}>Travel</button>
          <button className={`mode-tab ${appMode === 'logistics' ? 'active' : ''}`} onClick={() => setAppMode('logistics')}>Logistics</button>
        </div>

        <div className="search-controls" style={{ marginTop: '1rem' }}>
          <div className="input-wrapper">
            <label className="input-label"><MapPin size={12} /> {appMode === 'travel' ? 'Start Location' : 'Base Depot'}</label>
            <input
              className="input-field"
              value={origin.query}
              onChange={(e) => {
                setOrigin({ ...origin, query: e.target.value });
                fetchSuggestions(e.target.value, 'origin');
              }}
              placeholder="Search..."
            />
            {suggestions.type === 'origin' && (
              <div className="autocomplete-dropdown">
                {suggestions.data.map((s, i) => (<div key={i} className="suggestion-item" onClick={() => handleSelectSuggestion(s, 'origin')}>{s.display_name}</div>))}
              </div>
            )}
          </div>

          <div className="stop-list">
            {stops.map((stop, index) => (
              <div key={index} className="stop-item">
                <div className="stop-input-container">
                  <label className="input-label">Stop {index + 1}</label>
                  <input className="input-field" value={stop.query} onChange={(e) => {
                    const ns = [...stops];
                    ns[index].query = e.target.value;
                    setStops(ns);
                    fetchSuggestions(e.target.value, 'stop', index);
                  }} placeholder="Add stop..." />
                  {suggestions.type === `stop-${index}` && (
                    <div className="autocomplete-dropdown">
                      {suggestions.data.map((s, i) => (<div key={i} className="suggestion-item" onClick={() => handleSelectSuggestion(s, 'stop', index)}>{s.display_name}</div>))}
                    </div>
                  )}
                </div>
                <button className="remove-stop-btn" onClick={() => removeStop(index)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <button className="add-stop-btn" onClick={addStop}>
            <Plus size={16} /> Add Waypoint
          </button>

          <div className="input-wrapper">
            <label className="input-label"><Navigation size={12} /> {appMode === 'travel' ? 'Arrival' : 'Target'}</label>
            <input className="input-field" value={destination.query} onChange={(e) => {
              setDestination({ ...destination, query: e.target.value });
              fetchSuggestions(e.target.value, 'destination');
            }} placeholder="Destination..." />
            {suggestions.type === 'destination' && (
              <div className="autocomplete-dropdown">
                {suggestions.data.map((s, i) => (<div key={i} className="suggestion-item" onClick={() => handleSelectSuggestion(s, 'destination')}>{s.display_name}</div>))}
              </div>
            )}
          </div>

          <button className="optimize-btn" onClick={calculateRoutes} disabled={loading || !origin.point || !destination.point}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            {loading ? 'Synthesizing MAS...' : 'Generate AI Route'}
          </button>

          <div className="discovery-section">
            <div className="agent-group-label">Infrastructure Discovery</div>
            <div className="discovery-toggles">
              <div className={`discovery-chip fuel ${discovery.fuel ? 'active' : ''}`} onClick={() => toggleDiscovery('fuel')}>
                <Fuel size={14} /> Fuel Bunks
              </div>
              <div className={`discovery-chip toll ${discovery.toll ? 'active' : ''}`} onClick={() => toggleDiscovery('toll')}>
                <Milestone size={14} /> Toll Gates
              </div>
              <div className={`discovery-chip hotel ${discovery.hotel ? 'active' : ''}`} onClick={() => toggleDiscovery('hotel')}>
                <Briefcase size={14} /> Hotels
              </div>
              <div className={`discovery-chip danger ${discovery.weather ? 'active' : ''}`} onClick={() => toggleDiscovery('weather')}>
                <CloudRain size={14} /> Weather Overlay
              </div>
            </div>
          </div>
        </div>

        {routes.length > 0 && currentFuelUsage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="consumption-summary-card"
            style={{
              background: 'rgba(255, 107, 0, 0.05)',
              border: '1px solid rgba(255, 107, 0, 0.2)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
              <Fuel size={80} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} /> Mission Consumption Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="summary-stat">
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Petrol Mission Cost</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                  ₹{currentFuelUsage.costs.petrol.toFixed(0)} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({currentFuelUsage.usage.petrol.toFixed(1)}L)</span>
                </div>
              </div>
              <div className="summary-stat">
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CNG Mission Cost</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                  ₹{currentFuelUsage.costs.cng.toFixed(0)} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({currentFuelUsage.usage.cng.toFixed(1)}kg)</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,107,0,0.1)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              MAS Recommendation: <span style={{ color: 'var(--accent)' }}>CNG</span> is the most eco-friendly and cost-effective for this route.
            </div>
          </motion.div>
        )}

        <div className="routes-container">
          {routes.length > 0 && (
            <div className="routes-list" style={{ marginBottom: '2rem' }}>
              <div className="agent-group-label">Optimized Solutions</div>
              {routes.map((route, i) => (
                <div key={i} className={`route-card ${selectedRouteIdx === i ? 'active' : ''}`} onClick={() => setSelectedRouteIdx(i)}>
                  <div className="route-header">
                    <span>Option {i + 1}</span>
                    {i === 0 && <span className="best-tag">MAS Pick</span>}
                  </div>
                  <div className="stats-row">
                    <div className="stat-item"><Navigation size={12} /> {route.distance} km</div>
                    <div className="stat-item"><Clock size={12} /> {route.duration} min</div>
                    {activeAgents.includes('carbon') && <div className="stat-item"><Leaf size={12} /> {route.co2}kg</div>}
                  </div>

                  <div className="fuel-comparison-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div className="fuel-stat">
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Petrol Efficiency</span>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem' }}>₹{route.cost.petrol}</div>
                      <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{currentFuelUsage ? currentFuelUsage.usage.petrol.toFixed(1) : route.volume.petrol}L Required</div>
                    </div>
                    <div className="fuel-stat">
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Diesel Profile</span>
                      <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.8rem' }}>₹{route.cost.diesel}</div>
                      <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{currentFuelUsage ? currentFuelUsage.usage.diesel.toFixed(1) : route.volume.diesel}L Required</div>
                    </div>
                    <div className="fuel-stat">
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>CNG Metric</span>
                      <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.8rem' }}>₹{route.cost.cng}</div>
                      <div style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 'bold' }}>{currentFuelUsage ? currentFuelUsage.usage.cng.toFixed(1) : route.volume.cng}kg Opt</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="agent-controls-section">
            <div className="agent-group-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>User Preference Profile</span>
              <span style={{ color: 'var(--primary)' }}>{personalization.dietary}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
              {['Vegan', 'Halal', 'Standard'].map(d => (
                <button key={d} className={`mode-tab ${personalization.dietary === d ? 'active' : ''}`} style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => setPersonalization({ ...personalization, dietary: d })}>
                  {d}
                </button>
              ))}
            </div>
            <div className="agent-group-label">Intelligence Agents</div>
            <div className="agent-toggle-grid">
              {AGENT_CLUSTERS.map(cluster => cluster.agents.map(agent => (
                <div key={agent.id} className={`agent-toggle-card ${activeAgents.includes(agent.id) ? 'active' : ''}`} onClick={() => toggleAgent(agent.id)}>
                  <div className="agent-icon-box"><agent.icon size={16} /></div>
                  <div className="agent-info">
                    <span className="agent-name">{agent.name}</span>
                    <div className="agent-status">
                      <div className="agent-status-dot" style={{ background: activeAgents.includes(agent.id) ? '#10b981' : '#64748b', boxShadow: activeAgents.includes(agent.id) ? '0 0 8px #10b981' : 'none' }} />
                      {activeAgents.includes(agent.id) ? 'Online' : 'Standby'}
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </div>
        </div>

        {/* COLLABORATIVE PLANNER PREVIEW */}
        <div className="agent-activity-box" style={{ background: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
          <div className="activity-header" style={{ color: 'var(--accent)' }}><Users size={14} /> Collaborative Session</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>3 Peers online. Priority: Sustainability</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button className="intel-btn" style={{ flex: 1 }} onClick={() => setIsCommandCenterOpen(true)}><BarChart3 size={16} /> Command Center</button>
          <button className={`intel-btn ${isArMode ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setIsArMode(!isArMode)}><Eye size={16} /> AR Mode</button>
        </div>

        {appMode === 'logistics' && (
          <div className="logistics-vault" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(236, 72, 153, 0.05)', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>IoT Diagnostics</span>
              <div className={`status-pill ${iotStatus}`} style={{
                padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem',
                background: iotStatus === 'healthy' ? '#10b981' : '#ef4444', color: '#fff'
              }}>{iotStatus.toUpperCase()}</div>
            </div>
            <button
              className="action-btn-danger"
              style={{ width: '100%', padding: '8px', fontSize: '0.7rem' }}
              onClick={() => {
                setIotStatus('critical');
                addLog('IOT', 'CRITICAL FAULT: Engine Sensor Malfunction.');
                addLog('COORDINATOR', 'EMERGENCY REROUTE: Targeting nearest service depot.');
                // Simulate reroute logic
                if (discoveredPOIs.length > 0) {
                  const nearest = discoveredPOIs.find(p => p.type === 'fuel') || discoveredPOIs[0];
                  setMapCenter(nearest.latlng);
                }
              }}
            >
              Trigger Diagnostic Fault
            </button>
          </div>
        )}

        <div className="sustainability-widget" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Leaf size={16} color="#10b981" />
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Carbon Credits</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981' }}>{carbonCredits}</span>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Rank: Sustainability Voyager</p>
        </div>
      </div>

      <div className="map-view">
        <MapContainer center={mapCenter} zoom={5} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <ZoomControl position="bottomright" />
          <MapController center={mapCenter} onBoundsChange={setMapBounds} />

          {origin.point && <Marker position={origin.point.latlng} icon={startIcon} />}
          {destination.point && <Marker position={destination.point.latlng} icon={endIcon} />}
          {stops.map((s, i) => s.point && (
            <Marker key={i} position={s.point.latlng} icon={stopIcon}>
              <Popup>Stop {i + 1}: {s.point.name}</Popup>
            </Marker>
          ))}

          {discoveredPOIs.map((poi, i) => discovery[poi.type] && (
            <Marker key={`poi-${i}`} position={poi.latlng} icon={poiIcons[poi.type]}>
              <Popup>
                <div style={{ color: 'var(--bg-dark)', fontWeight: 'bold' }}>{poi.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{poi.details}</div>
              </Popup>
            </Marker>
          ))}

          {routes.map((route, i) => (
            <React.Fragment key={i}>
              {/* Main polyline fallback or secondary routes */}
              {selectedRouteIdx !== i && (
                <Polyline positions={route.geometry} pathOptions={{ color: route.color, weight: 3, opacity: 0.2 }} />
              )}

              {/* Highlighted active route with traffic segments */}
              {selectedRouteIdx === i && route.segments.map((seg, j) => (
                <Polyline
                  key={`seg-${j}`}
                  positions={seg.coords}
                  pathOptions={{
                    color: seg.level === 'heavy' ? 'var(--danger)' : seg.level === 'med' ? 'var(--warning)' : 'var(--primary)',
                    weight: 6,
                    opacity: 1
                  }}
                />
              ))}
            </React.Fragment>
          ))}

          {discovery.weather && (
            <>
              <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 2, repeat: Infinity }}>
                <L.SVGOverlay bounds={[[15, 70], [25, 85]]}>
                  <rect width="100%" height="100%" fill="url(#storm-gradient)" opacity="0.4" />
                  <defs>
                    <radialGradient id="storm-gradient">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>
                </L.SVGOverlay>
              </motion.div>
            </>
          )}
        </MapContainer>

        {routes.length > 0 && (
          <div className="traffic-legend">
            <div className="legend-item"><div className="legend-color" style={{ background: 'var(--danger)' }} /> Heavy Traffic</div>
            <div className="legend-item"><div className="legend-color" style={{ background: 'var(--warning)' }} /> Moderate</div>
            <div className="legend-item"><div className="legend-color" style={{ background: 'var(--primary)' }} /> Smooth</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
