export const runtime = "edge";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-[#E8FF00] mb-4">404</h1>
      <p className="text-xl text-[#9CA3AF] mb-8">Page not found</p>
      <a
        href="/"
        className="bg-[#E8FF00] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#d4eb00] transition-colors"
      >
        Go Home
      </a>
    </div>
  );
}
