import React, { useState, useEffect } from 'react';
import {
  saveSupabaseConfig,
  getSupabaseConfig,
  isSupabaseConnected,
  seedLocalDatabase,
  db,
} from '../services/db';
import { ShopSettings } from '../types';
import {
  Store,
  Database,
  Link,
  RefreshCw,
  AlertTriangle,
  Download,
  Upload,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface SettingsProps {
  triggerToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onDbReset?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ triggerToast, onDbReset }) => {
  // Shop Settings State
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shop_name: 'Creamee Ballz 🍨',
    tagline: 'Fresh & Delicious Creamee Ballz 🍨',
    phone: '+91 91068 35321',
    address: 'Main Bazaar Road, Gujarat, India',
    upi_id: 'creameeballz@upi',
  });

  // Supabase Sync State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    // Load Shop Settings
    const shop = db.getShopSettings();
    setShopSettings(shop);

    // Load Supabase Config
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
    setIsConnected(isSupabaseConnected());
  }, []);

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.saveShopSettings(shopSettings);
      triggerToast('Shop profile updated successfully! 🍦', 'success');
    } catch {
      triggerToast('Failed to save shop settings', 'error');
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
      const connected = isSupabaseConnected();
      setIsConnected(connected);

      if (connected) {
        triggerToast('Connected to Supabase Cloud Database! ⚡', 'success');
      } else if (supabaseUrl.trim() && supabaseKey.trim()) {
        triggerToast('Invalid Supabase keys. Using Local Offline Storage.', 'warning');
      } else {
        triggerToast('Supabase disconnected. Using Local Offline Storage.', 'info');
      }
      if (onDbReset) onDbReset();
    } catch {
      triggerToast('Database configuration failed', 'error');
    }
  };

  const handleExportBackup = () => {
    try {
      const dataStr = db.exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `icecream_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('Backup file downloaded successfully! 📁', 'success');
    } catch {
      triggerToast('Failed to export backup', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = db.importAllData(content);
        if (success) {
          triggerToast('Data restored successfully! ⚡', 'success');
          if (onDbReset) onDbReset();
          setShopSettings(db.getShopSettings());
        } else {
          triggerToast('Invalid backup file format', 'error');
        }
      } catch {
        triggerToast('Failed to restore backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const handleWipeAllData = async () => {
    setIsWiping(true);
    try {
      await db.wipeAllData(true);
      triggerToast('All data deleted! Database is 100% clean and ready for fresh items 🧹✨', 'success');
      setShowWipeConfirm(false);
      if (onDbReset) onDbReset();
    } catch {
      triggerToast('Failed to clear database', 'error');
    } finally {
      setIsWiping(false);
    }
  };

  const handleResetDatabase = () => {
    try {
      seedLocalDatabase(true);
      triggerToast('Database reset with sample ice cream flavors! 🍦', 'success');
      setShowResetConfirm(false);
      setShopSettings(db.getShopSettings());
      if (onDbReset) onDbReset();
    } catch {
      triggerToast('Reset failed', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-8 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>⚙️ Settings</span>
        </h1>
        <p className="text-xs text-slate-400">Shop branding, UPI details, and data backup</p>
      </div>

      {/* 1. Shop Profile Settings */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Store className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-black text-white uppercase">Shop Profile</h3>
            <p className="text-[10px] text-slate-400">This information will appear on print receipts and WhatsApp bills</p>
          </div>
        </div>

        <form onSubmit={handleSaveShopSettings} className="space-y-3">
          <div>
            <label className="text-xs text-slate-300 font-bold block mb-1">Shop / Parlor Name *</label>
            <input
              type="text"
              required
              value={shopSettings.shop_name}
              onChange={(e) => setShopSettings({ ...shopSettings, shop_name: e.target.value })}
              placeholder="e.g. Creamee Ballz 🍨"
              className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-bold block mb-1">Tagline / Slogan</label>
            <input
              type="text"
              value={shopSettings.tagline}
              onChange={(e) => setShopSettings({ ...shopSettings, tagline: e.target.value })}
              placeholder="e.g. Fresh & Delicious Ice Creams 🍦"
              className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">Phone / Mobile No. *</label>
              <input
                type="text"
                required
                value={shopSettings.phone}
                onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                placeholder="+91 91068 35321"
                className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">UPI ID (for QR Code)</label>
              <input
                type="text"
                value={shopSettings.upi_id || ''}
                onChange={(e) => setShopSettings({ ...shopSettings, upi_id: e.target.value })}
                placeholder="shopname@upi"
                className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-bold block mb-1">Shop Address</label>
            <input
              type="text"
              value={shopSettings.address}
              onChange={(e) => setShopSettings({ ...shopSettings, address: e.target.value })}
              placeholder="e.g. Main Bazaar Road, Gujarat, India"
              className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-black transition shadow-md shadow-purple-900/30 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Shop Details</span>
          </button>
        </form>
      </div>

      {/* 2. Data Backup & Restore */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Download className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-black text-white uppercase">Data Backup & Restore</h3>
            <p className="text-[10px] text-slate-400">Export or import your entire sales and product catalog</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportBackup}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Backup (JSON)</span>
          </button>

          <label className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Restore Backup File</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* 3. Supabase Cloud Sync (Optional) */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-black text-white uppercase">Supabase Cloud Sync</h3>
              <p className="text-[10px] text-slate-400">Optional online sync across multiple devices</p>
            </div>
          </div>
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-950 text-slate-400 border border-white/10'
            }`}
          >
            {isConnected ? '⚡ CLOUD CONNECTED' : '📁 LOCAL OFFLINE MODE'}
          </span>
        </div>

        <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
          <div>
            <label className="text-xs text-slate-300 font-bold block mb-1">Supabase Project URL</label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-bold block mb-1">Supabase Anon Public Key</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Link className="w-4 h-4" />
            <span>Save Cloud Connection</span>
          </button>
        </form>
      </div>

      {/* 4. Delete All Data (Fresh Start) */}
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" />
          <div>
            <h3 className="text-sm font-black text-white">Delete All Stock & Hisab (નવી શરૂઆત)</h3>
            <p className="text-[11px] text-slate-400">Clear all previous test products, stock, sales bills & kharcha to add your fresh new items</p>
          </div>
        </div>
        <p className="text-xs text-rose-300/80 bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/20 leading-relaxed">
          ⚠️ <strong>Clean Slate:</strong> This will delete all products from stock, all sales invoices, stock audit history, and expense records.
        </p>
        <button
          onClick={() => setShowWipeConfirm(true)}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-rose-950"
        >
          <Trash2 className="w-4 h-4" />
          <span>Wipe All Data & Start Fresh 🧹</span>
        </button>
      </div>

      {/* 5. Reset to Demo Sample Flavors */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Reset to Default Sample Flavors</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Restore the initial 5 sample demo flavors (Mava Malai, Chocolate Crunchy, Vanilla, Strawberry, Orange).
        </p>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Load Default Sample Ice Creams</span>
        </button>
      </div>

      {/* WIPE ALL DATA CONFIRMATION MODAL */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isWiping && setShowWipeConfirm(false)} />
          <div className="relative max-w-sm w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-4 z-10 animate-scale-pop shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8 animate-pulse text-rose-500 shrink-0" />
              <div>
                <h3 className="text-base font-black text-white">Delete All Data?</h3>
                <p className="text-[11px] text-rose-400 font-bold">This action cannot be undone!</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-white/5">
              All stock flavors, bills, expenses, and transaction logs will be completely wiped from the database so you can start clean.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                disabled={isWiping}
                onClick={() => setShowWipeConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isWiping}
                onClick={handleWipeAllData}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950"
              >
                {isWiping ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isWiping ? 'Deleting...' : 'Yes, Delete All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET SAMPLE FLAVORS CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative max-w-sm w-full bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 z-10 animate-scale-pop">
            <div className="flex items-center gap-3 text-purple-400">
              <RefreshCw className="w-7 h-7" />
              <h3 className="text-sm font-black text-white">Restore Sample Flavors?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This will load default sample ice cream flavors and clear all local test transactions.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDatabase}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black"
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
