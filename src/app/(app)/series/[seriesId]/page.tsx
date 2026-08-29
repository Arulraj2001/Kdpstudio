'use client';

import React from 'react';
import { SeriesDetailView } from '../../../../components/series/SeriesDetailView';

export default function SeriesDetailPage({ params }: { params?: { seriesId: string } }) {
  return <SeriesDetailView seriesId={params?.seriesId || ''} onNavigate={() => {}} />;
}
