import React from 'react';
import { BoundingBox } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Crosshair, 
  Info, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface FlaggedRegionPanelProps {
  regions: BoundingBox[];
  selectedBoxId?: string | null;
  onSelectBox: (id: string | null) => void;
}

export const FlaggedRegionPanel: React.FC<FlaggedRegionPanelProps> = ({
  regions,
  selectedBoxId,
  onSelectBox
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Flagged Areas</h3>
            <p className="text-[11px] text-slate-400">
              {regions.length > 0
                ? `${regions.length} suspicious or inspection region(s) detected`
                : 'No anomalous regions detected by forensic analysis'}
            </p>
          </div>
        </div>

        {regions.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono">
            {regions.length}
          </span>
        )}
      </div>

      {/* Flagged Regions List */}
      {regions.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1.5 py-6">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
          <p className="text-xs font-bold text-slate-200">No Flagged Tamper Regions</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Document template structure and pixel uniformity pass standard forensic checks.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {regions.map((region, index) => {
            const isSelected = selectedBoxId === region.id;
            const isCritical = region.severity === 'critical';
            const isHigh = region.severity === 'high';
            const isMedium = region.severity === 'medium';

            const badgeBg = isCritical || isHigh 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
              : isMedium 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

            return (
              <motion.div
                key={region.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectBox(isSelected ? null : region.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 text-left ${
                  isSelected 
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/30' 
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">
                        {index + 1}. {region.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeBg}`}>
                        {region.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {region.description}
                    </p>

                    {(region.detectedValue || region.expectedValue) && (
                      <div className="pt-1.5 space-y-0.5 text-[11px] font-mono">
                        {region.detectedValue && (
                          <div className="text-rose-300 flex items-center gap-1.5">
                            <span className="text-slate-500 font-sans text-[10px]">Detected:</span>
                            <span className="bg-rose-950/60 px-1.5 py-0.5 rounded font-bold">{region.detectedValue}</span>
                          </div>
                        )}
                        {region.expectedValue && (
                          <div className="text-emerald-300 flex items-center gap-1.5">
                            <span className="text-slate-500 font-sans text-[10px]">Expected:</span>
                            <span className="bg-emerald-950/60 px-1.5 py-0.5 rounded">{region.expectedValue}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 hover:text-white pt-1">
                    <Crosshair className={`w-4 h-4 ${isSelected ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Confidence: <strong className="text-slate-300">{region.confidence}%</strong></span>
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    {isSelected ? 'Focused in Viewer' : 'Click to highlight in viewer'}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
