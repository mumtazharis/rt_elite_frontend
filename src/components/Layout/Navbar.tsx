import { useState, useRef, useEffect } from "react";
import { Menu } from "lucide-react";

interface NavbarProps {
  onLogout?: () => void;
  toggleSidebar: () => void;
}

const Navbar = ({ onLogout, toggleSidebar }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="h-15 bg-[#fffdf2] text-slate-700 flex items-center justify-between px-5 shadow-sm z-40 shrink-0 border-b border-slate-200">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600"
          title="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-bold tracking-wide text-blue-800">
          RT Elite
        </h2>
      </div>

      {onLogout && (
        <div className="relative" ref={dropdownRef}>
          {/* tombol 3 titik */}
          <button
            onClick={() => setOpen(!open)}
            className="text-xl px-2 py-1 rounded hover:bg-gray-200"
          >
            ⋮
          </button>

          {/* dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md">
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;