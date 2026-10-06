import React, { useState } from 'react';
import {
  X,
  Printer,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Building2,
  FileCheck2,
  FileSpreadsheet,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { CpmiRecord, KasTransaction } from '../types/cpmi';
import { formatRupiah, formatDateIndo, getStageStatusMeta, terbilangRupiah } from '../utils/formatters';
import { DEFAULT_STAGE_LABELS } from '../data/triasDataLoader';
import { printElementById, openPrintInNewWindow, downloadDocumentAsHtml } from '../utils/printHelper';
import { exportElementToPdf } from '../utils/pdfExport';

// -------------------------------------------------------------
// 1. LEMBAR MONITORING & KONTROL PROSES CPMI
// -------------------------------------------------------------
interface DossierPrintModalProps {
  cpmi: CpmiRecord | null;
  ptName: string;
  onClose: () => void;
}

export const DossierPrintModal: React.FC<DossierPrintModalProps> = ({ cpmi, ptName, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [toastStatus, setToastStatus] = useState<string | null>(null);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  if (!cpmi) return null;

  const handleSavePdf = async () => {
    setIsSavingPdf(true);
    setToastStatus('Sedang membuat berkas PDF...');
    try {
      const ok = await exportElementToPdf(
        'dossier-printable-content',
        `Lembar_Monitoring_CPMI_${cpmi.id}_${cpmi.name}`
      );
      if (ok) {
        setToastStatus('File PDF berhasil disimpan ke komputer Anda!');
      } else {
        setToastStatus('Mengunduh format dokumen berkas...');
        downloadDocumentAsHtml(
          'dossier-printable-content',
          `Lembar_Monitoring_CPMI_${cpmi.id}_${cpmi.name}`,
          `Lembar Monitoring CPMI - ${cpmi.id} (${cpmi.name})`
        );
      }
    } catch (e) {
      console.error('PDF error:', e);
      setToastStatus('Mengunduh format alternatif...');
      downloadDocumentAsHtml(
        'dossier-printable-content',
        `Lembar_Monitoring_CPMI_${cpmi.id}_${cpmi.name}`,
        `Lembar Monitoring CPMI - ${cpmi.id} (${cpmi.name})`
      );
    } finally {
      setIsSavingPdf(false);
      setTimeout(() => setToastStatus(null), 3500);
    }
  };

  const handlePrint = () => {
    setToastStatus('Membuka dialog cetak browser...');
    try {
      window.print();
    } catch (e) {
      console.error('Print trigger failed:', e);
      printElementById('dossier-printable-content', `Lembar_Monitoring_CPMI_${cpmi.id}`);
    }
    setTimeout(() => setToastStatus(null), 3000);
  };

  const handleDownload = () => {
    setToastStatus('Mengunduh berkas dokumen...');
    downloadDocumentAsHtml(
      'dossier-printable-content',
      `Lembar_Monitoring_CPMI_${cpmi.id}_${cpmi.name}`,
      `Lembar Monitoring CPMI - ${cpmi.id} (${cpmi.name})`
    );
    setTimeout(() => setToastStatus('Berkas dokumen berhasil diunduh!'), 600);
    setTimeout(() => setToastStatus(null), 3500);
  };

  const handleOpenWindow = () => {
    openPrintInNewWindow('dossier-printable-content', `Lembar_Monitoring_CPMI_${cpmi.id}`);
  };

  const stages = cpmi.stages || {};

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-backdrop">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-scale-up print-modal-container relative z-10">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-3 sm:p-4 bg-[#1F3A5F] text-white flex flex-wrap justify-between items-center gap-3 shrink-0 print:hidden border-b border-amber-400/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-xs sm:text-sm block">
                Pratinjau Lembar Monitoring CPMI • {cpmi.id}
              </span>
              <span className="text-[10px] text-slate-300">
                PT: {cpmi.agency || ptName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status indicator */}
            {toastStatus && (
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-400/30 animate-pulse">
                {toastStatus}
              </span>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-0.5 border border-white/15 mr-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                className="p-1 hover:bg-white/20 rounded text-slate-200 cursor-pointer"
                title="Perkecil Tampilan"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1.5">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(125, z + 10))}
                className="p-1 hover:bg-white/20 rounded text-slate-200 cursor-pointer"
                title="Perbesar Tampilan"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Standalone Window Print */}
            <button
              type="button"
              onClick={handleOpenWindow}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
              title="Buka dokumen di tab/jendela mandiri"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Jendela Baru</span>
            </button>

            {/* Save PDF Button */}
            <button
              type="button"
              disabled={isSavingPdf}
              onClick={handleSavePdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Simpan dokumen langsung menjadi berkas file PDF (.pdf)"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{isSavingPdf ? 'Membuat PDF...' : 'Simpan PDF (.pdf)'}</span>
            </button>

            {/* Print Dialog Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md active:scale-95"
              title="Buka dialog printer browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>

            {/* Download HTML Backup Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
              title="Unduh berkas dokumen cadangan HTML"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Unduh Berkas</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer ml-1"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Canvas */}
        <div className="overflow-y-auto bg-slate-100/60 p-4 sm:p-8 flex justify-center flex-1">
          <div
            id="dossier-printable-content"
            style={{ zoom: `${zoomLevel}%` }}
            className="w-full max-w-[210mm] bg-white text-[#212529] font-sans printable-area text-xs p-6 sm:p-10 shadow-lg border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-0 print:m-0"
          >
            {/* Header Kop Surat */}
            <div className="border-b-2 border-[#1F3A5F] pb-4 mb-5 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1F3A5F] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xs">
                  {cpmi.agency ? cpmi.agency.substring(3, 7).trim().toUpperCase() : 'P3MI'}
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#1F3A5F] font-serif uppercase tracking-tight">
                    {cpmi.agency || ptName}
                  </h1>
                  <p className="text-[11px] text-slate-700 font-semibold">
                    PERUSAHAAN PENEMPATAN PEKERJA MIGRAN INDONESIA (P3MI)
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Monitoring & Kontrol Berkas Resmi Registrasi BP3MI / Disnaker
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-[#1F3A5F] text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                  {cpmi.id}
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Tgl Cetak: {new Date().toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-3 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1F3A5F] underline">
                LEMBAR KONTROL & MONITORING PROSES CPMI
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">
                Arsip Pengendalian Tahapan Keberangkatan & Dokumen
              </span>
            </div>

            {/* Profil Biodata & Perusahaan */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
              <div className="space-y-1.5">
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">Nama Lengkap</span>
                  <span className="font-bold text-[#1F3A5F]">: {cpmi.name}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">Jenis Kelamin</span>
                  <span>: {cpmi.gender}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">No. WhatsApp / HP</span>
                  <span>: {cpmi.phone || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">Alamat Domisili</span>
                  <span>: {cpmi.address || 'Cirebon, Jawa Barat'}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">Tanggal Masuk</span>
                  <span className="font-mono">: {formatDateIndo(cpmi.dateInput)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">PT Penempatan</span>
                  <span className="font-bold text-[#1F3A5F]">: {cpmi.agency || ptName}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">Negara Tujuan</span>
                  <span className="font-bold text-slate-800">: {cpmi.destination}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">Sektor / Jabatan</span>
                  <span>: {cpmi.category || 'TKW (In Formal)'}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">Sponsor / PL</span>
                  <span className="font-semibold text-blue-900">: {cpmi.recruiter || 'Kantor Pusat'}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium">Status Proses</span>
                  <span className="font-bold text-amber-800">: {cpmi.status}</span>
                </div>
              </div>
            </div>

            {/* Tabel 10 Alur Proses Keberangkatan */}
            <div className="mb-5 page-break-inside-avoid">
              <h3 className="font-bold text-xs text-[#1F3A5F] uppercase mb-2 flex items-center justify-between">
                <span>1. Checklist 10 Alur Proses Keberangkatan</span>
                <span className="text-[10px] text-slate-500 font-normal">Wajib Diverifikasi Berurutan</span>
              </h3>
              <table className="w-full border border-slate-300 text-left text-[11px]">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                    <th className="p-2 border-r border-slate-300">Tahapan Proses</th>
                    <th className="p-2 border-r border-slate-300 w-32 text-center">Status</th>
                    <th className="p-2 border-r border-slate-300 w-28 text-center">Tgl Update</th>
                    <th className="p-2">Keterangan / Paraf Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(DEFAULT_STAGE_LABELS).map(([key, label], idx) => {
                    const stageObj = stages[key as keyof typeof stages] || { status: 'belum' };
                    const meta = getStageStatusMeta(stageObj.status);
                    return (
                      <tr key={key}>
                        <td className="p-1.5 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 border-r border-slate-200 font-semibold">{label}</td>
                        <td className="p-1.5 border-r border-slate-200 text-center font-bold">
                          {meta.icon} {meta.label}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 text-center font-mono text-[10px]">
                          {stageObj.updatedAt ? formatDateIndo(stageObj.updatedAt) : '-'}
                        </td>
                        <td className="p-1.5 text-slate-400">..................................</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Dokumen Fisik Checklist */}
            <div className="mb-6 page-break-inside-avoid">
              <h3 className="font-bold text-xs text-[#1F3A5F] uppercase mb-2">
                2. Verifikasi 13 Berkas Dokumen Fisik
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px] border border-slate-200 p-3 rounded-xl bg-slate-50">
                {[
                  'KTP Asli / e-KTP',
                  'Kartu Keluarga (KK)',
                  'Akta Kelahiran Asli',
                  'Ijazah Terakhir',
                  'Surat Izin Keluarga / Suami',
                  'Buku Paspor Asli',
                  'Medical Check Up (MCU Pra)',
                  'Dokumen Sponsor / Rekom PL',
                  'Job Order / Kontrak Kerja',
                  'Visa Kerja Resmi Kedutaan',
                  'Sertifikat PAP BP3MI',
                  'Verifikasi ID E-PMI',
                  'Tiket Pesawat Terbang',
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-4 h-4 border border-slate-400 inline-flex items-center justify-center font-bold text-[10px] bg-white">
                      ✓
                    </span>
                    <span className="text-slate-700">{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Area Tanda Tangan */}
            <div className="grid grid-cols-3 gap-6 text-center text-[11px] pt-4 border-t border-slate-300 page-break-inside-avoid">
              <div>
                <p className="text-slate-500 mb-14">Calon Pekerja (CPMI),</p>
                <p className="font-bold text-[#1F3A5F] uppercase underline">{cpmi.name}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-14">Sponsor / PL Lapangan,</p>
                <p className="font-bold text-[#1F3A5F] uppercase underline">
                  ( {cpmi.recruiter || '........................'} )
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-14">Petugas / Pimpinan Cabang,</p>
                <p className="font-bold text-[#1F3A5F] uppercase underline">
                  ( ADMINISTRATOR RESMI )
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. KWITANSI RESMI KASIR OPERASIONAL
// -------------------------------------------------------------
interface ReceiptPrintModalProps {
  transaction: KasTransaction | null;
  ptName: string;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  transaction,
  ptName,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [toastStatus, setToastStatus] = useState<string | null>(null);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === 'pemasukan';

  const handleSavePdf = async () => {
    setIsSavingPdf(true);
    setToastStatus('Sedang membuat berkas PDF kwitansi...');
    try {
      const ok = await exportElementToPdf(
        'receipt-printable-content',
        `Kwitansi_${isIncome ? 'Masuk' : 'Keluar'}_${transaction.pmiRef || transaction.id}`
      );
      if (ok) {
        setToastStatus('File PDF kwitansi berhasil disimpan!');
      } else {
        downloadDocumentAsHtml(
          'receipt-printable-content',
          `Kwitansi_${transaction.pmiRef || transaction.id}`,
          `Kwitansi Kasir - ${transaction.pmiRef || transaction.id}`
        );
      }
    } catch (e) {
      console.error('PDF error:', e);
      downloadDocumentAsHtml(
        'receipt-printable-content',
        `Kwitansi_${transaction.pmiRef || transaction.id}`,
        `Kwitansi Kasir - ${transaction.pmiRef || transaction.id}`
      );
    } finally {
      setIsSavingPdf(false);
      setTimeout(() => setToastStatus(null), 3500);
    }
  };

  const handlePrint = () => {
    setToastStatus('Membuka dialog cetak...');
    try {
      window.print();
    } catch {
      printElementById('receipt-printable-content', `Kwitansi_${transaction.pmiRef || transaction.id}`);
    }
    setTimeout(() => setToastStatus(null), 3000);
  };

  const handleDownload = () => {
    downloadDocumentAsHtml(
      'receipt-printable-content',
      `Kwitansi_${transaction.pmiRef || transaction.id}`,
      `Kwitansi Kasir - ${transaction.pmiRef || transaction.id}`
    );
    setToastStatus('Kwitansi berhasil diunduh!');
    setTimeout(() => setToastStatus(null), 3000);
  };

  const handleOpenWindow = () => {
    openPrintInNewWindow('receipt-printable-content', `Kwitansi_${transaction.pmiRef || transaction.id}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-backdrop">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-up print-modal-container relative z-10">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-3 sm:p-4 bg-[#1F3A5F] text-white flex justify-between items-center print:hidden border-b border-amber-400/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-xs sm:text-sm block">
                {isIncome ? 'Kwitansi Kas Masuk (Pemasukan)' : 'Kwitansi Pengeluaran Kasir'} • {transaction.pmiRef || 'UMUM'}
              </span>
              <span className="text-[10px] text-slate-300">
                {transaction.noReff || `KW-${transaction.id.slice(-6)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {toastStatus && (
              <span className="text-[11px] font-bold text-amber-300 mr-1 animate-pulse">
                {toastStatus}
              </span>
            )}

            <button
              type="button"
              disabled={isSavingPdf}
              onClick={handleSavePdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Simpan berkas PDF (.pdf) langsung"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{isSavingPdf ? 'Membuat PDF...' : 'Simpan PDF (.pdf)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kwitansi</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
              title="Unduh file HTML"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Canvas */}
        <div className="p-4 sm:p-6 bg-slate-100/60 flex justify-center">
          <div
            id="receipt-printable-content"
            style={{ zoom: `${zoomLevel}%` }}
            className={`w-full max-w-[190mm] bg-[#FFFEFA] text-[#212529] font-sans border-4 border-double ${
              isIncome ? 'border-emerald-800' : 'border-[#1F3A5F]'
            } p-6 sm:p-8 rounded-2xl printable-area shadow-md print:shadow-none print:m-0`}
          >
            {/* Header Kwitansi */}
            <div className={`flex justify-between items-start border-b-2 ${
              isIncome ? 'border-emerald-700' : 'border-[#1F3A5F]'
            } pb-3 mb-4`}>
              <div>
                <h2 className="text-base font-bold font-serif text-[#1F3A5F] uppercase">
                  {ptName}
                </h2>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${
                  isIncome ? 'text-emerald-800' : 'text-slate-800'
                }`}>
                  {isIncome
                    ? 'KWITANSI RESMI BUKTI PENERIMAAN KAS (KAS MASUK)'
                    : 'BUKTI PENGELUARAN KAS KASIR OPERASIONAL CABANG'}
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  Sistem Informasi Pembukuan Dana CPMI Resmi • {isIncome ? 'Penerimaan Dana Masuk' : 'Pengeluaran Kas Keluar'}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  isIncome ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  No: {transaction.noReff || `${isIncome ? 'KM' : 'KW'}-${transaction.id.slice(-6)}`}
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Tanggal: {formatDateIndo(transaction.date)}
                </p>
              </div>
            </div>

            {/* Isian Data Transaksi */}
            <div className="space-y-2.5 text-xs mb-5">
              <div className="flex">
                <span className="w-36 text-slate-500 font-medium shrink-0">
                  {isIncome ? 'Telah Diterima Dari' : 'Telah Diterima Dari'}
                </span>
                <span className="font-bold text-[#1F3A5F]">
                  : {isIncome
                    ? (transaction.pmiName ? `${transaction.pmiName} (${transaction.pmiRef})` : transaction.pmiRef || 'Penyetor / CPMI')
                    : 'Kasir Operasional Cabang'}
                </span>
              </div>
              {!isIncome && transaction.pmiName && (
                <div className="flex">
                  <span className="w-36 text-slate-500 font-medium shrink-0">Diserahkan Kepada</span>
                  <span className="font-bold text-[#1F3A5F]">
                    : {transaction.pmiName} ({transaction.pmiRef})
                  </span>
                </div>
              )}
              <div className="flex">
                <span className="w-36 text-slate-500 font-medium shrink-0">Untuk Keperluan</span>
                <span className="font-bold">: {transaction.category}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-500 font-medium shrink-0">Referensi CPMI</span>
                <span className="font-bold text-blue-900">
                  : {transaction.pmiRef} {transaction.pmiName ? `(${transaction.pmiName})` : ''}
                </span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-500 font-medium shrink-0">Metode Transaksi</span>
                <span className="font-semibold text-slate-800">
                  : {transaction.paymentMethod || 'Tunai / Cash'}
                </span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-500 font-medium shrink-0">Keterangan / Uraian</span>
                <span className="text-slate-700">: {transaction.description || '-'}</span>
              </div>
            </div>

            {/* Kotak Nominal Rupiah & Terbilang */}
            <div className={`p-3.5 rounded-xl border mb-6 ${
              isIncome ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-100 border-slate-300'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-serif font-bold text-xs uppercase text-slate-600">
                  Jumlah Nominal:
                </span>
                <span className={`text-lg sm:text-xl font-mono font-bold ${
                  isIncome ? 'text-emerald-700' : 'text-[#1F3A5F]'
                }`}>
                  {formatRupiah(transaction.value)}
                </span>
              </div>
              <div className="text-[11px] italic text-slate-600 border-t border-slate-200 pt-1.5">
                Terbilang: <span className="font-semibold text-slate-800 font-serif">{terbilangRupiah(transaction.value)}</span>
              </div>
            </div>

            {/* Area Tanda Tangan */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs pt-3 border-t border-slate-300">
              <div>
                <p className="text-slate-500 mb-14">
                  {isIncome ? 'Penyetor / CPMI,' : 'Penerima Dana / Sponsor / CPMI,'}
                </p>
                <p className="font-bold text-[#1F3A5F] uppercase underline">
                  ( {transaction.pmiName || '........................'} )
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-14">
                  {isIncome ? 'Kasir Penerima Dana,' : 'Kasir Pembukuan Cabang,'}
                </p>
                <p className="font-bold text-[#1F3A5F] uppercase underline">
                  ( {transaction.receivedBy || 'KASIR CABANG'} )
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. LAPORAN KONSOLIDASI & AUDIT KEUANGAN (PRINT VIEW)
// -------------------------------------------------------------
interface ReportConsolidatedPrintModalProps {
  cpmis: CpmiRecord[];
  transactions: KasTransaction[];
  ptName: string;
  onClose: () => void;
}

export const ReportConsolidatedPrintModal: React.FC<ReportConsolidatedPrintModalProps> = ({
  cpmis,
  transactions,
  ptName,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [toastStatus, setToastStatus] = useState<string | null>(null);

  const [isSavingPdf, setIsSavingPdf] = useState(false);

  const totalInflow = transactions
    .filter((tx) => tx.type === 'pemasukan')
    .reduce((acc, tx) => acc + tx.value, 0);
  const totalOutflow = transactions
    .filter((tx) => tx.type !== 'pemasukan')
    .reduce((acc, tx) => acc + tx.value, 0);
  const netBalance = totalInflow - totalOutflow;

  const handleSavePdf = async () => {
    setIsSavingPdf(true);
    setToastStatus('Sedang membuat berkas PDF rekap...');
    try {
      const ok = await exportElementToPdf(
        'report-printable-content',
        `Laporan_Konsolidasi_${ptName}`
      );
      if (ok) {
        setToastStatus('File PDF laporan berhasil disimpan!');
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    } finally {
      setIsSavingPdf(false);
      setTimeout(() => setToastStatus(null), 3500);
    }
  };

  const candidateStats = cpmis.map((c) => {
    const relatedTxs = transactions.filter((tx) => {
      const cleanTx = (tx.pmiRef || '').replace(/\s+/g, '').toUpperCase();
      const cleanCpmi = (c.id || '').replace(/\s+/g, '').toUpperCase();
      return cleanTx === cleanCpmi;
    });

    const spent = relatedTxs.reduce((acc, tx) => acc + tx.value, 0);
    return {
      id: c.id,
      name: c.name,
      agency: c.agency || ptName,
      recruiter: c.recruiter || '-',
      destination: c.destination || 'Taiwan',
      status: c.status,
      totalSpent: spent,
      txCount: relatedTxs.length,
    };
  });

  const totalIdentifiedSpend = candidateStats.reduce((acc, c) => acc + c.totalSpent, 0);
  const activeCandidatesCount = candidateStats.filter((c) => c.txCount > 0).length;
  const avgSpendPerActive = Math.round(totalIdentifiedSpend / (activeCandidatesCount || 1));

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  transactions.forEach((tx) => {
    const cat = tx.category || 'Lainnya';
    categoryMap[cat] = (categoryMap[cat] || 0) + tx.value;
  });

  const handlePrint = () => {
    setToastStatus('Membuka dialog cetak...');
    try {
      window.print();
    } catch {
      printElementById('report-printable-content', `Laporan_Konsolidasi_${ptName}`);
    }
    setTimeout(() => setToastStatus(null), 3000);
  };

  const handleDownload = () => {
    downloadDocumentAsHtml(
      'report-printable-content',
      `Laporan_Konsolidasi_${ptName}`,
      `Laporan Konsolidasi - ${ptName}`
    );
    setToastStatus('Laporan berhasil diunduh!');
    setTimeout(() => setToastStatus(null), 3000);
  };

  const handleOpenWindow = () => {
    openPrintInNewWindow('report-printable-content', `Laporan_Konsolidasi_${ptName}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-backdrop">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-scale-up print-modal-container relative z-10">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 bg-[#1F3A5F] text-white flex justify-between items-center print:hidden border-b border-amber-400/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-xs sm:text-sm block">
                Pratinjau Laporan Konsolidasi Keuangan & CPMI
              </span>
              <span className="text-[10px] text-slate-300">
                {ptName} • {cpmis.length} CPMI Terdaftar • {transactions.length} Transaksi Kas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {toastStatus && (
              <span className="text-[11px] font-bold text-amber-300 mr-1 animate-pulse">
                {toastStatus}
              </span>
            )}

            <button
              type="button"
              disabled={isSavingPdf}
              onClick={handleSavePdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Simpan rekapitulasi langsung ke berkas PDF"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{isSavingPdf ? 'Membuat PDF...' : 'Simpan PDF (.pdf)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
              title="Unduh format HTML"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Canvas */}
        <div className="overflow-y-auto bg-slate-100/60 p-4 sm:p-8 flex justify-center flex-1">
          <div
            id="report-printable-content"
            style={{ zoom: `${zoomLevel}%` }}
            className="w-full max-w-[210mm] bg-white text-[#212529] font-sans printable-area text-xs p-6 sm:p-10 shadow-lg border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-0 print:m-0"
          >
            {/* Kop Surat Laporan */}
            <div className="border-b-2 border-[#1F3A5F] pb-4 mb-5 flex justify-between items-start">
              <div>
                <h1 className="text-lg font-bold text-[#1F3A5F] font-serif uppercase tracking-tight">
                  {ptName}
                </h1>
                <p className="text-xs text-slate-700 font-semibold">
                  LAPORAN KONSOLIDASI KEUANGAN OPERASIONAL & BUKU KAS KASIR
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Periode Rekapitulasi Audit CPMI & Dana Sponsor
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-[#1F3A5F] text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                  LAPORAN EKSEKUTIF
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Dicetak: {new Date().toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            {/* 4 KPI Ringkasan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-medium block">Total Kas Keluar</span>
                <span className="text-sm font-bold text-[#1F3A5F] font-mono">{formatRupiah(totalOutflow)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-medium block">Kas Terkait CPMI</span>
                <span className="text-sm font-bold text-blue-900 font-mono">{formatRupiah(totalIdentifiedSpend)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-medium block">Beban Kantor</span>
                <span className="text-sm font-bold text-amber-800 font-mono">
                  {formatRupiah(Math.max(0, totalOutflow - totalIdentifiedSpend))}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-medium block">Rata-rata / CPMI</span>
                <span className="text-sm font-bold text-emerald-800 font-mono">{formatRupiah(avgSpendPerActive)}</span>
              </div>
            </div>

            {/* Rincian Kategori Pengeluaran */}
            <div className="mb-6 page-break-inside-avoid">
              <h3 className="font-bold text-xs text-[#1F3A5F] uppercase mb-2">
                1. Alokasi Pengeluaran Berdasarkan Kategori
              </h3>
              <table className="w-full border border-slate-300 text-left text-[11px]">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">No</th>
                    <th className="p-2 border-r border-slate-300">Kategori Biaya</th>
                    <th className="p-2 border-r border-slate-300 text-right">Total Pengeluaran (Rp)</th>
                    <th className="p-2 text-right w-24">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(categoryMap).map(([cat, val], idx) => {
                    const pct = totalOutflow > 0 ? ((val / totalOutflow) * 100).toFixed(1) : '0';
                    return (
                      <tr key={cat}>
                        <td className="p-1.5 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 border-r border-slate-200 font-semibold">{cat}</td>
                        <td className="p-1.5 border-r border-slate-200 text-right font-mono font-bold">
                          {formatRupiah(val)}
                        </td>
                        <td className="p-1.5 text-right font-mono">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rekapitulasi Kas Per CPMI */}
            <div className="mb-6 page-break-inside-avoid">
              <h3 className="font-bold text-xs text-[#1F3A5F] uppercase mb-2">
                2. Rekapitulasi Biaya Per Calon Pekerja Migran Indonesia (CPMI)
              </h3>
              <table className="w-full border border-slate-300 text-left text-[11px]">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">No</th>
                    <th className="p-2 border-r border-slate-300 w-24">ID CPMI</th>
                    <th className="p-2 border-r border-slate-300">Nama Kandidat</th>
                    <th className="p-2 border-r border-slate-300">PT Penempatan</th>
                    <th className="p-2 border-r border-slate-300">Sponsor / PL</th>
                    <th className="p-2 border-r border-slate-300">Status</th>
                    <th className="p-2 text-right">Total Kas Tercatat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {candidateStats.slice(0, 30).map((c, idx) => (
                    <tr key={c.id}>
                      <td className="p-1.5 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-200 font-mono font-bold text-[#1F3A5F]">{c.id}</td>
                      <td className="p-1.5 border-r border-slate-200 font-semibold">{c.name}</td>
                      <td className="p-1.5 border-r border-slate-200 text-[10px] text-slate-600">{c.agency}</td>
                      <td className="p-1.5 border-r border-slate-200">{c.recruiter}</td>
                      <td className="p-1.5 border-r border-slate-200">{c.status}</td>
                      <td className="p-1.5 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(c.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {candidateStats.length > 30 && (
                <p className="text-[10px] text-slate-400 italic mt-1 text-center">
                  * Menampilkan 30 dari {candidateStats.length} CPMI terdaftar. Ekspor Excel untuk rincian lengkap.
                </p>
              )}
            </div>

            {/* Tanda Tangan Pengesahan Laporan */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-300 page-break-inside-avoid">
              <div>
                <p className="text-slate-500 mb-14">Dibuat & Diverifikasi Oleh Kasir,</p>
                <p className="font-bold text-[#1F3A5F] uppercase underline">( STAF KASIR PEMBUKUAN )</p>
              </div>
              <div>
                <p className="text-slate-500 mb-14">Disetujui Oleh Pimpinan Cabang,</p>
                <p className="font-bold text-[#1F3A5F] uppercase underline">( PIMPINAN CABANG )</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
