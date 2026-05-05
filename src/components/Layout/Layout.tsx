import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css'; 

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout-container">
      <Navbar />
      <div className="content-area">
        <Sidebar />
        <main className="main-content">
          {/* Konten halaman akan di-render di sini */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;