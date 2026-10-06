import React, { useMemo } from 'react';
import {
  Users,
  PlaneTakeoff,
  GraduationCap,
  Wallet,
  ArrowRight,
  TrendingUp,
  Receipt,
  UserCheck,
  Globe2,
} from 'lucide-react';
import { CpmiRecord, KasTransaction } from '../types/cpmi';
import { formatRupiah, formatDateIndo, getCpmiStatusMeta } from '../utils/formatters';
import { TabType } from './Navbar';

interface DashboardProps {
  cpmis: CpmiRecord[];
  transactions: KasTransaction[];
  onNavigate: (tab: TabType) => void;
  ptName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cpmis,
  transactions,
  onNavigate,
  ptName,
}) => {
  const totalCpmi = cpmis.length;

  // Status breakdown
  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {
      terbang: 0,
      bnsp: 0,
      final: 0,
      proses: 0,
      batal: 0,
      verif: 0,
      lainnya: 0,
    };

    cpmis.forEach((c) => {
      const s = (c.status || '').toLowerCase();
      if (s.includes('flight') || s.includes('terbang')) stats.terbang++;
      else if (s.includes('bnsp') || s.includes('blk')) stats.bnsp++;
      else if (s.includes('final')) stats.final++;
      else if (s.includes('cancel') || s.includes('tolak') || s.includes('batal')) stats.batal++;
      else if (s.includes('verif') || s.includes('id paspor')) stats.verif++;
      else if (s.includes('process') || s.includes('proses')) stats.proses++;
      else stats.lainnya++;
    });

    return stats;
  }, [cpmis]);

  // Total cash outflow
  const totalOutflow = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (Number(tx.value) || 0), 0);
  }, [transactions]);

  // Expenses by Category
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      const cat = tx.category || 'Keterangan Lain';
      map[cat] = (map[cat] || 0) + tx.value;
    });

    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries.map(([category, value]) => ({
      category,
      value,
      percentage: totalOutflow > 0 ? Math.round((value / totalOutflow) * 100) : 0,
    }));
  }, [transactions, totalOutflow]);

  // Country breakdown
  const countryStats = useMemo(() => {
    const map: Record<string, number> = {};
    cpmis.forEach((c) => {
      const country = c.destination || 'Taiwan';
      map[country] = (map[country] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [cpmis]);

  // Top Recruiters / Sponsors
  const topRecruiters = useMemo(() => {
    const map: Record<string, number> = {};
    cpmis.forEach((c) => {
      const rec = c.recruiter || 'Kantor Pusat';
      map[rec] = (map[rec] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [cpmis]);

  // 5 Latest Transactions
  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id))
      .slice(0, 5);
  }, [transactions]);

  const countryFlags: Record<string, string> = {
    Taiwan: '🇹🇼',
    Singapura: '🇸🇬',
    Malaysia: '🇲🇾',
    'Hong Kong': '🇭🇰',
    Polandia: '🇵🇱',
    Jepang: '🇯🇵',
    'Korea Selatan': '🇰🇷',
  };

  return (
    <div className="space-y-6" id="dashboard-ringkasan-root">
      {/* Hero Welcome Banner */}
      <div className="bg-[#1F3A5F] text-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#152A4A] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400/20 text-amber-300 font-mono text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold border border-amber-400/30">
              GLOBAL HUMAN RESOURCE PORTAL
            </span>
            <span className="bg-white/10 text-white/90 text-[10px] font-mono px-2 py-0.5 rounded-full">
              Sistem Aktif 2025/2026
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold mt-2 tracking-tight text-white">
            {ptName}
          </h1>
          <p className="text-white/80 mt-2 text-xs md:text-sm leading-relaxed max-w-2xl">
            Monitor proses alur migrasi Calon Pekerja Migran Indonesia (CPMI) terpusat, pantau pengeluaran operasional per individu melalui Buku Kas Kasir, dan terbitkan laporan keuangan konsolidasi secara presisi.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('cpmi')}
              id="btn-goto-cpmi"
              className="bg-white text-[#1F3A5F] hover:bg-amber-50 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-[#1F3A5F]" />
              <span>Kelola Data CPMI</span>
            </button>
            <button
              onClick={() => onNavigate('transaksi')}
              id="btn-goto-transactions"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4 text-amber-300" />
              <span>Catat Transaksi Kasir</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" id="kpi-grid">
        {/* KPI 1: Total Terdaftar */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-[#E1EDD8] text-[#5A6946] rounded-2xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[#8C8479] text-xs font-semibold uppercase tracking-wide">
              Total Terdaftar (CPMI)
            </p>
            <p className="text-3xl font-bold font-serif text-[#1F3A5F] mt-1">{totalCpmi}</p>
            <span className="text-[10px] text-emerald-700 font-mono font-bold block mt-0.5">
              Kandidat Terdaftar di Database
            </span>
          </div>
        </div>

        {/* KPI 2: Terbang / Flight */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-[#E1EDD8] text-[#5A6946] rounded-2xl shrink-0">
            <PlaneTakeoff className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[#8C8479] text-xs font-semibold uppercase tracking-wide">
              Terbang / Flight
            </p>
            <p className="text-3xl font-bold font-serif text-[#1F3A5F] mt-1">
              {statusStats.terbang}
            </p>
            <span className="text-[10px] text-emerald-700 font-mono font-bold block mt-0.5">
              {Math.round((statusStats.terbang / (totalCpmi || 1)) * 100)}% dari Total CPMI
            </span>
          </div>
        </div>

        {/* KPI 3: Pelatihan BNSP / BLK */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-[#F5E6D3] text-[#8B6E4E] rounded-2xl shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[#8C8479] text-xs font-semibold uppercase tracking-wide">
              Pelatihan BNSP / BLK
            </p>
            <p className="text-3xl font-bold font-serif text-[#1F3A5F] mt-1">
              {statusStats.bnsp}
            </p>
            <span className="text-[10px] text-[#8B6E4E] font-mono font-bold block mt-0.5">
              Siap Uji Kompetensi
            </span>
          </div>
        </div>

        {/* KPI 4: Total Kasir Keluar */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-blue-50 text-blue-800 rounded-2xl shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[#8C8479] text-xs font-semibold uppercase tracking-wide">
              Total Kasir Keluar
            </p>
            <p className="text-xl sm:text-2xl font-bold font-serif text-[#1F3A5F] mt-1 truncate">
              {formatRupiah(totalOutflow)}
            </p>
            <span className="text-[10px] text-blue-700 font-mono font-bold block mt-0.5">
              {transactions.length} Catatan Transaksi
            </span>
          </div>
        </div>
      </div>

      {/* Status Stages Overview */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-[#1F3A5F] text-base">
              Distribusi Tahapan & Status CPMI
            </h3>
            <p className="text-xs text-[#8C8479]">
              Pemantauan kandidat dari pendaftaran awal hingga terbang ke negara tujuan
            </p>
          </div>
          <button
            onClick={() => onNavigate('cpmi')}
            className="text-xs font-bold text-[#1F3A5F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua CPMI <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block font-mono">
              Terbang (Flight)
            </span>
            <p className="text-2xl font-bold text-emerald-900 mt-1 font-serif">
              {statusStats.terbang}
            </p>
            <span className="text-[10px] text-emerald-600">Sudah di Negara Tujuan</span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 uppercase block font-mono">
              Final Stage
            </span>
            <p className="text-2xl font-bold text-blue-900 mt-1 font-serif">
              {statusStats.final}
            </p>
            <span className="text-[10px] text-blue-600">Visa / Tiket Siap</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F5E6D3] border border-[#E8D4BE]">
            <span className="text-[10px] font-bold text-[#8B6E4E] uppercase block font-mono">
              BNSP / BLK
            </span>
            <p className="text-2xl font-bold text-[#6D5337] mt-1 font-serif">{statusStats.bnsp}</p>
            <span className="text-[10px] text-[#8B6E4E]">Pelatihan Kejuruan</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
            <span className="text-[10px] font-bold text-purple-800 uppercase block font-mono">
              Verif ID / Paspor
            </span>
            <p className="text-2xl font-bold text-purple-900 mt-1 font-serif">
              {statusStats.verif}
            </p>
            <span className="text-[10px] text-purple-600">Pemberkasan Imigrasi</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 uppercase block font-mono">
              Proses (Active)
            </span>
            <p className="text-2xl font-bold text-amber-900 mt-1 font-serif">
              {statusStats.proses}
            </p>
            <span className="text-[10px] text-amber-600">Dalam Penyiapan Dokumen</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 uppercase block font-mono">
              Batal / Kendala
            </span>
            <p className="text-2xl font-bold text-rose-900 mt-1 font-serif">
              {statusStats.batal}
            </p>
            <span className="text-[10px] text-rose-600">Ditindaklanjuti</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Category Expenses & Country Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Outflow by Category */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-[#1F3A5F] text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Distribusi Pengeluaran Kasir per Kategori
              </h3>
              <p className="text-xs text-[#8C8479]">
                Rincian biaya operasional kantor & kebutuhan pengurusan kandidat
              </p>
            </div>
            <button
              onClick={() => onNavigate('transaksi')}
              className="text-xs font-bold text-[#1F3A5F] hover:underline cursor-pointer"
            >
              Lihat Kasir →
            </button>
          </div>

          <div className="space-y-3.5">
            {categoryStats.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#1F3A5F]">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#212529]">
                      {formatRupiah(item.value)}
                    </span>
                    <span className="text-[10px] text-[#8C8479] font-mono w-9 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#F7F5F2] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1F3A5F] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Country Distribution & Top Recruiters */}
        <div className="space-y-6">
          {/* Countries Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
            <h3 className="font-serif font-bold text-[#1F3A5F] text-base flex items-center gap-2 mb-3">
              <Globe2 className="w-4 h-4 text-blue-600" />
              Negara Tujuan CPMI
            </h3>
            <div className="space-y-2">
              {countryStats.map(([country, count]) => (
                <div
                  key={country}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5F2]/70 hover:bg-[#F7F5F2] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{countryFlags[country] || '🌐'}</span>
                    <span className="text-xs font-semibold text-[#1F3A5F]">{country}</span>
                  </div>
                  <span className="text-xs font-bold font-mono bg-white px-2.5 py-0.5 rounded-md border border-[#E2DDD5] text-[#1F3A5F]">
                    {count} CPMI
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sponsors / Recruiters */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
            <h3 className="font-serif font-bold text-[#1F3A5F] text-base flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-amber-600" />
              Top Sponsor / Agen Penyalur
            </h3>
            <div className="space-y-2">
              {topRecruiters.map(([recruiter, count], idx) => (
                <div
                  key={recruiter}
                  className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-[#F7F5F2] transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[#1F3A5F] truncate">{recruiter}</span>
                  </div>
                  <span className="text-xs font-bold text-[#4B6584] font-mono shrink-0">
                    {count} Orang
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latest 5 Transactions Preview */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-[#1F3A5F] text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              5 Transaksi Kasir Terbaru
            </h3>
            <p className="text-xs text-[#8C8479]">
              Riwayat pengeluaran kasir operasional yang paling baru tercatat di sistem
            </p>
          </div>
          <button
            onClick={() => onNavigate('transaksi')}
            className="text-xs font-bold text-[#1F3A5F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Buka Buku Kas Lengkap →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2DDD5] text-[#8C8479] font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Ref CPMI / Nama</th>
                <th className="py-2.5 px-3">Catatan / Keperluan</th>
                <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD5]/50">
              {latestTransactions.map((tx) => {
                const isIncome = tx.type === 'pemasukan';
                return (
                  <tr key={tx.id} className="hover:bg-[#F7F5F2]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#8C8479] whitespace-nowrap">
                      {formatDateIndo(tx.date)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isIncome ? '+ MASUK' : '- KELUAR'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {tx.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1F3A5F]">{tx.pmiRef}</div>
                      {tx.pmiName && (
                        <span className="text-[10px] text-[#4B6584]">{tx.pmiName}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#4B6584] truncate max-w-xs">
                      {tx.description || '-'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      isIncome ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {isIncome ? '+ ' : '- '}
                      {formatRupiah(tx.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
