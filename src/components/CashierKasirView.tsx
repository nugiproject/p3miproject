import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  Printer,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Wallet,
  CheckCircle2,
  X,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { KasTransaction, CpmiRecord, KasCategory, KasTransactionType } from '../types/cpmi';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface CashierKasirViewProps {
  transactions: KasTransaction[];
  cpmis: CpmiRecord[];
  onAddTransaction: (tx: KasTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPrintTransactionReceipt: (tx: KasTransaction) => void;
}

export const CashierKasirView: React.FC<CashierKasirViewProps> = ({
  transactions,
  cpmis,
  onAddTransaction,
  onDeleteTransaction,
  onPrintTransactionReceipt,
}) => {
  // Form Type: 'pengeluaran' | 'pemasukan'
  const [formType, setFormType] = useState<KasTransactionType>('pengeluaran');

  // Form Fields
  const [formDate, setFormDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [formCategory, setFormCategory] = useState<KasCategory>('Fee Sponsor');
  const [formCpmiRef, setFormCpmiRef] = useState('');
  const [formCpmiName, setFormCpmiName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Tunai / Cash' | 'Transfer Bank' | 'QRIS' | 'Potong Gaji' | 'Lainnya'>('Tunai / Cash');
  const [formReceivedBy, setFormReceivedBy] = useState('Kasir Cabang');
  const [showCpmiSuggestions, setShowCpmiSuggestions] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter State for Transaction Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Categories list per type
  const expenseCategories: KasCategory[] = [
    'Fee Sponsor',
    'Biaya MD',
    'ID Paspor',
    'Living Cost',
    'Transport',
    'Mcu Pra',
    'Royalti',
    'Keterangan Lain',
    'Tiket',
    'Visa',
    'Operasional Kantor',
    'Pengeluaran Lainnya',
  ];

  const incomeCategories: KasCategory[] = [
    'Pembayaran Biaya CPMI',
    'DP / Uang Muka',
    'Pelunasan Biaya CPMI',
    'Fee / Komisi Agency',
    'Refund / Pengembalian Biaya',
    'Kas Masuk / Modal Operasional',
    'Pemasukan Lainnya',
  ];

  const currentCategories = formType === 'pemasukan' ? incomeCategories : expenseCategories;

  // Auto-complete candidates matching reference input
  const cpmiSuggestions = useMemo(() => {
    if (!formCpmiRef.trim()) return [];
    const q = formCpmiRef.toLowerCase().trim();
    return cpmis
      .filter((c) => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [cpmis, formCpmiRef]);

  // Unique available months in transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.substring(0, 7));
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Overall statistics for entire ledger
  const overallStats = useMemo(() => {
    let income = 0;
    let incomeCount = 0;
    let expense = 0;
    let expenseCount = 0;

    transactions.forEach((tx) => {
      const val = Number(tx.value) || 0;
      if (tx.type === 'pemasukan') {
        income += val;
        incomeCount += 1;
      } else {
        expense += val;
        expenseCount += 1;
      }
    });

    return {
      income,
      incomeCount,
      expense,
      expenseCount,
      balance: income - expense,
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id))
      .filter((tx) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          (tx.description && tx.description.toLowerCase().includes(q)) ||
          tx.pmiRef.toLowerCase().includes(q) ||
          (tx.pmiName && tx.pmiName.toLowerCase().includes(q)) ||
          tx.category.toLowerCase().includes(q);

        const matchType =
          filterType === 'all' ||
          (filterType === 'pemasukan' && tx.type === 'pemasukan') ||
          (filterType === 'pengeluaran' && tx.type !== 'pemasukan');

        const matchCategory = !filterCategory || tx.category === filterCategory;
        const matchMonth = !filterMonth || (tx.date && tx.date.substring(0, 7) === filterMonth);

        return matchSearch && matchType && matchCategory && matchMonth;
      });
  }, [transactions, searchQuery, filterType, filterCategory, filterMonth]);

  // Filtered totals
  const filteredTotalValue = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      const val = Number(tx.value) || 0;
      if (tx.type === 'pemasukan') {
        income += val;
      } else {
        expense += val;
      }
    });
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Switch form type
  const handleSwitchType = (newType: KasTransactionType) => {
    setFormType(newType);
    if (newType === 'pemasukan') {
      setFormCategory('Pembayaran Biaya CPMI');
    } else {
      setFormCategory('Fee Sponsor');
    }
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(formAmount.replace(/\D/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      showToast('Masukkan nominal rupiah yang valid!');
      return;
    }

    const ref = formCpmiRef.trim().toUpperCase() || 'OPERASIONAL';
    const foundCandidate = cpmis.find(
      (c) => c.id.replace(/\s+/g, '').toUpperCase() === ref.replace(/\s+/g, '')
    );

    const candidateName = formCpmiName.trim() || (foundCandidate ? foundCandidate.name : undefined);

    const isIncome = formType === 'pemasukan';
    const newTx: KasTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: formDate,
      type: formType,
      category: formCategory,
      pmiRef: ref,
      pmiName: candidateName,
      value: cleanAmount,
      description:
        formDescription.trim() ||
        `${isIncome ? 'Pemasukan' : 'Pengeluaran'} ${formCategory} (${ref} ${candidateName || ''})`.trim(),
      noReff: `${isIncome ? 'KM' : 'KW'}-${Date.now().toString().slice(-6)}`,
      paymentMethod: formPaymentMethod,
      receivedBy: formReceivedBy.trim() || 'Kasir Cabang',
      createdAt: new Date().toISOString(),
    };

    onAddTransaction(newTx);
    setFormAmount('');
    setFormDescription('');
    setFormCpmiRef('');
    setFormCpmiName('');
    setShowCpmiSuggestions(false);
    showToast(
      isIncome
        ? `Catatan pemasukan ${formatRupiah(cleanAmount)} berhasil disimpan (+)!`
        : `Catatan pengeluaran ${formatRupiah(cleanAmount)} berhasil disimpan (-)!`
    );
  };

  const handleSelectCandidate = (candidate: CpmiRecord) => {
    setFormCpmiRef(candidate.id);
    setFormCpmiName(candidate.name);
    setShowCpmiSuggestions(false);
  };

  return (
    <div className="space-y-6" id="buku-kas-container">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-[#1F3A5F] text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center gap-3 animate-slide-down">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP SUMMARY CARDS (ARUS KAS MASUK, KELUAR, SALDO BERSIH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pemasukan */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Total Kas Masuk (Pemasukan)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-800">
              {formatRupiah(overallStats.income)}
            </div>
            <span className="text-[10px] text-emerald-600 font-mono mt-0.5 block">
              {overallStats.incomeCount} Transaksi Pembayaran / Kas Masuk
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="bg-white p-5 rounded-3xl border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
              Total Kas Keluar (Pengeluaran)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-rose-800">
              {formatRupiah(overallStats.expense)}
            </div>
            <span className="text-[10px] text-rose-600 font-mono mt-0.5 block">
              {overallStats.expenseCount} Transaksi Operasional & Biaya CPMI
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Saldo Kas Bersih */}
        <div className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between ${
          overallStats.balance >= 0
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-300'
            : 'bg-gradient-to-br from-rose-500/10 to-amber-500/10 border-rose-300'
        }`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F3A5F] block mb-1">
              Saldo Kas Bersih (Net Cashflow)
            </span>
            <div className={`text-xl sm:text-2xl font-bold font-serif ${
              overallStats.balance >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              {formatRupiah(overallStats.balance)}
            </div>
            <span className="text-[10px] font-mono text-[#4B6584] mt-0.5 block">
              {overallStats.balance >= 0 ? 'Surplus / Kas Positif' : 'Defisit Sementara'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            overallStats.balance >= 0
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}>
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Transaksi Buku Kas */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2DDD5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8479] block mb-1">
              Total Buku Kas
            </span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#1F3A5F]">
              {transactions.length}
            </div>
            <span className="text-[10px] text-[#8C8479] font-mono mt-0.5 block">
              Entri Kasir Terverifikasi
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#1F3A5F]/10 text-[#1F3A5F] flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN: FORM PENCATATAN KASIR (1 COL) */}
        <div className={`p-6 rounded-3xl border shadow-xs flex flex-col justify-between transition-all ${
          formType === 'pemasukan'
            ? 'bg-gradient-to-b from-emerald-50/40 to-white border-emerald-300'
            : 'bg-white border-[#E2DDD5]'
        }`}>
          <div>
            {/* Toggle Switch: Catat Pengeluaran vs Catat Pemasukan */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F7F5F2] border border-[#E2DDD5] rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => handleSwitchType('pengeluaran')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formType === 'pengeluaran'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Catat Pengeluaran (-)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchType('pemasukan')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formType === 'pemasukan'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Catat Pemasukan (+)</span>
              </button>
            </div>

            {/* Header Form */}
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2.5 rounded-2xl ${
                formType === 'pemasukan'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {formType === 'pemasukan' ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                ) : (
                  <Receipt className="w-5 h-5 text-rose-700" />
                )}
              </div>
              <div>
                <h3 className={`text-base font-bold font-serif ${
                  formType === 'pemasukan' ? 'text-emerald-900' : 'text-[#1F3A5F]'
                }`}>
                  {formType === 'pemasukan'
                    ? 'Catat Pemasukan Kasir (Cash In)'
                    : 'Catat Pengeluaran Kasir (Cash Out)'}
                </h3>
                <p className="text-[11px] text-[#8C8479]">
                  {formType === 'pemasukan'
                    ? 'Penerimaan dana dari CPMI, pelunasan, DP, fee agency, dll.'
                    : 'Kas keluar untuk operasional cabang, sponsor, paspor, MCU, dll.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-bold text-[#1F3A5F] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8C8479]" />
                  Tanggal Transaksi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs font-mono focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-[#1F3A5F] mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#8C8479]" />
                  Kategori {formType === 'pemasukan' ? 'Pemasukan' : 'Biaya / Pengeluaran'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as KasCategory)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                >
                  {currentCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Referensi CPMI dengan Auto-Suggest */}
              <div className="relative">
                <label className="block text-xs font-bold text-[#1F3A5F] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8C8479]" />
                  Referensi CPMI (ID atau Nama Kandidat)
                </label>
                <input
                  type="text"
                  value={formCpmiRef}
                  onChange={(e) => {
                    setFormCpmiRef(e.target.value);
                    setShowCpmiSuggestions(true);
                  }}
                  onFocus={() => setShowCpmiSuggestions(true)}
                  placeholder="Ketik TS 6317 / Nama / OPERASIONAL"
                  className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                />

                {/* Suggestions Dropdown */}
                {showCpmiSuggestions && cpmiSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E2DDD5] rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {cpmiSuggestions.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => handleSelectCandidate(candidate)}
                        className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#1F3A5F] bg-slate-100 px-1.5 py-0.5 rounded mr-1.5 text-[10px]">
                            {candidate.id}
                          </span>
                          <span className="font-bold text-[#212529]">{candidate.name}</span>
                        </div>
                        <span className="text-[10px] text-[#8C8479]">{candidate.status}</span>
                      </button>
                    ))}
                  </div>
                )}

                {formCpmiName && (
                  <p className="text-[10px] text-emerald-700 font-medium mt-1">
                    ✓ Terpilih: <b>{formCpmiName}</b>
                  </p>
                )}
              </div>

              {/* Nominal (Rupiah) */}
              <div>
                <label className="block text-xs font-bold text-[#1F3A5F] mb-1.5 flex items-center gap-1.5">
                  <DollarSign className={`w-3.5 h-3.5 ${
                    formType === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'
                  }`} />
                  Nominal {formType === 'pemasukan' ? 'Kas Masuk' : 'Pengeluaran'} (Rp){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-[#8C8479]">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="Contoh: 1500000"
                    className="w-full pl-11 pr-3.5 py-2.5 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  />
                </div>
                {formAmount && !isNaN(Number(formAmount)) && (
                  <p className="text-[10px] text-[#8C8479] font-mono mt-1">
                    Terbaca: {formatRupiah(Number(formAmount))}
                  </p>
                )}
              </div>

              {/* Metode Pembayaran & Kasir Penerima (Khusus Pemasukan atau opsional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F3A5F] mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-[#8C8479]" />
                    Metode Bayar
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  >
                    <option value="Tunai / Cash">Tunai / Cash</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Potong Gaji">Potong Gaji</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1F3A5F] mb-1">
                    Petugas Kasir
                  </label>
                  <input
                    type="text"
                    value={formReceivedBy}
                    onChange={(e) => setFormReceivedBy(e.target.value)}
                    placeholder="Kasir Cabang"
                    className="w-full px-2.5 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-[#1F3A5F] mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#8C8479]" />
                  Keterangan / Uraian Transaksi
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={
                    formType === 'pemasukan'
                      ? 'Misal: Pembayaran DP CPMI Taiwan, fee pelunasan berkas, dll.'
                      : 'Misal: Biaya tiket, penginapan BLK, transportasi sponsor, dll.'
                  }
                  className="w-full px-3.5 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 text-white ${
                  formType === 'pemasukan'
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                    : 'bg-[#1F3A5F] hover:bg-[#152A4A] active:scale-95'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {formType === 'pemasukan'
                    ? 'Simpan Catatan Pemasukan (+)'
                    : 'Simpan Catatan Pengeluaran (-)'}
                </span>
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2DDD5] text-center">
            <p className="text-[10px] text-[#8C8479]">
              Setiap catatan kasir dapat langsung dicetak kwitansi dan diunduh ke PDF resmi.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: DAFTAR BUKU KAS KASIR (2 COLS) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Header & Filter Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold font-serif text-[#1F3A5F] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  Buku Catatan Kas Kasir (Jurnal Transaksi)
                </h3>
                <p className="text-xs text-[#8C8479]">
                  Catatan kronologis arus uang kas masuk (pemasukan) dan uang kas keluar (pengeluaran)
                </p>
              </div>

              {/* Filtered Total Badge */}
              <div className="bg-[#1F3A5F] text-white px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-mono text-white/70 block">
                      Saldo Terfilter:
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {formatRupiah(filteredTotalValue.balance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-white/80 font-mono mt-0.5">
                    <span className="text-emerald-300">
                      + Masuk: {formatRupiah(filteredTotalValue.income)}
                    </span>
                    <span className="text-rose-300">
                      - Keluar: {formatRupiah(filteredTotalValue.expense)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                  {filteredTransactions.length} Data
                </span>
              </div>
            </div>

            {/* Filter Row: Type, Category, Month, Search */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E2DDD5]">
              {/* Filter Type */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs font-bold focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                >
                  <option value="all">Semua Jenis Kas</option>
                  <option value="pemasukan">🟢 Hanya Pemasukan (Kas Masuk)</option>
                  <option value="pengeluaran">🔴 Hanya Pengeluaran (Kas Keluar)</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C8479] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari Ref, Nama, Uraian..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                />
              </div>

              {/* Category */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                >
                  <option value="">Semua Kategori</option>
                  <optgroup label="Kategori Pemasukan">
                    {incomeCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Kategori Pengeluaran">
                    {expenseCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Month */}
              <div>
                <select
                  value={filterMonth}
                  onChange={(e) => {
                    setFilterMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                >
                  <option value="">Semua Bulan Transaksi</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      Bulan {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-3xl border border-[#E2DDD5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" id="table-buku-kas">
                <thead>
                  <tr className="bg-[#F7F5F2] border-b border-[#E2DDD5] text-[#8C8479] font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Jenis & Kategori</th>
                    <th className="py-3 px-4">Ref CPMI / Nama</th>
                    <th className="py-3 px-4">Keterangan / Metode</th>
                    <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]/60">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada transaksi kasir yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => {
                      const isIncome = tx.type === 'pemasukan';
                      return (
                        <tr key={tx.id} className="hover:bg-[#F7F5F2]/50 transition-colors">
                          {/* Tanggal */}
                          <td className="py-3 px-4 font-mono text-[#8C8479] whitespace-nowrap">
                            {formatDateIndo(tx.date)}
                          </td>

                          {/* Jenis & Kategori */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                                isIncome
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300/80'
                              }`}>
                                {isIncome ? '+ MASUK' : '- KELUAR'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800">
                                {tx.category}
                              </span>
                            </div>
                          </td>

                          {/* Ref CPMI & Name */}
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-[#1F3A5F]">{tx.pmiRef}</div>
                            {tx.pmiName && (
                              <span className="text-[10px] text-[#4B6584] block font-medium">
                                {tx.pmiName}
                              </span>
                            )}
                          </td>

                          {/* Keterangan */}
                          <td className="py-3 px-4 text-[#4B6584] max-w-xs">
                            <div className="truncate" title={tx.description}>
                              {tx.description || '-'}
                            </div>
                            {tx.paymentMethod && (
                              <span className="text-[9px] text-[#8C8479] font-mono block">
                                via {tx.paymentMethod}
                              </span>
                            )}
                          </td>

                          {/* Nominal */}
                          <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                            <span className={isIncome ? 'text-emerald-700' : 'text-rose-700'}>
                              {isIncome ? '+ ' : '- '}
                              {formatRupiah(tx.value)}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => onPrintTransactionReceipt(tx)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isIncome
                                    ? 'text-emerald-700 hover:bg-emerald-50'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                                title={isIncome ? 'Cetak Kwitansi Penerimaan Kas' : 'Cetak Bukti Pengeluaran Kas'}
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus transaksi kasir ${tx.pmiRef} sebesar ${formatRupiah(tx.value)}?`)) {
                                    onDeleteTransaction(tx.id);
                                    showToast('Transaksi kasir berhasil dihapus.');
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-[#E2DDD5] bg-[#F7F5F2]/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <span className="text-[#8C8479]">
                Menampilkan {paginatedTransactions.length} dari total {filteredTransactions.length} entri buku kas
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-[#E2DDD5] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-mono font-bold text-[#1F3A5F]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-[#E2DDD5] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
