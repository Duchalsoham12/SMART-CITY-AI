import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { ColumnMappingItem, DatasetUploadResponse } from '../../types/api';

interface DatasetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const DatasetUploadModal: React.FC<DatasetUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'validating' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('traffic');
  const [customName, setCustomName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mappings, setMappings] = useState<ColumnMappingItem[]>([]);
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});
  const [uploadResult, setUploadResult] = useState<DatasetUploadResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    if (!customName) {
      const baseName = selectedFile.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      setCustomName(baseName);
    }

    // Inspect columns
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const detected = await apiClient.inspectDatasetColumns(formData);
      setMappings(detected);
      const initialMap: Record<string, string> = {};
      detected.forEach((m) => {
        initialMap[m.source_column] = m.suggested_target;
      });
      setCustomMappings(initialMap);
      setStep('mapping');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to inspect file columns.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleDataset = () => {
    const sampleCsv = `segment_id,street_name,speed,start_latitude,start_longitude,observation_time_utc
101,Michigan Ave & Wacker Dr,24.5,41.8885,-87.6243,2026-09-25T14:00:00Z
102,Wacker Dr & Clark St,18.2,41.8890,-87.6250,2026-09-25T14:05:00Z
103,State St & Madison St,11.4,41.8820,-87.6278,2026-09-25T14:10:00Z
104,Dearborn St & Adams St,28.0,41.8795,-87.6295,2026-09-25T14:15:00Z
105,Halsted St & Fulton St,15.8,41.8867,-87.6472,2026-09-25T14:20:00Z`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const sampleFile = new File([blob], 'chicago_sample_telemetry.csv', { type: 'text/csv' });
    handleFileChange(sampleFile);
  };

  const handleExecuteUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setStep('validating');
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataset_name', customName);
      formData.append('category', category);
      formData.append('column_mapping', JSON.stringify(customMappings));

      const result = await apiClient.uploadDataset(formData);
      setUploadResult(result);
      setStep('result');
      onUploadSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Preflight upload validation failed.');
      setStep('mapping');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStep('upload');
    setUploadResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-base shadow-sm">
              📁
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Dataset Ingestion &amp; Preflight Validation
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Gate v1.0
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload CSV, XLSX, or JSON telemetry with semantic column mapping and zero-silent-drop audit.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD OR SAMPLE SELECTION */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Dataset Domain:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'traffic', label: 'Traffic Flow', icon: '🚦' },
                    { id: 'accidents', label: 'Accidents', icon: '🛡️' },
                    { id: 'air_quality', label: 'Air Quality', icon: '🍃' },
                    { id: 'custom', label: 'Custom Stream', icon: '⚡' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        category === cat.id
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-950/40 rounded-2xl p-8 text-center transition-colors cursor-pointer group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv,.xlsx,.xls,.json';
                  input.onchange = (e: any) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl mx-auto mb-3 transition-colors">
                  📤
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Drop your CSV, Excel, or JSON file here
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  or click to browse from your computer (Max recommended: 50MB)
                </p>
                <span className="inline-block mt-3 px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-mono rounded-lg border border-slate-700">
                  Supports .csv &bull; .xlsx &bull; .json
                </span>
              </div>

              {/* Sample Dataset Quick Loader */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">
                      Don't have a dataset ready?
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Instantly load our sample Chicago Arterial Telemetry batch to test the pipeline.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleDataset}
                  className="px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Load Sample Stream
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SMART SEMANTIC COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Smart Column Mapping
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verify detected source fields and confirm mapping to SmartCityAI standard schemas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Change File
                </button>
              </div>

              {/* Dataset Name Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Dataset Identifier Name:
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="e.g. rush_hour_arterial_speeds"
                />
              </div>

              {/* Column Mapping Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-3">Source Column</th>
                      <th className="p-3">Data Type</th>
                      <th className="p-3">Sample Value</th>
                      <th className="p-3">Mapped Target Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans text-[11px]">
                    {mappings.map((m) => (
                      <tr key={m.source_column} className="hover:bg-slate-900/30">
                        <td className="p-3 font-semibold text-slate-200 font-mono">
                          {m.source_column}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">
                          {m.data_type}
                        </td>
                        <td className="p-3 text-slate-400 truncate max-w-[120px]">
                          {m.sample_values[0] || '—'}
                        </td>
                        <td className="p-3">
                          <select
                            value={customMappings[m.source_column] || m.suggested_target}
                            onChange={(e) =>
                              setCustomMappings({
                                ...customMappings,
                                [m.source_column]: e.target.value,
                              })
                            }
                            className="bg-slate-900 border border-slate-700 text-blue-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-400"
                          >
                            <option value="speed">speed (Speed in mph)</option>
                            <option value="observation_time_utc">observation_time_utc (Timestamp)</option>
                            <option value="start_latitude">start_latitude (GPS Lat)</option>
                            <option value="start_longitude">start_longitude (GPS Lon)</option>
                            <option value="street_name">street_name (Corridor Name)</option>
                            <option value="segment_id">segment_id (Unique ID)</option>
                            <option value="pollutant_value">pollutant_value (AQI / Concentration)</option>
                            <option value="severity_tier">severity_tier (Hazard Rank)</option>
                            <option value="">-- Ignore Column --</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteUpload}
                  disabled={isLoading}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-950/40 flex items-center gap-2"
                >
                  <span>🚀</span> Run Preflight Validation Gate
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATING ANIMATION */}
          {step === 'validating' && (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Executing Preflight Data Quality Audit...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Auditing completeness, coordinate validity boundaries, target leakage separation, and computing deterministic SHA-256 fingerprint.
              </p>
            </div>
          )}

          {/* STEP 4: PREFLIGHT RESULTS & QUALITY AUDIT REPORT */}
          {step === 'result' && uploadResult && (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="p-4 bg-blue-950/40 border border-blue-500/40 rounded-2xl flex items-start gap-3">
                <span className="text-2xl mt-0.5">✅</span>
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-blue-300">
                    Dataset Registered Successfully
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {uploadResult.message}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">
                      Version: {uploadResult.version_id}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 truncate max-w-xs">
                      SHA-256: {uploadResult.sha256_hash.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Quality Dimensions Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Completeness
                  </span>
                  <div className="text-lg font-bold text-blue-300 font-mono mt-0.5">
                    {uploadResult.quality_report.completeness_score}%
                  </div>
                  <span className="text-[9px] text-slate-500">Target &ge; 95%</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Validity
                  </span>
                  <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">
                    {uploadResult.quality_report.validity_score}%
                  </div>
                  <span className="text-[9px] text-slate-500">Target &ge; 98%</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Uniqueness
                  </span>
                  <div className="text-lg font-bold text-indigo-300 font-mono mt-0.5">
                    {uploadResult.quality_report.uniqueness_score}%
                  </div>
                  <span className="text-[9px] text-slate-500">Target &ge; 99%</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Consistency
                  </span>
                  <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                    {uploadResult.quality_report.consistency_score}%
                  </div>
                  <span className="text-[9px] text-slate-500">Target &ge; 90%</span>
                </div>
              </div>

              {/* Zero-Silent-Deletion Audit Banner */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">Ingest Summary:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <strong>{uploadResult.valid_rows}</strong> valid rows ingested into analytical store &bull;{' '}
                    <strong className="text-amber-400">{uploadResult.quarantined_rows}</strong> non-conforming rows quarantined in <code className="text-slate-300">data/quarantine/</code> for auditing.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-lg shrink-0">
                  APPROVED
                </span>
              </div>

              {/* Preview Records Table */}
              {uploadResult.preview_records.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Validated Telemetry Preview:
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto max-h-48">
                    <table className="w-full text-left text-[11px] whitespace-nowrap">
                      <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                        <tr>
                          {Object.keys(uploadResult.preview_records[0]).map((key) => (
                            <th key={key} className="p-2.5 px-3">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[10px] text-slate-300">
                        {uploadResult.preview_records.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/30">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="p-2.5 px-3">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-950/40"
                >
                  Done &amp; View Catalog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
