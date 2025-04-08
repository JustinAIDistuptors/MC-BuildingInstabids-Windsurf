// This is a Server Component page - no "use client" directive
export default function SimpleBidPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="mb-4">This is a simplified bid form that will be more stable.</p>
        
        {/* Simple link that will work even if JS fails */}
        <div className="mb-4">
          <a 
            href="/dashboard/homeowner/projects" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Projects
          </a>
        </div>
        
        <div className="mb-4">
          <p>Choose your project type:</p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <a 
              href="/simple-bid/details?type=repair" 
              className="border p-4 rounded text-center hover:bg-gray-50"
            >
              Repair Project
            </a>
            <a 
              href="/simple-bid/details?type=new" 
              className="border p-4 rounded text-center hover:bg-gray-50"
            >
              New Construction
            </a>
            <a 
              href="/simple-bid/details?type=renovation" 
              className="border p-4 rounded text-center hover:bg-gray-50"
            >
              Renovation
            </a>
            <a 
              href="/simple-bid/details?type=other" 
              className="border p-4 rounded text-center hover:bg-gray-50"
            >
              Other Project
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
