export default function TestBarePage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bare Test Page</h1>
      <p>This is a minimal test page with no imports or external dependencies.</p>
      <p>If you can see this, the basic Next.js App Router is working.</p>
      <p style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        Time now: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}
