import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import GlassModal from './GlassModal';

const toneConfig = {
  danger: {
    Icon: AlertTriangle,
    iconWrapClass: 'bg-red-100 text-red-600',
    confirmClass: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:brightness-110',
  },
  success: {
    Icon: CheckCircle2,
    iconWrapClass: 'bg-emerald-100 text-emerald-600',
    confirmClass: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:brightness-110',
  },
  info: {
    Icon: Info,
    iconWrapClass: 'bg-blue-100 text-blue-600',
    confirmClass: 'bg-gradient-to-r from-brand-teal to-blue-700 text-white hover:brightness-110',
  },
};

export default function LinkEduPopup({
  open,
  title,
  message,
  tone = 'info',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!open) return null;

  const config = toneConfig[tone] || toneConfig.info;
  const Icon = config.Icon;
  const isConfirm = typeof onConfirm === 'function';

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      disableClose={loading}
      panelClassName="max-w-lg p-0"
    >
      <div className="premium-modal-card !max-w-none !rounded-none !border-0 !bg-transparent !p-7 !text-left !shadow-none">
        <div className="mb-5 flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.iconWrapClass}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-brand-navy tracking-tight">{title}</h3>
            {message ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{message}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-7 flex gap-3">
          {isConfirm ? (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelText}
            </button>
          ) : null}

          <button
            type="button"
            onClick={isConfirm ? onConfirm : onClose}
            disabled={loading}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${config.confirmClass}`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {confirmText}
            </span>
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
