// Static 404 page - no edge runtime to avoid pre-rendering crash
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-[#D20A0A] mb-4">404</h1>
      <p className="text-xl text-[#9CA3AF] mb-8">Page not found</p>
      <a
        href="/"
        className="bg-[#D20A0A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#b00808] transition-colors"
      >
        Go Home
      </a>
    </div>
  );
}
