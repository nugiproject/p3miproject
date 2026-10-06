import React, { useState, useEffect } from 'react';
import {
  loadCpmiData,
  saveCpmiData,
  loadTransactions,
  saveTransactions,
  loadPtName,
  savePtName,
  loadPtLogo,
  savePtLogo,
  loadLoggedInUser,
  saveLoggedInUser,
  resetAllToDefaults,
} from './services/storage';
import { CpmiRecord, KasTransaction, PortalUser } from './types/cpmi';
import { Navbar, TabType } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { CpmiDatabaseView } from './components/CpmiDatabaseView';
import { CashierKasirView } from './components/CashierKasirView';
import { ReportsView } from './components/ReportsView';
import { BatchImportView } from './components/BatchImportView';
import { SettingsPtView } from './components/SettingsPtView';
import { DossierPrintModal, ReceiptPrintModal } from './components/PrintModals';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => loadLoggedInUser());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [ptName, setPtName] = useState<string>(() => loadPtName());
  const [ptLogo, setPtLogo] = useState<string | null>(() => loadPtLogo());
  const [cpmis, setCpmis] = useState<CpmiRecord[]>(() => loadCpmiData());
  const [transactions, setTransactions] = useState<KasTransaction[]>(() => loadTransactions());

  // Print Modals
  const [printingCpmi, setPrintingCpmi] = useState<CpmiRecord | null>(null);
  const [printingTransaction, setPrintingTransaction] = useState<KasTransaction | null>(null);

  // Authentication Handlers
  const handleLoginSuccess = (user: PortalUser) => {
    setCurrentUser(user);
    saveLoggedInUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveLoggedInUser(null);
  };

  // PT Profile Handlers
  const handleUpdatePtName = (newName: string) => {
    setPtName(newName);
    savePtName(newName);
  };

  const handleUpdatePtLogo = (newLogo: string | null) => {
    setPtLogo(newLogo);
    savePtLogo(newLogo);
  };

  // CPMI CRUD Handlers
  const handleAddCpmi = (newCpmi: CpmiRecord) => {
    const updated = [newCpmi, ...cpmis];
    setCpmis(updated);
    saveCpmiData(updated);
  };

  const handleUpdateCpmi = (updatedCpmi: CpmiRecord) => {
    const updated = cpmis.map((c) => (c.id === updatedCpmi.id ? updatedCpmi : c));
    setCpmis(updated);
    saveCpmiData(updated);
  };

  const handleDeleteCpmi = (id: string) => {
    const updated = cpmis.filter((c) => c.id !== id);
    setCpmis(updated);
    saveCpmiData(updated);
  };

  // Transaction CRUD Handlers
  const handleAddTransaction = (newTx: KasTransaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
  };

  // Batch Import Handlers
  const handleImportCpmis = (newCpmis: CpmiRecord[]) => {
    const updated = [...newCpmis, ...cpmis];
    setCpmis(updated);
    saveCpmiData(updated);
  };

  const handleImportTransactions = (newTxs: KasTransaction[]) => {
    const updated = [...newTxs, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  // Reset & Restore Handlers
  const handleResetDefaults = () => {
    if (
      confirm(
        'Peringatan: Atur ulang database akan memuat ulang 52 data CPMI dan 250 transaksi bawaan PT. Trias Insan Madani Cabang Cirebon. Lanjutkan?'
      )
    ) {
      const defaults = resetAllToDefaults();
      setCpmis(defaults.cpmis);
      setTransactions(defaults.transactions);
      setPtName(loadPtName());
      alert('Database berhasil diatur ulang ke versi bawaan PT!');
    }
  };

  const handleRestoreData = (newCpmis: CpmiRecord[], newTxs: KasTransaction[]) => {
    setCpmis(newCpmis);
    setTransactions(newTxs);
    saveCpmiData(newCpmis);
    saveTransactions(newTxs);
  };

  // If not logged in, show Auth / Login Screen
  if (!currentUser) {
    return (
      <AuthScreen
        ptName={ptName}
        ptLogo={ptLogo}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F2] text-[#212529] selection:bg-[#1F3A5F] selection:text-white">
      {/* Navbar with Company Header and Tab Switcher */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ptName={ptName}
        ptLogo={ptLogo}
        currentUser={currentUser}
        onLogout={handleLogout}
        onResetDefaults={handleResetDefaults}
        onUpdatePtName={handleUpdatePtName}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            cpmis={cpmis}
            transactions={transactions}
            onNavigate={setActiveTab}
            ptName={ptName}
          />
        )}

        {activeTab === 'cpmi' && (
          <CpmiDatabaseView
            cpmis={cpmis}
            transactions={transactions}
            onAddCpmi={handleAddCpmi}
            onUpdateCpmi={handleUpdateCpmi}
            onDeleteCpmi={handleDeleteCpmi}
            onPrintCpmi={(c) => setPrintingCpmi(c)}
            ptName={ptName}
          />
        )}

        {activeTab === 'transaksi' && (
          <CashierKasirView
            transactions={transactions}
            cpmis={cpmis}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onPrintTransactionReceipt={(tx) => setPrintingTransaction(tx)}
          />
        )}

        {activeTab === 'laporan' && (
          <ReportsView
            cpmis={cpmis}
            transactions={transactions}
            ptName={ptName}
          />
        )}

        {activeTab === 'import' && (
          <BatchImportView
            onImportCpmis={handleImportCpmis}
            onImportTransactions={handleImportTransactions}
            ptName={ptName}
          />
        )}

        {activeTab === 'pengaturan-pt' && (
          <SettingsPtView
            ptName={ptName}
            onUpdatePtName={handleUpdatePtName}
            ptLogo={ptLogo}
            onUpdatePtLogo={handleUpdatePtLogo}
            currentUser={currentUser}
            cpmis={cpmis}
            transactions={transactions}
            onRestoreData={handleRestoreData}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2DDD5] py-4 text-center text-[10px] text-[#8C8479] font-mono print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            © {new Date().getFullYear()} {ptName}. Hak Cipta Dilindungi Undang-Undang.
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Keamanan Data Lunas • Penyimpanan Terenkripsi di Browser Lokal Anda</span>
          </span>
        </div>
      </footer>

      {/* Print Modals */}
      {printingCpmi && (
        <DossierPrintModal
          cpmi={printingCpmi}
          ptName={ptName}
          onClose={() => setPrintingCpmi(null)}
        />
      )}

      {printingTransaction && (
        <ReceiptPrintModal
          transaction={printingTransaction}
          ptName={ptName}
          onClose={() => setPrintingTransaction(null)}
        />
      )}
    </div>
  );
}
