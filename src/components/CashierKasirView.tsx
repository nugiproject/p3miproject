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
} from 'lucide-react';
import { KasTransaction, CpmiRecord, KasCategory } from '../types/cpmi';
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
  // Form State
  const [formDate, setFormDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [formCategory, setFormCategory] = useState<KasCategory>('Fee Sponsor');
  const [formCpmiRef, setFormCpmiRef] = useState('');
  const [formCpmiName, setFormCpmiName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [showCpmiSuggestions, setShowCpmiSuggestions] = useState(false);

  // Filter State for Transaction Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  // Categories list
  const categoriesList: KasCategory[] = [
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
  ];

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

        const matchCategory = !filterCategory || tx.category === filterCategory;
        const matchMonth = !filterMonth || (tx.date && tx.date.substring(0, 7) === filterMonth);

        return matchSearch && matchCategory && matchMonth;
      });
  }, [transactions, searchQuery, filterCategory, filterMonth]);

  // Sum of filtered transactions
  const filteredTotalValue = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + (Number(tx.value) || 0), 0);
  }, [filteredTransactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(formAmount.replace(/\D/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert('Masukkan nominal rupiah yang valid!');
      return;
    }

    const ref = formCpmiRef.trim().toUpperCase() || 'OPERASIONAL';
    const foundCandidate = cpmis.find(
      (c) => c.id.replace(/\s+/g, '').toUpperCase() === ref.replace(/\s+/g, '')
    );

    const candidateName = formCpmiName.trim() || (foundCandidate ? foundCandidate.name : undefined);

    const newTx: KasTransaction = {
      id: `tx-user-${Date.now()}`,
      date: formDate,
      category: formCategory,
      pmiRef: ref,
      pmiName: candidateName,
      value: cleanAmount,
      description: formDescription.trim() || `${formCategory} untuk ${ref} ${candidateName || ''}`.trim(),
      noReff: `KW-${Date.now().toString().slice(-6)}`,
    };

    onAddTransaction(newTx);
    setFormAmount('');
    setFormDescription('');
    setFormCpmiRef('');
    setFormCpmiName('');
    setShowCpmiSuggestions(false);
    alert('Transaksi kasir berhasil dicatat dan masuk ke buku besar!');
  };

  const handleSelectCandidate = (candidate: CpmiRecord) => {
    setFormCpmiRef(candidate.id);
    setFormCpmiName(candidate.name);
    setShowCpmiSuggestions(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="buku-kas-container">
      {/* LEFT COLUMN: FORM PENCATATAN KASIR (1 COL) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 text-[#1F3A5F] mb-4">
            <div className="p-2.5 bg-[#1F3A5F]/10 rounded-2xl">
              <Receipt className="w-5 h-5 text-[#1F3A5F]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#1F3A5F]">
                Catat Pengeluaran Kasir
              </h3>
              <p className="text-[11px] text-[#8C8479]">
                Entri kas keluar untuk operasional atau biaya per CPMI
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
                Kategori Biaya <span className="text-rose-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as KasCategory)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
              >
                {categoriesList.map((cat) => (
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
                Referensi CPMI (ID atau Nama)
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
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Nominal Biaya (Rp) <span className="text-rose-500">*</span>
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

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-bold text-[#1F3A5F] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#8C8479]" />
                Keterangan / Keperluan Operasional
              </label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Misal: Pembayaran living cost tahap 1, biaya paspor darurat, dll."
                className="w-full px-3.5 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1F3A5F] hover:bg-[#152A4A] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Transaksi Kasir</span>
            </button>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E2DDD5] text-center">
          <p className="text-[10px] text-[#8C8479]">
            Data tersinkron otomatis ke Laporan Keuangan & Rekap Kandidat.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: DAFTAR BUKU KAS KELUAR OPERASIONAL (2 COLS) */}
      <div className="xl:col-span-2 space-y-4">
        {/* Header & Filter Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold font-serif text-[#1F3A5F] flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-600" />
                Buku Catatan Kas Keluar Operasional
              </h3>
              <p className="text-xs text-[#8C8479]">
                Catatan kronologis seluruh arus keluar dana kantor cabang
              </p>
            </div>

            {/* Filtered Total Badge */}
            <div className="bg-[#1F3A5F] text-white px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xs">
              <div>
                <span className="text-[9px] uppercase font-mono text-white/70 block">
                  Total Nilai Terfilter
                </span>
                <span className="text-sm sm:text-base font-serif font-bold text-amber-300">
                  {formatRupiah(filteredTotalValue)}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full">
                {filteredTransactions.length} Data
              </span>
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E2DDD5]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C8479] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari Ref, Nama, atau Keterangan..."
                className="w-full pl-9 pr-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
              />
            </div>

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
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

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
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Ref CPMI / Nama</th>
                  <th className="py-3 px-4">Keterangan / Keperluan</th>
                  <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F7F5F2]/50 transition-colors">
                    {/* Tanggal */}
                    <td className="py-3 px-4 font-mono text-[#8C8479] whitespace-nowrap">
                      {formatDateIndo(tx.date)}
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {tx.category}
                      </span>
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
                    <td className="py-3 px-4 text-[#4B6584] max-w-xs truncate">
                      {tx.description || '-'}
                    </td>

                    {/* Nominal */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1F3A5F] whitespace-nowrap">
                      {formatRupiah(tx.value)}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPrintTransactionReceipt(tx)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Kwitansi Pengeluaran Kasir"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus transaksi kasir ${tx.pmiRef} sebesar ${formatRupiah(tx.value)}?`)) {
                              onDeleteTransaction(tx.id);
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
                ))}
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
  );
};
