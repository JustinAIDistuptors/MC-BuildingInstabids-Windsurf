export default function StandalonePage() {
  return (
    <html>
      <head>
        <title>Standalone Page</title>
      </head>
      <body>
        <div style={{ 
          fontFamily: 'Arial, sans-serif',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <h1 style={{ 
            color: '#333',
            fontSize: '24px',
            marginBottom: '20px'
          }}>
            Standalone Test Page
          </h1>
          <p style={{ 
            fontSize: '16px',
            lineHeight: '1.5',
            color: '#666'
          }}>
            This is a completely standalone page with no dependencies or imports.
            If you can see this content, we can use this as a starting point to rebuild the bid card page.
          </p>
        </div>
      </body>
    </html>
  );
}
