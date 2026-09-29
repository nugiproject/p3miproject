import React from 'react';
import { X, Printer, Building2 } from 'lucide-react';
import { CpmiRecord, KasTransaction } from '../types/cpmi';
import { formatRupiah, formatDateIndo, getStageStatusMeta } from '../utils/formatters';
import { DEFAULT_STAGE_LABELS } from '../data/triasDataLoader';

// 1. LEMBAR MONITORING CPMI
interface DossierPrintModalProps {
  cpmi: CpmiRecord | null;
  ptName: string;
  onClose: () => void;
}

export const DossierPrintModal: React.FC<DossierPrintModalProps> = ({ cpmi, ptName, onClose }) => {
  if (!cpmi) return null;

  const handlePrint = () => {
    window.print();
  };

  const stages = cpmi.stages || {};
  const documents = cpmi.documents || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="p-4 bg-[#1F3A5F] text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-300" />
            <span className="font-serif font-bold text-sm">
              Pratinjau Lembar Monitoring & Kontrol CPMI - {cpmi.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white text-[#212529] font-sans printable-area text-xs">
          {/* Header Kop Surat */}
          <div className="border-b-2 border-[#1F3A5F] pb-4 mb-6 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1F3A5F] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                TIM
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#1F3A5F] font-serif uppercase tracking-tight">
                  {ptName}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  PERUSAHAAN PENEMPATAN PEKERJA MIGRAN INDONESIA (P3MI) CABANG CIREBON
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Sistem Informasi Monitoring CPMI • Registrasi Resmi BP3MI & Kemenaker
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

          <div className="text-center my-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1F3A5F] underline">
              LEMBAR KONTROL & MONITORING PROSES CPMI
            </h2>
          </div>

          {/* Profil Biodata */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-32 text-slate-500">Nama Lengkap</span>
                <span className="font-bold text-[#1F3A5F]">: {cpmi.name}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Jenis Kelamin</span>
                <span>: {cpmi.gender}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">No. WhatsApp/HP</span>
                <span>: {cpmi.phone || '-'}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Alamat Asal</span>
                <span>: {cpmi.address || 'Cirebon, Jawa Barat'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-32 text-slate-500">Negara Tujuan</span>
                <span className="font-bold">: {cpmi.destination}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Sektor / Jabatan</span>
                <span>: {cpmi.category || 'TKW (In Formal)'}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Sponsor / PL</span>
                <span className="font-semibold text-blue-900">: {cpmi.recruiter || 'Kantor Pusat'}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Status Saat Ini</span>
                <span className="font-bold text-amber-800">: {cpmi.status}</span>
              </div>
            </div>
          </div>

          {/* Tabel 10 Alur Proses */}
          <div className="mb-6">
            <h3 className="font-bold text-xs text-[#1F3A5F] uppercase mb-2">
              1. Checklist 10 Alur Keberangkatan CPMI
            </h3>
            <table className="w-full border border-slate-300 text-left text-[11px]">
              <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                  <th className="p-2 border-r border-slate-300">Tahapan Proses</th>
                  <th className="p-2 border-r border-slate-300 w-32 text-center">Status</th>
                  <th className="p-2 border-r border-slate-300 w-28 text-center">Tgl Update</th>
                  <th className="p-2">Keterangan / Paraf</th>
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

          {/* Dokumen Checklist */}
          <div className="mb-8">
            <h3 className="font-bold text-xs text-[#1F3A5F] uppercase mb-2">
              2. Verifikasi 13 Berkas Dokumen Fisik
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] border border-slate-200 p-3 rounded-xl bg-slate-50">
              {[
                'KTP Asli / e-KTP',
                'Kartu Keluarga (KK)',
                'Akta Kelahiran',
                'Ijazah Terakhir',
                'Surat Izin Keluarga / Suami',
                'Buku Paspor Asli',
                'Medical Check Up (MCU Pra)',
                'Dokumen Sponsor / PL',
                'Job Order / Kontrak Kerja',
                'Visa Kerja Resmi',
                'Sertifikat PAP BP3MI',
                'Verifikasi E-PMI',
                'Tiket Pesawat Terbang',
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-4 h-4 border border-slate-400 inline-flex items-center justify-center font-bold text-[10px] bg-white">
                    ✓
                  </span>
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Area Tanda Tangan */}
          <div className="grid grid-cols-3 gap-6 text-center text-[11px] pt-4 border-t border-slate-300">
            <div>
              <p className="text-slate-500 mb-16">Calon Pekerja (CPMI),</p>
              <p className="font-bold text-[#1F3A5F] uppercase underline">{cpmi.name}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Sponsor / PL Lapangan,</p>
              <p className="font-bold text-[#1F3A5F] uppercase underline">
                ( {cpmi.recruiter || '........................'} )
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Petugas Cabang Cirebon,</p>
              <p className="font-bold text-[#1F3A5F] uppercase underline">( ADMINISTRATOR CABANG )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. KWITANSI RESMI KASIR
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
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-up">
        {/* Top Action Bar (Hidden during print) */}
        <div className="p-4 bg-[#1F3A5F] text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-300" />
            <span className="font-serif font-bold text-sm">
              Kwitansi Kasir Operasional - {transaction.pmiRef}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kwitansi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Kwitansi Body */}
        <div className="p-8 sm:p-10 bg-[#FFFEFA] text-[#212529] font-sans border-4 border-double border-[#1F3A5F] m-4 rounded-2xl printable-area">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-[#1F3A5F] pb-3 mb-5">
            <div>
              <h2 className="text-base font-bold font-serif text-[#1F3A5F] uppercase">
                {ptName}
              </h2>
              <p className="text-[10px] text-slate-600 font-medium">
                BUKTI PENGELUARAN KAS KASIR OPERASIONAL CABANG CIREBON
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-600">
                No: {transaction.noReff || `KW-${transaction.id.slice(-6)}`}
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Tanggal: {formatDateIndo(transaction.date)}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs mb-6">
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">Telah Diterima Dari</span>
              <span className="font-bold text-[#1F3A5F]">: Kasir Operasional Kantor Cabang Cirebon</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">Untuk Pembayaran</span>
              <span className="font-bold">: {transaction.category}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">Referensi CPMI</span>
              <span className="font-bold text-blue-900">
                : {transaction.pmiRef} {transaction.pmiName ? `(${transaction.pmiName})` : ''}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">Keterangan</span>
              <span className="text-slate-700">: {transaction.description || '-'}</span>
            </div>
          </div>

          {/* Jumlah Kotak Besar */}
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 flex justify-between items-center mb-8">
            <span className="font-serif font-bold text-sm uppercase text-slate-700">
              Jumlah Terbilang:
            </span>
            <span className="text-xl font-mono font-bold text-[#1F3A5F]">
              {formatRupiah(transaction.value)}
            </span>
          </div>

          {/* Tanda Tangan */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-300">
            <div>
              <p className="text-slate-500 mb-14">Penerima Dana / Sponsor / CPMI,</p>
              <p className="font-bold text-[#1F3A5F] uppercase underline">
                ( {transaction.pmiName || '........................'} )
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-14">Kasir Pembukuan Cabang,</p>
              <p className="font-bold text-[#1F3A5F] uppercase underline">( KASIR CABANG CIREBON )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
