'use client';

import Link from 'next/link';

export default function Navigator() {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 bg-white shadow-lg rounded-bl-lg border border-gray-200">
      <div className="flex flex-col gap-2">
        <Link 
          href="/dashboard/homeowner"
          className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Dashboard
        </Link>
        <Link 
          href="/test-messaging"
          className="px-3 py-2 bg-purple-500 text-white rounded text-sm font-medium hover:bg-purple-600 transition-colors"
        >
          Test Messaging
        </Link>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/dashboard/homeowner';
          }}
          className="px-3 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Reset & Go to Dashboard
        </button>
      </div>
    </div>
  );
}
