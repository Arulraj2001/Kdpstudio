import React from 'react';
import { CoverConfig } from '../../types';

interface CoverPreviewProps {
  config?: Partial<CoverConfig>;
}

export const CoverPreview: React.FC<CoverPreviewProps> = ({ config }) => {
  return (
    <div className="w-full aspect-3/2 bg-slate-900 rounded-xl p-4 flex items-center justify-center text-white text-xs">
      <div className="text-center">
        <p className="font-bold text-sm">{config?.titleText || 'Cover Preview Canvas'}</p>
        <p className="text-[11px] text-slate-400 mt-1">{config?.authorText || 'KDP Print Ready Dimensions'}</p>
      </div>
    </div>
  );
};
