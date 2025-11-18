import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-300 font-medium bg-white/80 backdrop-blur-md">
      <Link to="/" className="text-2xl !text-gray-800">
        Bit-Bite
      </Link>
    </nav>
  );
}