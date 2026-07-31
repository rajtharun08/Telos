import React from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { VerificationQueue } from '../components/admin/VerificationQueue';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const AdminPage = () => {
  const { user } = useAuth();

  if (!user.admin) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 pb-24 md:pb-8">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h2 className="text-xl font-extrabold text-slate-900">Admin Access Restricted</h2>
          <p className="text-xs text-slate-500 font-medium">
            You must be logged in as an administrator to access the compliance queue. Use the account switcher in the top right to switch to <strong>Aliya Rahman</strong> (Admin).
          </p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-24 md:pb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Operations Center</h1>
          <p className="text-xs text-slate-500 font-medium">Review KYC identity verifications, store receipts, and platform compliance.</p>
        </div>

        <VerificationQueue />
      </div>
    </PageTransition>
  );
};
