import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { GeoJSONFeatureCollection } from '../types/api';
import { LeafletMap } from '../components/maps/LeafletMap';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';
import { Compass, Layers, MapPin } from 'lucide-react';

export const GeospatialExplorer: React.FC = () => {
  const [hexagons, setHexagons] = useState<GeoJSONFeatureCollection | null>(null);
  const [hotspots, setHotspots] = useState<GeoJSONFeatureCollection | null>(null);
  const [selectedCell, setSelectedCell] = useState<Record<string, any>>({
    zone_name: 'Loop Downtown',
    h3_index: '882685623ffffff',
    incident_count: 18,
    traffic_exposure: 2500,
    raw_rate: 0.0072,
    eb_smoothed_rate: 0.0084,
    is_sparse_exposure: false,
    risk_tier: 'CRITICAL',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hexData, hotData] = await Promise.all([
        ApiClient.getHexagonalRiskGrid(),
        ApiClient.getSpatialHotspots(),
      ]);
      setHexagons(hexData);
      setHotspots(hotData);
      if (hexData.features.length > 0) {
        setSelectedCell(hexData.features[0].properties);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load geospatial vector layers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLayers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider">
                Geospatial Intelligence Engine
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Uber H3 Res 8
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">H3 Hexagonal Binning &amp; Empirical Bayes Rate Smoothing</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Mitigates the Modifiable Areal Unit Problem (MAUP) and solves the Small Number Problem by shrinking low-exposure suburban rate spikes toward the metropolitan empirical prior (&mu;<sub>global</sub>).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-blue-300 bg-blue-950/80 px-3 py-1.5 rounded-lg border border-blue-800/40 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            PostGIS Vectorized
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Rendering H3 vector polygons and spatial cluster coordinates..." />
      ) : error ? (
        <ErrorState error={error} onRetry={loadLayers} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Interactive Leaflet Map (3 Cols) */}
          <div className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-lg">
            <LeafletMap
              hexagons={hexagons || undefined}
              hotspots={hotspots || undefined}
              selectedH3Index={selectedCell?.h3_index}
              onSelectFeature={(props) => setSelectedCell(props)}
              height="580px"
            />
          </div>

          {/* Drill-down Hex Cell Property Inspector (1 Col) */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/80">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Cell Property Inspector
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">Click any hexagon on the map to inspect exposure details.</p>

              {selectedCell ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono font-medium">Zone Name</span>
                    <span className="text-base font-bold text-white tracking-tight">{selectedCell.zone_name}</span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono font-medium">H3 Hex Index</span>
                    <span className="text-xs font-mono text-blue-400 break-all">{selectedCell.h3_index}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px] font-medium">Total Incidents</span>
                      <span className="font-bold text-white text-sm font-mono">{selectedCell.incident_count}</span>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px] font-medium">Traffic Exposure</span>
                      <span className="font-bold text-white text-sm font-mono">{selectedCell.traffic_exposure} veh</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Raw Crash Rate:</span>
                      <span className="font-mono text-slate-300 font-bold">{selectedCell.raw_rate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">EB Smoothed Rate:</span>
                      <span className="font-mono text-blue-400 font-bold">{selectedCell.eb_smoothed_rate}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 text-[11px]">Sparse Exposure:</span>
                      <span className={`font-mono text-[11px] font-bold ${selectedCell.is_sparse_exposure ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {selectedCell.is_sparse_exposure ? 'TRUE (SHRUNK)' : 'FALSE (ROBUST)'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 text-[11px] block mb-1.5 font-medium">Risk Tier Classification</span>
                    <span className="w-full text-center block py-2 rounded-xl font-bold text-xs bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      {selectedCell.risk_tier} RISK TIER
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-6">Select a hexagon to inspect metrics</div>
              )}
            </div>

            <EpistemicNotice
              temporalClassification="MODEL_PREDICTION"
              customText="Empirical Bayes Poisson-gamma shrinkage applied to raw crash counts across Uber H3 Res 8 hexagons."
              sourceCitation="[Source: Uber H3 Spatial Binning Engine via PostGIS GeoJSON API]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
