import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  Database,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { CpmiRecord, KasTransaction } from '../types/cpmi';
import { parseRawCpmis, parseRawTransactions } from '../data/triasDataLoader';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface BatchImportViewProps {
  onImportCpmis: (newCpmis: CpmiRecord[]) => void;
  onImportTransactions: (newTxs: KasTransaction[]) => void;
}

export const BatchImportView: React.FC<BatchImportViewProps> = ({
  onImportCpmis,
  onImportTransactions,
}) => {
  // Raw input texts
  const [rawCpmiText, setRawCpmiText] = useState('');
  const [rawTxText, setRawTxText] = useState('');

  // Parsed previews
  const [previewCpmis, setPreviewCpmis] = useState<CpmiRecord[]>([]);
  const [previewTxs, setPreviewTxs] = useState<KasTransaction[]>([]);

  // Banner status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Parse CPMI text
  const handleParseCpmi = () => {
    if (!rawCpmiText.trim()) {
      alert('Masukkan teks mentah CPMI terlebih dahulu!');
      return;
    }
    try {
      const parsed = parseRawCpmis(rawCpmiText);
      if (parsed.length === 0) {
        alert('Tidak ada baris data CPMI yang berhasil diurai. Periksa format teks Anda.');
        return;
      }
      setPreviewCpmis(parsed);
      setStatusMessage(`Berhasil mengurai ${parsed.length} baris kandidat CPMI.`);
    } catch (err) {
      alert('Gagal mengurai teks CPMI. Periksa format pengetikan.');
    }
  };

  // Parse Transactions text
  const handleParseTransactions = () => {
    if (!rawTxText.trim()) {
      alert('Masukkan teks mentah Transaksi terlebih dahulu!');
      return;
    }
    try {
      const parsed = parseRawTransactions(rawTxText);
      if (parsed.length === 0) {
        alert('Tidak ada baris transaksi yang berhasil diurai. Periksa format teks Anda.');
        return;
      }
      setPreviewTxs(parsed);
      setStatusMessage(`Berhasil mengurai ${parsed.length} baris transaksi kasir.`);
    } catch (err) {
      alert('Gagal mengurai teks transaksi kasir. Periksa format pengetikan.');
    }
  };

  // Commit CPMI to Database
  const handleCommitCpmis = () => {
    if (previewCpmis.length === 0) return;
    onImportCpmis(previewCpmis);
    setStatusMessage(`Sukses menambahkan ${previewCpmis.length} CPMI baru ke database!`);
    alert(`Sukses menambahkan ${previewCpmis.length} CPMI baru ke database.`);
    setPreviewCpmis([]);
    setRawCpmiText('');
  };

  // Commit Transactions to Buku Kas
  const handleCommitTransactions = () => {
    if (previewTxs.length === 0) return;
    onImportTransactions(previewTxs);
    setStatusMessage(`Sukses menambahkan ${previewTxs.length} transaksi kasir baru ke buku kas!`);
    alert(`Sukses menambahkan ${previewTxs.length} transaksi kasir baru ke buku kas.`);
    setPreviewTxs([]);
    setRawTxText('');
  };

  // Fill sample text for CPMI
  const handleLoadSampleCpmi = () => {
    const sample = `1 TS 6950 SITI FATIMAH Taiwan Perempuan TKW (In Formal) PT. TRIAS INSAN MADANI PROCESS Pa Irwan
2 TS 6951 DEWI KARTIKA Taiwan Perempuan TKW (In Formal) PT. TRIAS INSAN MADANI BNSP/BLK Bu Yatni
3 TS 6952 NURJANAH Taiwan Perempuan TKW (In Formal) PT. TRIAS INSAN MADANI FINAL STAGE Bu Maskinah
4 TS 6953 RATNA SARI Taiwan Perempuan TKW (In Formal) PT. TRIAS INSAN MADANI FLIGHT PA Suryanto`;
    setRawCpmiText(sample);
  };

  // Fill sample text for Transactions
  const handleLoadSampleTx = () => {
    const sample = `20/04/2026 Fee Sponsor TS 6950 SITI FATIMAH Rp2.500.000
20/04/2026 ID Paspor TS 6950 SITI FATIMAH Rp1.200.000
21/04/2026 Mcu Pra TS 6951 DEWI KARTIKA Rp275.000
21/04/2026 Living Cost TS 6952 NURJANAH Rp1.000.000
22/04/2026 Keterangan Lain Sarana Prasarana Kantor Cabang Rp1.500.000`;
    setRawTxText(sample);
  };

  return (
    <div className="space-y-6" id="bulk-import-portal-root">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
        <div className="flex items-center space-x-3 text-[#1F3A5F] mb-3">
          <div className="p-2.5 bg-[#1F3A5F]/10 rounded-2xl">
            <UploadCloud className="w-6 h-6 text-[#1F3A5F]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1F3A5F] font-serif">
              Batch Import / Salin Rekaman Log Teks
            </h2>
            <p className="text-xs text-[#8C8479]">
              Impor instan data mentah dari pesan WhatsApp, catatan kasir, atau dokumen teks tanpa input manual satu per satu.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#4B6584] leading-relaxed max-w-4xl">
          Daripada memasukkan satu per satu via form, tempel teks log mentah di bawah ini. Mesin cerdas aplikasi kami akan secara otomatis memecah nomor urut, ID TS, nama kandidat, jenis biaya, tanggal, dan rupiah secara rapi dan instan!
        </p>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: CPMI BATCH PASTE */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-[#1F3A5F] text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-[#1F3A5F]" />
                Batch Tempel Teks CPMI
              </h3>
              <button
                type="button"
                onClick={handleLoadSampleCpmi}
                className="text-[11px] font-bold text-[#1F3A5F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Isi Contoh Teks
              </button>
            </div>

            <p className="text-[11px] text-[#8C8479] mb-2">
              Format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#1F3A5F]">[No] [ID TS] [Nama] [Negara] [Status] [Sponsor]</code>
            </p>

            <textarea
              rows={8}
              value={rawCpmiText}
              onChange={(e) => setRawCpmiText(e.target.value)}
              placeholder={`Contoh tempel teks:\n1 TS 6950 SITI FATIMAH Taiwan Perempuan TKW PROCESS Pa Irwan\n2 TS 6951 DEWI KARTIKA Taiwan Perempuan TKW BNSP/BLK Bu Yatni`}
              className="w-full p-3 bg-[#F7F5F2] border border-[#E2DDD5] rounded-2xl text-xs font-mono focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
            />

            <div className="flex gap-2.5 mt-3">
              <button
                type="button"
                onClick={handleParseCpmi}
                className="flex-1 py-2.5 bg-[#1F3A5F] hover:bg-[#152A4A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Urai Teks CPMI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Preview CPMI Table */}
            {previewCpmis.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-800">
                    ✓ Terurai: {previewCpmis.length} CPMI
                  </span>
                  <button
                    type="button"
                    onClick={handleCommitCpmis}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Impor ke Database Sekarang
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto border border-[#E2DDD5] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F5F2] text-[10px] uppercase font-mono text-[#8C8479]">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Nama</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Sponsor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewCpmis.map((c) => (
                        <tr key={c.id}>
                          <td className="p-2 font-mono font-bold text-[#1F3A5F]">{c.id}</td>
                          <td className="p-2 font-semibold">{c.name}</td>
                          <td className="p-2 text-[10px]">{c.status}</td>
                          <td className="p-2 text-[#4B6584]">{c.recruiter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: TRANSAKSI BATCH PASTE */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-[#1F3A5F] text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#1F3A5F]" />
                Batch Tempel Teks Transaksi Buku Kas
              </h3>
              <button
                type="button"
                onClick={handleLoadSampleTx}
                className="text-[11px] font-bold text-[#1F3A5F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Isi Contoh Teks
              </button>
            </div>

            <p className="text-[11px] text-[#8C8479] mb-2">
              Format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#1F3A5F]">[DD/MM/YYYY] [Kategori] [ID TS] [Nama] Rp[Nominal]</code>
            </p>

            <textarea
              rows={8}
              value={rawTxText}
              onChange={(e) => setRawTxText(e.target.value)}
              placeholder={`Contoh tempel teks:\n20/04/2026 Fee Sponsor TS 6950 SITI FATIMAH Rp2.500.000\n21/04/2026 Mcu Pra TS 6951 DEWI KARTIKA Rp275.000`}
              className="w-full p-3 bg-[#F7F5F2] border border-[#E2DDD5] rounded-2xl text-xs font-mono focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
            />

            <div className="flex gap-2.5 mt-3">
              <button
                type="button"
                onClick={handleParseTransactions}
                className="flex-1 py-2.5 bg-[#1F3A5F] hover:bg-[#152A4A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Urai Transaksi Kasir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Preview Transaction Table */}
            {previewTxs.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-800">
                    ✓ Terurai: {previewTxs.length} Transaksi ({formatRupiah(previewTxs.reduce((sum, tx) => sum + tx.value, 0))})
                  </span>
                  <button
                    type="button"
                    onClick={handleCommitTransactions}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Simpan ke Buku Kas
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto border border-[#E2DDD5] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F5F2] text-[10px] uppercase font-mono text-[#8C8479]">
                      <tr>
                        <th className="p-2">Tanggal</th>
                        <th className="p-2">Kategori</th>
                        <th className="p-2">Ref CPMI</th>
                        <th className="p-2 text-right">Nominal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewTxs.map((tx, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono text-[#8C8479]">{formatDateIndo(tx.date)}</td>
                          <td className="p-2 font-semibold">{tx.category}</td>
                          <td className="p-2 font-mono text-[#1F3A5F]">{tx.pmiRef}</td>
                          <td className="p-2 text-right font-mono font-bold text-[#1F3A5F]">
                            {formatRupiah(tx.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
