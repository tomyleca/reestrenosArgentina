import React from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * Componente para inyectar datos estructurados JSON-LD en la página.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
