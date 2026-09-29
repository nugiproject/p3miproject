import * as XLSX from 'xlsx';
import { CpmiRecord, KasTransaction } from '../types/cpmi';
import { formatRupiah } from '../utils/formatters';

export function exportTriasMultiSheetExcel(
  cpmis: CpmiRecord[],
  transactions: KasTransaction[],
  ptName: string = 'PT. TRIAS INSAN MADANI - CABANG CIREBON'
) {
  const totalOutflow = transactions.reduce((acc, tx) => acc + tx.value, 0);

  // Group transactions per CPMI
  const candidateStats = cpmis.map((c) => {
    const relatedTxs = transactions.filter((tx) => {
      const cleanTx = (tx.pmiRef || '').replace(/\s+/g, '').toUpperCase();
      const cleanCpmi = (c.id || '').replace(/\s+/g, '').toUpperCase();
      return cleanTx === cleanCpmi;
    });

    const categoryAmounts: Record<string, number> = {};
    let spent = 0;

    relatedTxs.forEach((tx) => {
      const cat = tx.category || 'Keterangan Lain';
      categoryAmounts[cat] = (categoryAmounts[cat] || 0) + tx.value;
      spent += tx.value;
    });

    return {
      id: c.id,
      name: c.name,
      recruiter: c.recruiter || '-',
      destination: c.destination || 'Taiwan',
      status: c.status,
      totalSpent: spent,
      categoryAmounts,
      txCount: relatedTxs.length,
    };
  });

  const totalIdentifiedSpend = candidateStats.reduce((acc, c) => acc + c.totalSpent, 0);
  const activeCandidatesCount = candidateStats.filter((c) => c.txCount > 0).length;
  const avgSpendPerActive = Math.round(totalIdentifiedSpend / (activeCandidatesCount || 1));

  // 1. Executive Summary
  const summaryData = [
    { 'METRIK LAPORAN KEUANGAN': `LAPORAN KAS UTAMA - ${ptName}`, 'NILAI / DETAIL': '' },
    {
      'METRIK LAPORAN KEUANGAN': 'Tanggal Ekspor Laporan',
      'NILAI / DETAIL': new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    {
      'METRIK LAPORAN KEUANGAN': 'Total Seluruh Dana Keluar (Budget Outflow)',
      'NILAI / DETAIL': formatRupiah(totalOutflow),
    },
    {
      'METRIK LAPORAN KEUANGAN': 'Total Pengeluaran Khusus CPMI Teridentifikasi',
      'NILAI / DETAIL': formatRupiah(totalIdentifiedSpend),
    },
    {
      'METRIK LAPORAN KEUANGAN': 'Total Pengeluaran Operasional / Overhead Kantor',
      'NILAI / DETAIL': formatRupiah(totalOutflow - totalIdentifiedSpend),
    },
    {
      'METRIK LAPORAN KEUANGAN': 'Jumlah Total CPMI Terdaftar di Database',
      'NILAI / DETAIL': `${cpmis.length} Orang`,
    },
    {
      'METRIK LAPORAN KEUANGAN': 'Jumlah CPMI dengan Catatan Kas Aktif',
      'NILAI / DETAIL': `${activeCandidatesCount} Orang`,
    },
    {
      'METRIK LAPORAN KEUANGAN': 'Rata-rata Biaya Keluar per CPMI Aktif',
      'NILAI / DETAIL': formatRupiah(avgSpendPerActive),
    },
    {
      'METRIK LAPORAN KEUANGAN': 'Total Transaksi Kas Masuk & Keluar',
      'NILAI / DETAIL': `${transactions.length} Transaksi`,
    },
  ];

  // 2. Breakdown Per CPMI
  const breakdownData = candidateStats.map((c, idx) => ({
    No: idx + 1,
    'ID CPMI (Referensi)': c.id,
    'Nama Lengkap CPMI': c.name,
    'Sponsor / PL': c.recruiter,
    'Negara Tujuan': c.destination,
    'Status Proses': c.status,
    'Fee Sponsor': formatRupiah(c.categoryAmounts['Fee Sponsor'] || 0),
    'Biaya MD': formatRupiah(c.categoryAmounts['Biaya MD'] || 0),
    'ID Paspor': formatRupiah(c.categoryAmounts['ID Paspor'] || 0),
    'Living Cost': formatRupiah(c.categoryAmounts['Living Cost'] || 0),
    Transport: formatRupiah(c.categoryAmounts['Transport'] || 0),
    'MCU Pra': formatRupiah(c.categoryAmounts['Mcu Pra'] || 0),
    Royalti: formatRupiah(c.categoryAmounts['Royalti'] || 0),
    'Lainnya / Operasional': formatRupiah(c.categoryAmounts['Keterangan Lain'] || 0),
    'Total Pengeluaran Kas': formatRupiah(c.totalSpent),
    'Jumlah Transaksi Terkait': c.txCount,
  }));

  // 3. Seluruh Riwayat Buku Kas
  const transactionsData = transactions.map((tx, idx) => ({
    No: idx + 1,
    'ID Transaksi': tx.id,
    'Referensi CPMI (ID)': tx.pmiRef,
    'Nama Kandidat / CPMI': tx.pmiName || 'OPERASIONAL KANTOR',
    'Kategori Pengeluaran': tx.category,
    Tanggal: tx.date,
    'Jumlah Pengeluaran': formatRupiah(tx.value),
    'Nilai Angka (IDR)': tx.value,
    'No Referensi': tx.noReff || '-',
    'Keterangan Tambahan': tx.description || '-',
  }));

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  const breakdownSheet = XLSX.utils.json_to_sheet(breakdownData);
  const txSheet = XLSX.utils.json_to_sheet(transactionsData);

  // Set column widths
  summarySheet['!cols'] = [{ wch: 45 }, { wch: 35 }];
  breakdownSheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
    { wch: 15 },
  ];
  txSheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 18 },
    { wch: 26 },
    { wch: 20 },
    { wch: 14 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
  XLSX.utils.book_append_sheet(workbook, breakdownSheet, 'Breakdown Per CPMI');
  XLSX.utils.book_append_sheet(workbook, txSheet, 'Seluruh Riwayat Buku Kas');

  const cleanPt = ptName.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().substring(0, 10);
  XLSX.writeFile(workbook, `${cleanPt}_Laporan_Keuangan_${dateStr}.xlsx`);
}

