import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  TrendingDown,
  Users,
  Wallet,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { CpmiRecord, KasTransaction } from '../types/cpmi';
import { formatRupiah, getCpmiStatusMeta } from '../utils/formatters';
import { exportTriasMultiSheetExcel } from '../services/excelExport';
import { ReportConsolidatedPrintModal } from './PrintModals';

interface ReportsViewProps {
  cpmis: CpmiRecord[];
  transactions: KasTransaction[];
  ptName: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ cpmis, transactions, ptName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [minSpend, setMinSpend] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // 1. Group transactions per CPMI
  const candidateLedger = useMemo(() => {
    return cpmis
      .map((c) => {
        const cleanId = c.id.replace(/\s+/g, '').toUpperCase();
        const relatedTxs = transactions.filter((tx) => {
          const cleanTx = (tx.pmiRef || '').replace(/\s+/g, '').toUpperCase();
          return cleanTx === cleanId;
        });

        const categoryAmounts: Record<string, number> = {};
        let total = 0;

        relatedTxs.forEach((tx) => {
          const cat = tx.category || 'Keterangan Lain';
          categoryAmounts[cat] = (categoryAmounts[cat] || 0) + tx.value;
          total += tx.value;
        });

        return {
          id: c.id,
          name: c.name,
          recruiter: c.recruiter || '-',
          destination: c.destination || 'Taiwan',
          status: c.status,
          totalSpent: total,
          categoryAmounts,
          txCount: relatedTxs.length,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [cpmis, transactions]);

  // Total Inflow & Outflow
  const totalInflow = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'pemasukan')
      .reduce((acc, tx) => acc + (Number(tx.value) || 0), 0);
  }, [transactions]);

  const totalOutflow = useMemo(() => {
    return transactions
      .filter((tx) => tx.type !== 'pemasukan')
      .reduce((acc, tx) => acc + (Number(tx.value) || 0), 0);
  }, [transactions]);

  const netBalance = totalInflow - totalOutflow;

  // Identified candidate spend
  const totalIdentifiedSpend = useMemo(() => {
    return candidateLedger.reduce((acc, c) => acc + c.totalSpent, 0);
  }, [candidateLedger]);

  // General office / overhead spend
  const overheadSpend = totalOutflow - totalIdentifiedSpend;

  // Active candidates with at least 1 transaction
  const activeCandidatesCount = useMemo(() => {
    return candidateLedger.filter((c) => c.txCount > 0).length;
  }, [candidateLedger]);

  // Average spend per active candidate
  const avgSpendPerActive = Math.round(totalIdentifiedSpend / (activeCandidatesCount || 1));

  // Category breakdown
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      const cat = tx.category || 'Keterangan Lain';
      map[cat] = (map[cat] || 0) + tx.value;
    });

    const totalVal = transactions.reduce((acc, tx) => acc + tx.value, 0);
    return Object.entries(map)
      .map(([cat, val]) => ({
        category: cat,
        value: val,
        percentage: totalVal > 0 ? Math.round((val / totalVal) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Filtered candidate ledger
  const filteredLedger = useMemo(() => {
    return candidateLedger.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.recruiter.toLowerCase().includes(q);

      const matchMin = c.totalSpent >= minSpend;
      const matchStatus = !filterStatus || c.status.toLowerCase().includes(filterStatus.toLowerCase());

      return matchSearch && matchMin && matchStatus;
    });
  }, [candidateLedger, searchQuery, minSpend, filterStatus]);

  // Excel multi-sheet export
  const handleExportWorkbook = () => {
    exportTriasMultiSheetExcel(cpmis, transactions, ptName);
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6" id="reports-keuangan-root">
      {/* Top Banner & Export Actions */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F3A5F] font-serif">
            {ptName} - Laporan Konsolidasi & Rekapitulasi Keuangan
          </h2>
          <p className="text-xs text-[#8C8479] mt-1">
            Audit operasional per-kepala CPMI, pengeluaran overhead kantor, dan rasio penyebaran dana sponsor.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] border border-[#E2DDD5] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
          <button
            onClick={handleExportWorkbook}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Workbook Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Pemasukan */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wide">
              Total Kas Masuk (Pemasukan)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-emerald-800">
            {formatRupiah(totalInflow)}
          </p>
          <span className="text-[10px] text-emerald-600 font-mono mt-1 block">
            Penerimaan Dana Kas Masuk
          </span>
        </div>

        {/* Card 2: Total Budget Outflow */}
        <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-rose-700 text-xs font-semibold uppercase tracking-wide">
              Total Kas Keluar (Pengeluaran)
            </span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-rose-800">
            {formatRupiah(totalOutflow)}
          </p>
          <span className="text-[10px] text-rose-600 font-mono mt-1 block">
            Pengeluaran Operasional & Biaya CPMI
          </span>
        </div>

        {/* Card 3: Saldo Kas Bersih */}
        <div className={`p-6 rounded-3xl border shadow-xs ${
          netBalance >= 0 ? 'bg-emerald-50/30 border-emerald-300' : 'bg-rose-50/30 border-rose-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1F3A5F]">
              Saldo Kas Bersih
            </span>
            <div className={`p-2 rounded-xl ${
              netBalance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold font-serif ${
            netBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'
          }`}>
            {formatRupiah(netBalance)}
          </p>
          <span className="text-[10px] font-mono text-[#4B6584] mt-1 block">
            {netBalance >= 0 ? 'Surplus Kas' : 'Defisit Sementara'}
          </span>
        </div>

        {/* Card 4: Identified Candidate Outflow */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#8C8479] text-xs font-semibold uppercase tracking-wide">
              Biaya Khusus CPMI
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-[#1F3A5F]">
            {formatRupiah(totalIdentifiedSpend)}
          </p>
          <span className="text-[10px] text-[#4B6584] font-mono mt-1 block">
            {activeCandidatesCount} Kandidat dengan Biaya Alur
          </span>
        </div>

        {/* Card 5: Average per Active Candidate */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#8C8479] text-xs font-semibold uppercase tracking-wide">
              Rata-rata Biaya / CPMI Aktif
            </span>
            <div className="p-2 bg-[#F5E6D3] text-[#8B6E4E] rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-[#6D5337]">
            {formatRupiah(avgSpendPerActive)}
          </p>
          <span className="text-[10px] text-[#8B6E4E] font-mono mt-1 block">
            Dari {activeCandidatesCount} Kandidat dengan Biaya
          </span>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
        <h3 className="font-serif font-bold text-[#1F3A5F] text-base mb-4">
          Distribusi Komponen Biaya Operasional & Keberangkatan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categorySummary.map((item) => (
            <div
              key={item.category}
              className="p-3.5 bg-[#F7F5F2]/70 rounded-2xl border border-[#E2DDD5]/70 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-[#1F3A5F]">{item.category}</span>
                <span className="font-mono font-bold text-[#212529]">{formatRupiah(item.value)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white h-2 rounded-full overflow-hidden border border-[#E2DDD5]/50">
                  <div
                    className="h-full bg-[#1F3A5F] rounded-full transition-all"
                    style={{ width: `${Math.max(2, item.percentage)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-[#8C8479] w-9 text-right font-semibold">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown per CPMI Table */}
      <div className="bg-white rounded-3xl border border-[#E2DDD5] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E2DDD5]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-serif font-bold text-[#1F3A5F] text-base">
                Rincian Biaya per-Kepala CPMI (Audit Detail)
              </h3>
              <p className="text-xs text-[#8C8479]">
                Pengeluaran kasir yang langsung dikreditkan atas nama dan ID masing-masing kandidat
              </p>
            </div>
          </div>

          {/* Filters for Candidate Ledger */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#E2DDD5] print:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C8479] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, Nama, atau Sponsor..."
                className="w-full pl-9 pr-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
              />
            </div>

            <div>
              <select
                value={minSpend}
                onChange={(e) => setMinSpend(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
              >
                <option value={0}>Semua Nilai Pengeluaran</option>
                <option value={1000000}>Min. Rp 1.000.000</option>
                <option value={3000000}>Min. Rp 3.000.000</option>
                <option value={5000000}>Min. Rp 5.000.000</option>
                <option value={10000000}>Min. Rp 10.000.000</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
              >
                <option value="">Semua Status Proses</option>
                <option value="TERBANG">TERBANG (FLIGHT)</option>
                <option value="FINAL STAGE">FINAL STAGE</option>
                <option value="BNSP">BNSP / BLK</option>
                <option value="PROCESS">PROCESS</option>
                <option value="CANCEL">CANCEL</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F5F2] border-b border-[#E2DDD5] text-[#8C8479] font-mono uppercase text-[10px]">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">ID CPMI</th>
                <th className="py-3 px-4">Nama Kandidat</th>
                <th className="py-3 px-4">Sponsor / PL</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Fee Sponsor</th>
                <th className="py-3 px-4 text-right">Biaya MD</th>
                <th className="py-3 px-4 text-right">ID/Paspor</th>
                <th className="py-3 px-4 text-right">Living Cost</th>
                <th className="py-3 px-4 text-right">Total Biaya</th>
                <th className="py-3 px-4 text-center">Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD5]/60">
              {filteredLedger.map((c, idx) => {
                const statusMeta = getCpmiStatusMeta(c.status);
                return (
                  <tr key={c.id} className="hover:bg-[#F7F5F2]/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#8C8479]">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1F3A5F] whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#212529]">{c.name}</div>
                      <span className="text-[10px] text-[#8C8479]">{c.destination}</span>
                    </td>
                    <td className="py-3 px-4 text-[#4B6584] whitespace-nowrap">{c.recruiter}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.bg}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {formatRupiah(c.categoryAmounts['Fee Sponsor'] || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {formatRupiah(c.categoryAmounts['Biaya MD'] || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {formatRupiah(c.categoryAmounts['ID Paspor'] || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {formatRupiah(c.categoryAmounts['Living Cost'] || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1F3A5F] whitespace-nowrap">
                      {formatRupiah(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#4B6584]">
                      {c.txCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E2DDD5] bg-[#F7F5F2]/40 text-xs text-[#8C8479] flex justify-between items-center">
          <span>Menampilkan {filteredLedger.length} kandidat</span>
          <span className="font-mono font-bold text-[#1F3A5F]">
            Total Akumulasi: {formatRupiah(filteredLedger.reduce((sum, c) => sum + c.totalSpent, 0))}
          </span>
        </div>
      </div>

      {isPrintModalOpen && (
        <ReportConsolidatedPrintModal
          cpmis={cpmis}
          transactions={transactions}
          ptName={ptName}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
