import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../api/client';
import { QrCode, Scan, KeyRound, CheckCircle2 } from 'lucide-react';

export const QrScannerModal = ({ isOpen, onClose, tx, onScanSuccess }) => {
  const { addToast } = useToast();
  const [tokenInput, setTokenInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  if (!tx) return null;

  const handleVerifyToken = async (tokenToUse) => {
    const finalToken = tokenToUse || tokenInput;
    if (!finalToken) {
      addToast('Please enter the 6-digit pickup token', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await apiFetch('/api/handoff/scan', {
        method: 'POST',
        body: JSON.stringify({
          txId: tx.id,
          token: finalToken
        })
      });

      addToast('Handoff verified! Transaction state changed to ACTIVE.', 'success');
      if (onScanSuccess) onScanSuccess(res);
      onClose();
    } catch (err) {
      addToast(err.message || 'Verification failed. Invalid token.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateScan = () => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSimulatingScan(false);
      handleVerifyToken(tx.pickupToken || "849201");
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Handoff QR Code / Token" maxWidth="max-w-md">
      <div className="space-y-5">
        
        {/* Simulated Camera Viewfinder */}
        <div className="relative h-48 rounded-2xl bg-slate-950 border-2 border-indigo-500/50 flex flex-col items-center justify-center overflow-hidden">
          
          {/* Scanning Line Animation */}
          <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none" />
          <div className="w-40 h-40 border-2 border-dashed border-indigo-400 rounded-xl flex flex-col items-center justify-center relative">
            <Scan className={`w-10 h-10 text-indigo-400 ${isSimulatingScan ? 'animate-spin' : 'animate-bounce'}`} />
            <span className="text-[11px] font-bold text-slate-300 mt-2">
              {isSimulatingScan ? 'Decoding QR Data...' : 'Align Lender QR Code'}
            </span>
          </div>

          <button
            onClick={handleSimulateScan}
            disabled={isSimulatingScan}
            className="absolute bottom-3 px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold shadow border border-indigo-400/40 cursor-pointer"
          >
            {isSimulatingScan ? 'Scanning...' : 'Simulate Camera Scan'}
          </button>
        </div>

        {/* Manual Token Entry Fallback */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            Or Enter 6-Digit Backup Token
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. 849201"
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-center font-mono text-base tracking-widest text-indigo-300 font-bold uppercase focus:outline-none"
            />
            <Button
              variant="primary"
              size="md"
              isLoading={isVerifying}
              onClick={() => handleVerifyToken(tokenInput)}
            >
              Verify Token
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
