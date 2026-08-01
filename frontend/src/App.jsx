import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { ExplorePage } from './pages/ExplorePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { CreateItemPage } from './pages/CreateItemPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { WalletPage } from './pages/WalletPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top PWA Installation Banner */}
      <PwaInstallBanner />

      {/* Main Navigation Header */}
      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      {/* Main Page Body */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/search" element={<Navigate to="/explore" replace />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes — Redirect to /login if unauthenticated */}
          <Route
            path="/create-item"
            element={
              <ProtectedRoute>
                <CreateItemPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/explore" replace />} />
        </Routes>
      </main>

      {/* Global Direct Messaging Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipientName="Vikram Malhotra"
        itemTitle="Bosch Cordless Drill"
      />

      {/* Navigation & Footer */}
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
