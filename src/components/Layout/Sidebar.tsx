import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  // Fungsi kecil untuk mengatur warna menu yang aktif
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-md font-medium transition-colors ${isActive
      ? 'bg-slate-200 text-blue-700' // Warna saat menu aktif
      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900' // Warna default
    }`;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[#fffdf2] border-r border-slate-200 p-5 shrink-0
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
      `}>
        <ul className="space-y-2 mt-12 md:mt-0">
          <li>
            <NavLink to="/dashboard" className={navLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/warga" className={navLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
              Data Warga
            </NavLink>
          </li>
          <li>
            <NavLink to="/rumah" className={navLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
              Data Rumah
            </NavLink>
          </li>
          <li>
            <NavLink to="/kegiatan" className={navLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
              Iuran
            </NavLink>
          </li>
          <li>
            <NavLink to="/pengaturan" className={navLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
              Pengaturan
            </NavLink>
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;