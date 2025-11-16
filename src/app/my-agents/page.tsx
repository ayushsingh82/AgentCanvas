export default function MyAgentsPage() {
  return (
    <div className="min-h-screen bg-white font-sans tracking-tight flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-black mb-4 text-black">My Agents</h1>
        <p className="text-sm text-black mb-8">
          No agents created yet.
        </p>
        <button className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-8 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px]">
          Create Agent
        </button>
      </div>
    </div>
  );
}


