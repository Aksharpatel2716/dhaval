import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, X, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4500); // Auto remove after 4.5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const config = {
    success: {
      bgColor: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
    warning: {
      bgColor: 'bg-amber-950/90 border-amber-500/30 text-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    error: {
      bgColor: 'bg-rose-950/90 border-rose-500/30 text-rose-300',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
    },
    info: {
      bgColor: 'bg-blue-950/90 border-blue-500/30 text-blue-300',
      icon: Info,
      iconColor: 'text-blue-400',
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={`flex items-start justify-between gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 pointer-events-auto transform translate-y-0 scale-100 ${config.bgColor}`}
      role="alert"
    >
      <div className="flex gap-2">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
        <p className="text-sm font-semibold leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
