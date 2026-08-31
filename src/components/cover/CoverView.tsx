import React from 'react';
import { CoverBuilderView } from './CoverBuilderView';

export const CoverView: React.FC = () => {
  return (
    <div id="cover-builder-container" className="h-[calc(100vh-5rem)] -m-4 sm:-m-6 lg:-m-8 flex flex-col overflow-hidden bg-slate-100/70">
      <CoverBuilderView />
    </div>
  );
};
