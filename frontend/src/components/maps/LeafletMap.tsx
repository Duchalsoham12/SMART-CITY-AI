import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoJSONFeatureCollection } from '../../types/api';

interface LeafletMapProps {
  hexagons?: GeoJSONFeatureCollection;
  hotspots?: GeoJSONFeatureCollection;
  center?: [number, number];
  zoom?: number;
  onSelectFeature?: (properties: Record<string, any>) => void;
  selectedH3Index?: string;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  hexagons,
  hotspots,
  center = [41.8827, -87.6233],
  zoom = 13,
  onSelectFeature,
  selectedH3Index,
  height = '500px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const hotspotLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    }).setView(center, zoom);

    // CartoDB Dark Matter Tile Layer (Dark enterprise theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Hexagonal Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    if (hexagons && hexagons.features && hexagons.features.length > 0) {
      const getFillColor = (tier: string) => {
        switch (tier) {
          case 'CRITICAL':
            return '#f43f5e';
          case 'HIGH':
            return '#fb923c';
          case 'MEDIUM':
            return '#facc15';
          default:
            return '#2dd4bf';
        }
      };

      const layer = L.geoJSON(hexagons as any, {
        style: (feature) => {
          const isSelected = selectedH3Index && feature?.properties?.h3_index === selectedH3Index;
          const tier = feature?.properties?.risk_tier || 'LOW';
          return {
            fillColor: getFillColor(tier),
            weight: isSelected ? 3 : 1.5,
            opacity: 1,
            color: isSelected ? '#ffffff' : '#0f172a',
            fillOpacity: isSelected ? 0.75 : 0.45,
          };
        },
        onEachFeature: (feature, l) => {
          const props = feature.properties;
          l.bindTooltip(
            `<div class="text-xs p-1 font-sans">
              <strong>${props.zone_name}</strong><br/>
              H3: ${props.h3_index}<br/>
              EB Rate: ${props.eb_smoothed_rate}<br/>
              Incidents: ${props.incident_count}
            </div>`,
            { sticky: true }
          );
          l.on({
            click: () => {
              if (onSelectFeature) onSelectFeature(props);
            },
          });
        },
      }).addTo(map);

      geojsonLayerRef.current = layer;
    }
  }, [hexagons, selectedH3Index, onSelectFeature]);

  // Update Hotspots Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hotspotLayerRef.current) {
      map.removeLayer(hotspotLayerRef.current);
      hotspotLayerRef.current = null;
    }

    if (hotspots && hotspots.features && hotspots.features.length > 0) {
      const group = L.layerGroup();
      hotspots.features.forEach((feat) => {
        const [lon, lat] = feat.geometry.coordinates;
        const marker = L.circleMarker([lat, lon], {
          radius: 7,
          fillColor: '#ef4444',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });

        marker.bindPopup(
          `<div class="text-xs font-sans text-slate-900">
            <strong>${feat.properties.severity_label || 'Cluster Hotspot'}</strong><br/>
            Z-score: ${feat.properties.z_score || 'N/A'}<br/>
            Incident Density: ${feat.properties.incident_count || 'N/A'}
          </div>`
        );
        group.addLayer(marker);
      });

      group.addTo(map);
      hotspotLayerRef.current = group;
    }
  }, [hotspots]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 space-y-1 shadow-lg pointer-events-auto">
        <div className="font-semibold text-white mb-1.5 flex items-center justify-between gap-4">
          <span>Risk Layers</span>
          <span className="text-[10px] text-teal-400 font-mono">H3 Res 8</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block"></span>
          <span>Critical Risk (EB &gt; 0.008)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block"></span>
          <span>High Risk (EB &gt; 0.005)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block"></span>
          <span>Medium Risk (EB &gt; 0.002)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-teal-400 inline-block"></span>
          <span>Low Baseline</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white inline-block"></span>
          <span>DBSCAN Cluster Epicenter</span>
        </div>
      </div>
    </div>
  );
};
