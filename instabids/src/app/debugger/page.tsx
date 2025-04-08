'use client';

export default function DebuggerPage() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Browser Debugger</h1>
      
      <p className="mb-4">
        Open the browser console (F12) and check for any errors or infinite loop messages that might be causing the form to freeze.
      </p>
      
      <p>
        If you see errors related to "maximum call stack size exceeded" or similar, it indicates an infinite loop in the application code.
      </p>
    </div>
  );
}
