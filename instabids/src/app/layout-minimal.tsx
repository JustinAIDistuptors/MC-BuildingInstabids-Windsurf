export default function MinimalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '20px' }}>
          <h1 style={{ marginBottom: '20px' }}>Minimal Layout</h1>
          {children}
        </div>
      </body>
    </html>
  );
}
