'use client';

import React from 'react';
import { MyBooksView } from '../../../components/books/MyBooksView';

export default function BooksPage() {
  const handleNavigate = (route: string) => {
    window.location.href = `/${route}`;
  };

  return (
    <MyBooksView
      onNewBook={() => { window.location.href = '/studio'; }}
      onNavigateToRoute={handleNavigate as any}
      onOpenPublishChecklist={(id) => { window.location.href = `/publish?id=${id}`; }}
    />
  );
}
