import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { GeoJSONFeatureCollection } from '../types/api';
import { LeafletMap } from '../components/maps/LeafletMap';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EpistemicNotice } from '../components/common/EpistemicNotice';

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
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-semibold text-teal-400 uppercase tracking-wider block mb-1">
            Geospatial Intelligence Engine
          </span>
          <h3 className="text-base font-bold text-white">H3 Hexagonal Binning &amp; Empirical Bayes Rate Smoothing</h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Mitigates the Modifiable Areal Unit Problem (MAUP) and solves the Small Number Problem by shrinking
            low-exposure suburban rate spikes toward the metropolitan empirical prior (&mu;<sub>global</sub>).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded border border-teal-800/40">
            Uber H3 Res 8 &bull; PostGIS Ready
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
          <div className="lg:col-span-3">
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Cell Property Inspector
              </h4>
              <p className="text-[11px] text-slate-500 mb-4">Click any hexagon on the map to inspect exposure details.</p>

              {selectedCell ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Zone Name</span>
                    <span className="text-base font-bold text-white">{selectedCell.zone_name}</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">H3 Hex Index</span>
                    <span className="text-xs font-mono text-teal-400 break-all">{selectedCell.h3_index}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Total Incidents</span>
                      <span className="font-bold text-white text-sm">{selectedCell.incident_count}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Traffic Exposure</span>
                      <span className="font-bold text-white text-sm">{selectedCell.traffic_exposure} veh</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Raw Crash Rate:</span>
                      <span className="font-mono text-slate-300 font-bold">{selectedCell.raw_rate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">EB Smoothed Rate:</span>
                      <span className="font-mono text-teal-400 font-bold">{selectedCell.eb_smoothed_rate}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-slate-400 text-[11px]">Sparse Exposure:</span>
                      <span className={`font-mono text-[11px] ${selectedCell.is_sparse_exposure ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {selectedCell.is_sparse_exposure ? 'TRUE (SHRUNK)' : 'FALSE (ROBUST)'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 text-[11px] block mb-1">Risk Tier Classification</span>
                    <span className="w-full text-center block py-1.5 rounded-lg font-bold text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      {selectedCell.risk_tier} RISK TIER
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-8">Select a hexagon to inspect</div>
              )}
            </div>

            <EpistemicNotice
              customText="Small Number Correction: Empirical Bayes shrinkage prevents misleading false hotspots caused by small sample counts in low-exposure suburban fringes."
              sourceCitation="[Source: Cook County Spatial Risk Index & HexSpatialAggregator]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
