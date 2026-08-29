'use client';

import React from 'react';
import { ContactPageView } from '../../../components/public/ContactPageView';

export default function ContactPage() {
  return (
    <ContactPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
