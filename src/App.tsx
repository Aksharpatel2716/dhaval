import React, { useState, useEffect } from 'react';
import { db, getProductStatus, isSupabaseConnected } from './services/db';
import { ToastMessage, NotificationToast } from './components/NotificationToast';
import { POS } from './pages/POS';
import { Stock } from './pages/Stock';
import { SalesHistory } from './pages/SalesHistory';
import { Settings } from './pages/Settings';
import {
  ShoppingCart,
  Package,
  FileText,
  Settings as SettingsIcon,
  Cloud,
  HardDrive,
} from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState<'POS' | 'Stock' | 'Hisab' | 'Settings'>('POS');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lowStockAlertCount, setLowStockAlertCount] = useState(0);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  const triggerToast = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check alerts & connection status
  const checkAlerts = async () => {
    try {
      const prods = await db.getProducts();
      const count = prods.filter((p) => getProductStatus(p) !== 'In Stock').length;
      setLowStockAlertCount(count);
      setIsCloudConnected(isSupabaseConnected());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAlerts();
  }, [currentPage]);

  const handleNavigate = (page: 'POS' | 'Stock' | 'Hisab' | 'Settings') => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navTabs = [
    { id: 'POS', label: 'Billing', icon: ShoppingCart },
    { id: 'Stock', label: 'Stock', icon: Package, badge: lowStockAlertCount },
    { id: 'Hisab', label: 'Hisab', icon: FileText },
    { id: 'Settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-purple-600 selection:text-white">
      {/* Dynamic Toast Notifications */}
      <NotificationToast toasts={toasts} onRemove={removeToast} />

      {/* Main Mobile App Frame */}
      <div className="w-full max-w-lg min-h-screen flex flex-col bg-slate-950/90 relative shadow-2xl border-x border-white/5">
        
        {/* ========================================================================= */}
        {/* MOBILE TOP HEADER BAR */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-white/10 px-4 py-2.5 flex items-center justify-between backdrop-blur-xl shadow-md">
          {/* Shop Brand & Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-lg shadow-sm">
              <span>🍨</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wider">Creamee Ballz</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-purple-300 font-bold block leading-none">
                Mobile POS & Stock
              </span>
            </div>
          </div>

          {/* Right Status Badge: Cloud/Local Status & Active Page */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                isCloudConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {isCloudConnected ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              <span>{isCloudConnected ? 'Cloud' : 'Offline'}</span>
            </span>

            <span className="text-[10px] font-black px-2.5 py-1 bg-purple-600/25 text-purple-300 border border-purple-500/40 rounded-xl">
              {currentPage === 'POS' ? '🛒 Billing' : currentPage === 'Stock' ? '📦 Stock' : currentPage === 'Hisab' ? '📊 Hisab' : '⚙️ Setup'}
            </span>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN MOBILE VIEWPORT */}
        {/* ========================================================================= */}
        <main className="flex-1 p-3 sm:p-4 pb-28">
          {currentPage === 'POS' && (
            <POS triggerToast={triggerToast} onNavigate={handleNavigate as any} />
          )}
          {currentPage === 'Stock' && (
            <Stock triggerToast={triggerToast} />
          )}
          {currentPage === 'Hisab' && (
            <SalesHistory triggerToast={triggerToast} />
          )}
          {currentPage === 'Settings' && (
            <Settings triggerToast={triggerToast} onDbReset={checkAlerts} />
          )}
        </main>

        {/* ========================================================================= */}
        {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly with Safe Area Inset) */}
        {/* ========================================================================= */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-950/95 border-t border-white/10 backdrop-blur-2xl px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex justify-around items-center z-40 shadow-2xl">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 relative active:scale-90 ${
                  isActive ? 'text-purple-400 font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-transform ${
                    isActive ? 'bg-purple-600/25 scale-110 shadow-sm shadow-purple-900/40 border border-purple-500/30' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                </div>
                <span className="text-[10px] font-bold mt-1 tracking-tight">
                  {tab.label}
                </span>

                {/* Notification / Low Stock Alert Badge */}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute top-1 right-3 sm:right-6 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default App;
