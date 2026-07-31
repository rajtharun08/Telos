import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { QrCode, ShieldCheck, Copy, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const QrGeneratorModal = ({ isOpen, onClose, tx }) => {
  const { addToast } = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!tx) return null;

  const token = tx.pickupToken || "849201";
  const qrData = JSON.stringify({
    txId: tx.id,
    token: token,
    itemTitle: tx.itemTitle,
    timestamp: Date.now()
  });

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    addToast('6-digit pickup token copied!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Handoff QR Verification Code" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center space-y-4">
        
        <p className="text-xs text-slate-300">
          Show this QR code or 6-digit pickup token to the borrower upon physical handoff to activate the transaction and unlock coordinates.
        </p>

        {/* High Contrast QR Code Container */}
        <div className="p-4 rounded-2xl bg-white shadow-2xl border-4 border-indigo-500/40">
          <QRCodeSVG value={qrData} size={180} level="H" />
        </div>

        {/* 6-Digit Backup Token Display */}
        <div className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">6-Digit Backup Token</span>
            <span className="text-xl font-extrabold text-indigo-400 font-mono tracking-widest">{token}</span>
          </div>

          <button
            onClick={handleCopyToken}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full pt-2">
          <Button variant="secondary" size="md" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
