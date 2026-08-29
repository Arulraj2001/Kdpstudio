'use client';

import React, { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, any>;
  id?: string;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data, id }) => {
  const jsonString = JSON.stringify(data);
  const scriptId = id || `jsonld-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    // Also inject/update directly in document.head for pure SPA DOM verification
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = jsonString;

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }
    };
  }, [jsonString, scriptId]);

  return (
    <script
      id={scriptId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
};
