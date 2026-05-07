import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const [isIuranOpen, setIsIuranOpen] = useState(location.pathname.startsWith('/iuran'));
  const [isKeuanganOpen, setIsKeuanganOpen] = useState(location.pathname.startsWith('/keuangan'));

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-md font-medium transition-colors ${isActive
      ? 'bg-slate-200 text-blue-700'
      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
    }`;

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-1.5 rounded-md text-sm font-medium transition-colors pl-8 ${isActive
      ? 'bg-slate-100 text-blue-600'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
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
            <button 
              onClick={() => setIsIuranOpen(!isIuranOpen)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-md font-medium transition-colors ${
                location.pathname.startsWith('/iuran') ? 'bg-slate-200 text-blue-700' : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Iuran</span>
              {isIuranOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isIuranOpen && (
              <ul className="mt-1 space-y-1 ml-4 border-l border-slate-200">
                <li>
                  <NavLink to="/iuran/setting" className={subNavLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
                    Setting Jadwal
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/iuran/tagihan" className={subNavLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
                    Tagihan
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/iuran/pembayaran" className={subNavLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
                    Pembayaran
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          <li>
            <button 
              onClick={() => setIsKeuanganOpen(!isKeuanganOpen)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-md font-medium transition-colors ${
                location.pathname.startsWith('/keuangan') ? 'bg-slate-200 text-blue-700' : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Keuangan</span>
              {isKeuanganOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isKeuanganOpen && (
              <ul className="mt-1 space-y-1 ml-4 border-l border-slate-200">
                <li>
                  <NavLink to="/keuangan/ringkasan" className={subNavLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
                    Ringkasan
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/keuangan/pemasukan" className={subNavLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
                    Pemasukan
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/keuangan/pengeluaran" className={subNavLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
                    Pengeluaran
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;