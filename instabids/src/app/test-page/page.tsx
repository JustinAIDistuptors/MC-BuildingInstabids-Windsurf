'use client';

export default function TestPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Test Page</h1>
      <p>This is a simple test page to verify Next.js is working correctly.</p>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          marginTop: '1rem',
          cursor: 'pointer'
        }}
      >
        Click Me
      </button>
    </div>
  );
}
