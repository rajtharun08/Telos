import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../api/client';
import { ShieldCheck, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const VerificationQueue = () => {
  const { addToast } = useToast();
  const [verifications, setVerifications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/admin/verifications');
      setVerifications(data);
    } catch (err) {
      addToast('Failed to load verification queue', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await apiFetch(`/api/admin/verifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      addToast(`Verification ${status.toLowerCase()}`, 'success');
      fetchQueue();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  const filtered = verifications.filter((v) => filterStatus === 'ALL' || v.status === filterStatus);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5">
      
      {/* Header & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest-600" />
            Verification & Compliance Queue
          </h2>
          <p className="text-xs text-slate-500 font-medium">Review KYC identity verifications and purchase receipts</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-colors ${
                filterStatus === s
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse font-medium">
            Loading verification queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No items in queue for status: {filterStatus}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold">
                    {item.kind}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900">{item.userName}</span>
                  <span className="text-[11px] text-slate-500 font-medium">({item.userEmail})</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <FileText className="w-3.5 h-3.5 text-forest-600" />
                  <span className="font-mono font-bold">{item.doc}</span>
                  {item.amount && <span className="font-extrabold text-forest-600">(${item.amount})</span>}
                </div>

                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Submitted: {new Date(item.submittedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {item.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                      className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-forest-600 text-white shadow-md shadow-forest-600/30 hover:bg-forest-500"
                    >
                      Approve
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                      item.status === 'APPROVED'
                        ? 'bg-emerald-50 text-forest-600 border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}
                  >
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
