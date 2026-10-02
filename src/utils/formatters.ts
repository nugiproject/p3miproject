import { CpmiFinance, DocCheckStatus, StageStatus } from '../types/cpmi';

export function formatRupiah(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function calculateCpmiFinance(f: CpmiFinance) {
  const totalIncome =
    (Number(f.feeSponsor) || 0) +
    (Number(f.feeCpmi) || 0) +
    (Number(f.feeAgency) || 0) +
    (Number(f.feeLainnya) || 0);

  const totalExpense =
    (Number(f.biayaTransport) || 0) +
    (Number(f.biayaMcuPra) || 0) +
    (Number(f.biayaPaspor) || 0) +
    (Number(f.biayaAdministrasi) || 0) +
    (Number(f.biayaVisa) || 0) +
    (Number(f.biayaTiket) || 0) +
    (Number(f.biayaPenginapan) || 0) +
    (Number(f.biayaMakan) || 0) +
    (Number(f.biayaDokumen) || 0) +
    (Number(f.biayaLainnya) || 0);

  const profit = totalIncome - totalExpense;
  const marginPercent = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : '0';

  const totalTagihan = Number(f.totalTagihan) || 0;
  const sudahDibayar = Number(f.sudahDibayar) || 0;
  const sisaTagihan = Math.max(0, totalTagihan - sudahDibayar);

  return {
    totalIncome,
    totalExpense,
    profit,
    marginPercent,
    totalTagihan,
    sudahDibayar,
    sisaTagihan,
  };
}

export function getStageStatusMeta(status: StageStatus) {
  switch (status) {
    case 'selesai':
      return {
        label: 'Selesai',
        icon: '🟢',
        bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        badgeClass: 'bg-emerald-100 text-emerald-800',
      };
    case 'proses':
      return {
        label: 'Sedang Diproses',
        icon: '🟡',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        badgeClass: 'bg-amber-100 text-amber-800',
      };
    case 'masalah':
      return {
        label: 'Bermasalah',
        icon: '🔴',
        bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
        badgeClass: 'bg-rose-100 text-rose-800',
      };
    case 'belum':
    default:
      return {
        label: 'Belum',
        icon: '⬜',
        bgClass: 'bg-slate-50 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-300',
        badgeClass: 'bg-slate-100 text-slate-700',
      };
  }
}

export function getCpmiStatusMeta(status: string) {
  const norm = (status || '').toUpperCase();
  if (norm.includes('FLIGHT') || norm.includes('TERBANG') || norm.includes('SUDAH TERBANG')) {
    return {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
      label: 'TERBANG (FLIGHT)',
    };
  }
  if (norm.includes('FINAL STAGE') || norm.includes('SIAP TERBANG')) {
    return {
      bg: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-600',
      label: 'FINAL STAGE',
    };
  }
  if (norm.includes('BNSP') || norm.includes('BLK')) {
    return {
      bg: 'bg-[#F5E6D3] text-[#8B6E4E] border-[#E8D4BE]',
      dot: 'bg-[#8B6E4E]',
      label: 'BNSP / BLK',
    };
  }
  if (norm.includes('VERIF') || norm.includes('ID PASPOR')) {
    return {
      bg: 'bg-purple-100 text-purple-800 border-purple-200',
      dot: 'bg-purple-600',
      label: 'VERIFIKASI ID',
    };
  }
  if (norm.includes('CANCEL') || norm.includes('BATAL') || norm.includes('TOLAK') || norm.includes('BERMASALAH')) {
    return {
      bg: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-600',
      label: 'BATAL / MASALAH',
    };
  }
  if (norm.includes('SPONSOR')) {
    return {
      bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      dot: 'bg-indigo-600',
      label: 'SPONSOR',
    };
  }
  return {
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    label: status || 'PROCESS',
  };
}

export function getDocStatusMeta(status: boolean | DocCheckStatus | undefined) {
  if (status === true || status === 'ada') {
    return { label: 'Lengkap / Ada', icon: '✅', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (status === 'kurang') {
    return { label: 'Perlu Revisi', icon: '⚠️', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  return { label: 'Belum Ada', icon: '⬜', color: 'text-slate-500 bg-slate-50 border-slate-200' };
}

export function getPaymentStatusMeta(status: string) {
  switch (status) {
    case 'Lunas':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Lunas' };
    case 'DP':
      return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'DP' };
    case 'Sebagian':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Sebagian' };
    case 'Belum Bayar':
    default:
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Belum Bayar' };
  }
}

export function terbilangRupiah(nominal: number): string {
  if (!nominal || isNaN(nominal) || nominal <= 0) return 'Nol Rupiah';

  const angka = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas'
  ];

  function konversi(n: number): string {
    if (n < 12) return angka[n];
    if (n < 20) return konversi(n - 10) + ' Belas';
    if (n < 100) return konversi(Math.floor(n / 10)) + ' Puluh ' + konversi(n % 10);
    if (n < 200) return 'Seratus ' + konversi(n - 100);
    if (n < 1000) return konversi(Math.floor(n / 100)) + ' Ratus ' + konversi(n % 100);
    if (n < 2000) return 'Seribu ' + konversi(n - 1000);
    if (n < 1000000) return konversi(Math.floor(n / 1000)) + ' Ribu ' + konversi(n % 1000);
    if (n < 1000000000) return konversi(Math.floor(n / 1000000)) + ' Juta ' + konversi(n % 1000000);
    if (n < 1000000000000) return konversi(Math.floor(n / 1000000000)) + ' Miliar ' + konversi(n % 1000000000);
    return konversi(Math.floor(n / 1000000000000)) + ' Triliun ' + konversi(n % 1000000000000);
  }

  const hasil = konversi(Math.floor(nominal)).trim().replace(/\s+/g, ' ');
  return hasil + ' Rupiah';
}