export function exportCustomFilteredExcel(
  records: CpmiRecord[],
  transactions: KasTransaction[],
  filterTitle: string = 'Data_Terfilter'
) {
  const exportRows = records.map((c, idx) => {
    const relatedTxs = transactions.filter((tx) => {
      const cleanTx = (tx.pmiRef || '').replace(/\s+/g, '').toUpperCase();
      const cleanCpmi = (c.id || '').replace(/\s+/g, '').toUpperCase();
      return cleanTx === cleanCpmi;
    });
    const totalSpent = relatedTxs.reduce((sum, tx) => sum + tx.value, 0);

    return {
      No: idx + 1,
      'ID CPMI': c.id,
      'Nama Lengkap': c.name,
      'Jenis Kelamin': c.gender,
      'Negara Tujuan': c.destination,
      'Posisi Pekerjaan': c.category || 'TKW (In Formal)',
      'Sponsor / PL': c.recruiter || '-',
      'Status Proses': c.status,
      'Total Kas Tercatat': formatRupiah(totalSpent),
      'Jumlah Transaksi': relatedTxs.length,
      'Status Pembayaran': c.finance?.statusPembayaran || 'Lunas',
      'Tanggal Input': c.dateInput || '-',
      'No. WhatsApp': c.phone || '-',
      Alamat: c.address || '-',
    };
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 28 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'CPMI Terfilter');
  const dateStr = new Date().toISOString().substring(0, 10);
  XLSX.writeFile(workbook, `CPMI_${filterTitle}_${dateStr}.xlsx`);
}
