'use client';

import React from 'react';

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <p>This is a simple test page to verify that basic rendering is working.</p>
      <div className="mt-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => alert('Button clicked!')}
        >
          Click Me
        </button>
      </div>
    </div>
  );
}
