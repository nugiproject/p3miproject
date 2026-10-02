import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Filter,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UploadCloud,
  Download,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  CpmiRecord,
  KasTransaction,
  StageKey,
  StageStatus,
  DocumentKey,
  CpmiAttachment,
} from '../types/cpmi';
import { formatRupiah, formatDateIndo, getCpmiStatusMeta, getStageStatusMeta } from '../utils/formatters';
import { exportCustomFilteredExcel } from '../services/excelExport';
import { generateNextCpmiId } from '../services/storage';
import { DEFAULT_STAGE_LABELS, DEFAULT_DOCUMENT_KEYS } from '../data/triasDataLoader';

interface CpmiDatabaseViewProps {
  cpmis: CpmiRecord[];
  transactions: KasTransaction[];
  onAddCpmi: (cpmi: CpmiRecord) => void;
  onUpdateCpmi: (cpmi: CpmiRecord) => void;
  onDeleteCpmi: (id: string) => void;
  onPrintCpmi: (cpmi: CpmiRecord) => void;
  ptName: string;
}

export const CpmiDatabaseView: React.FC<CpmiDatabaseViewProps> = ({
  cpmis,
  transactions,
  onAddCpmi,
  onUpdateCpmi,
  onDeleteCpmi,
  onPrintCpmi,
  ptName,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecruiter, setFilterRecruiter] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterPt, setFilterPt] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Selected CPMI for Detail Drawer
  const [selectedCpmiId, setSelectedCpmiId] = useState<string | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'alur' | 'berkas' | 'lampiran' | 'keuangan'>('alur');

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCpmi, setEditingCpmi] = useState<CpmiRecord | null>(null);

  // File upload ref & state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic PT / Perusahaan list (derived from data + defaults)
  const availablePtList = useMemo(() => {
    const defaultList = [
      ptName,
      'PT. TRIAS INSAN MADANI',
      'PT. GRAHA AYUKARSA',
      'PT. CITRA PUTRA INDARAB',
      'PT. MILLENIUM MANDIRI',
      'PT. AL ZUBARA MANPOWER',
      'PT. BIJAK INDONESIA',
      'PT. TENRIBAWANG',
      'PT. BALANTA BUDI PRIMA',
    ];
    const set = new Set<string>();
    defaultList.forEach((p) => {
      if (p && p.trim()) set.add(p.trim());
    });
    cpmis.forEach((c) => {
      if (c.agency && c.agency.trim()) set.add(c.agency.trim());
    });
    return Array.from(set).sort();
  }, [cpmis, ptName]);

  // Dynamic recruiters list
  const recruiters = useMemo(() => {
    const set = new Set<string>();
    cpmis.forEach((c) => {
      if (c.recruiter) set.add(c.recruiter);
    });
    return Array.from(set).sort();
  }, [cpmis]);

  // Dynamic status list
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    cpmis.forEach((c) => {
      if (c.status) set.add(c.status);
    });
    return Array.from(set).sort();
  }, [cpmis]);

  // Countries list
  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    cpmis.forEach((c) => {
      if (c.destination) set.add(c.destination);
    });
    return Array.from(set).sort();
  }, [cpmis]);

  // Filtered dataset
  const filteredCpmis = useMemo(() => {
    return cpmis.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.agency && c.agency.toLowerCase().includes(q)) ||
        (c.recruiter && c.recruiter.toLowerCase().includes(q)) ||
        (c.destination && c.destination.toLowerCase().includes(q));

      const matchRecruiter = !filterRecruiter || c.recruiter === filterRecruiter;
      const matchStatus = !filterStatus || c.status.toLowerCase().includes(filterStatus.toLowerCase());
      const matchCountry = !filterCountry || c.destination === filterCountry;
      const matchGender = !filterGender || c.gender === filterGender;
      const matchPt = !filterPt || (c.agency && c.agency.toLowerCase() === filterPt.toLowerCase());

      return matchSearch && matchRecruiter && matchStatus && matchCountry && matchGender && matchPt;
    });
  }, [cpmis, searchQuery, filterRecruiter, filterStatus, filterCountry, filterGender, filterPt]);

  // Pagination
  const totalPages = Math.ceil(filteredCpmis.length / itemsPerPage) || 1;
  const paginatedCpmis = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCpmis.slice(start, start + itemsPerPage);
  }, [filteredCpmis, currentPage, itemsPerPage]);

  // Currently selected CPMI object
  const currentDetailCpmi = useMemo(() => {
    if (!selectedCpmiId) return null;
    return cpmis.find((c) => c.id === selectedCpmiId) || null;
  }, [cpmis, selectedCpmiId]);

  // Transactions linked to selected CPMI
  const currentCpmiTransactions = useMemo(() => {
    if (!currentDetailCpmi) return [];
    const cleanId = currentDetailCpmi.id.replace(/\s+/g, '').toUpperCase();
    return transactions.filter((tx) => {
      const txRef = (tx.pmiRef || '').replace(/\s+/g, '').toUpperCase();
      return txRef === cleanId;
    });
  }, [currentDetailCpmi, transactions]);

  const currentCpmiTotalSpent = useMemo(() => {
    return currentCpmiTransactions.reduce((acc, tx) => acc + tx.value, 0);
  }, [currentCpmiTransactions]);

  // Helper to get total spend for any CPMI row
  const getCpmiTotalSpent = (cpmiId: string) => {
    const clean = cpmiId.replace(/\s+/g, '').toUpperCase();
    return transactions
      .filter((tx) => (tx.pmiRef || '').replace(/\s+/g, '').toUpperCase() === clean)
      .reduce((acc, tx) => acc + tx.value, 0);
  };

  // Stage update handler
  const handleUpdateStageStatus = (stageKey: StageKey, newStatus: StageStatus) => {
    if (!currentDetailCpmi) return;
    const stages = { ...currentDetailCpmi.stages };
    if (stages[stageKey]) {
      stages[stageKey] = {
        ...stages[stageKey],
        status: newStatus,
        updatedAt: new Date().toISOString().substring(0, 10),
      };
    }
    const updated = { ...currentDetailCpmi, stages, updatedAt: new Date().toISOString() };
    onUpdateCpmi(updated);
  };

  // Document checkbox toggle handler
  const handleToggleDocument = (docKey: DocumentKey) => {
    if (!currentDetailCpmi) return;
    const currentDocs = { ...(currentDetailCpmi.documents || {}) };
    const currentVal = currentDocs[docKey];
    currentDocs[docKey] = !currentVal;
    const updated = { ...currentDetailCpmi, documents: currentDocs, updatedAt: new Date().toISOString() };
    onUpdateCpmi(updated);
  };

  // File upload handler
  const handleUploadFiles = (files: FileList | null) => {
    if (!files || !currentDetailCpmi) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Berkas "${file.name}" melebihi batas 5 MB!`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          const newAttachment: CpmiAttachment = {
            id: `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            uploadedAt: new Date().toISOString(),
            base64Data: base64,
          };
          const currentList = currentDetailCpmi.attachments || [];
          const updated = {
            ...currentDetailCpmi,
            attachments: [...currentList, newAttachment],
            updatedAt: new Date().toISOString(),
          };
          onUpdateCpmi(updated);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (!currentDetailCpmi) return;
    const filtered = (currentDetailCpmi.attachments || []).filter((a) => a.id !== attachmentId);
    onUpdateCpmi({
      ...currentDetailCpmi,
      attachments: filtered,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDownloadAttachment = (attachment: CpmiAttachment) => {
    const a = document.createElement('a');
    a.href = attachment.base64Data;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Open Add modal
  const handleOpenAdd = () => {
    const nextId = generateNextCpmiId(cpmis, 'TS');
    setEditingCpmi({
      id: nextId,
      name: '',
      gender: 'Perempuan',
      destination: 'Taiwan',
      category: 'TKW (In Formal)',
      agency: ptName || 'PT. TRIAS INSAN MADANI',
      recruiter: '',
      status: 'PROCESS',
      dateInput: new Date().toISOString().substring(0, 10),
      phone: '',
      address: '',
      stages: {} as any,
      documents: {} as any,
      attachments: [],
      finance: {
        feeSponsor: 0,
        feeCpmi: 0,
        feeAgency: 0,
        feeLainnya: 0,
        biayaTransport: 0,
        biayaMcuPra: 0,
        biayaPaspor: 0,
        biayaAdministrasi: 0,
        biayaVisa: 0,
        biayaTiket: 0,
        biayaPenginapan: 0,
        biayaMakan: 0,
        biayaDokumen: 0,
        biayaLainnya: 0,
        totalTagihan: 0,
        sudahDibayar: 0,
        statusPembayaran: 'Lunas',
        paymentLogs: [],
      },
    });
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (cpmi: CpmiRecord) => {
    setEditingCpmi({ ...cpmi });
    setIsModalOpen(true);
  };

  // Save form handler
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCpmi || !editingCpmi.name.trim()) {
      showToast('Nama lengkap CPMI wajib diisi!');
      return;
    }

    const isNew = !cpmis.some((c) => c.id === editingCpmi.id);
    if (isNew) {
      onAddCpmi(editingCpmi);
      showToast(`CPMI ${editingCpmi.id} (${editingCpmi.name}) berhasil didaftarkan untuk ${editingCpmi.agency || ptName}!`);
    } else {
      onUpdateCpmi(editingCpmi);
      showToast(`Data CPMI ${editingCpmi.id} (${editingCpmi.agency || ptName}) berhasil diperbarui!`);
    }
    setIsModalOpen(false);
    setEditingCpmi(null);
  };

  const handleExportFiltered = () => {
    exportCustomFilteredExcel(filteredCpmis, transactions, 'Database_Terfilter');
  };

  return (
    <div className="space-y-6" id="cpmi-database-root">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#1F3A5F]">
              Database Terpadu Calon Pekerja Migran Indonesia (CPMI)
            </h2>
            <p className="text-xs text-[#8C8479] mt-0.5">
              Kelola profil, pembagian PT penempatan, riwayat alur 10 tahapan, kelengkapan 13 berkas, dan akumulasi biaya kasir operasional.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={handleExportFiltered}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Ekspor data hasil filter ke file Microsoft Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel ({filteredCpmis.length})</span>
            </button>
            <button
              onClick={handleOpenAdd}
              id="btn-tambah-cpmi"
              className="px-4 py-2.5 bg-[#1F3A5F] hover:bg-[#152A4A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah CPMI Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Bar (Now includes PT Penempatan filter!) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-[#E2DDD5]">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C8479] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari ID, Nama, PT, Sponsor..."
              className="w-full pl-9 pr-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all text-[#212529]"
            />
          </div>

          {/* Filter PT / Perusahaan */}
          <div>
            <select
              value={filterPt}
              onChange={(e) => {
                setFilterPt(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all text-blue-900"
            >
              <option value="">Semua PT ({cpmis.length})</option>
              {availablePtList.map((pt) => {
                const count = cpmis.filter((c) => (c.agency || '').toLowerCase() === pt.toLowerCase()).length;
                return (
                  <option key={pt} value={pt}>
                    {pt} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filter Recruiter / Sponsor */}
          <div>
            <select
              value={filterRecruiter}
              onChange={(e) => {
                setFilterRecruiter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all text-[#212529]"
            >
              <option value="">Semua Sponsor / PL</option>
              {recruiters.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all text-[#212529]"
            >
              <option value="">Semua Status Proses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Destination Country */}
          <div>
            <select
              value={filterCountry}
              onChange={(e) => {
                setFilterCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all text-[#212529]"
            >
              <option value="">Semua Negara Tujuan</option>
              {countryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Gender */}
          <div>
            <select
              value={filterGender}
              onChange={(e) => {
                setFilterGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all text-[#212529]"
            >
              <option value="">Semua Gender</option>
              <option value="Perempuan">Perempuan</option>
              <option value="Laki-laki">Laki-laki</option>
            </select>
          </div>
        </div>

        {/* Active filter counter */}
        <div className="mt-3 flex items-center justify-between text-xs text-[#8C8479]">
          <span>
            Menampilkan <b>{paginatedCpmis.length}</b> dari total <b>{filteredCpmis.length}</b> kandidat CPMI
            {(searchQuery || filterPt || filterRecruiter || filterStatus || filterCountry || filterGender) && ' (Terfilter)'}
          </span>
          {(searchQuery || filterPt || filterRecruiter || filterStatus || filterCountry || filterGender) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterPt('');
                setFilterRecruiter('');
                setFilterStatus('');
                setFilterCountry('');
                setFilterGender('');
                setCurrentPage(1);
              }}
              className="text-[#1F3A5F] font-bold hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-[#E2DDD5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="table-cpmi-database">
            <thead>
              <tr className="bg-[#F7F5F2] border-b border-[#E2DDD5] text-[#8C8479] font-mono uppercase text-[10px]">
                <th className="py-3 px-4">ID CPMI</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">PT Penempatan</th>
                <th className="py-3 px-4">Negara & Posisi</th>
                <th className="py-3 px-4">Status Alur</th>
                <th className="py-3 px-4">Sponsor / PL</th>
                <th className="py-3 px-4 text-right">Biaya Kasir</th>
                <th className="py-3 px-4 text-center">Kelengkapan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD5]/60">
              {paginatedCpmis.map((c) => {
                const statusMeta = getCpmiStatusMeta(c.status);
                const totalSpent = getCpmiTotalSpent(c.id);

                // Count completed stages & docs
                const stagesObj = c.stages || {};
                const completedStagesCount = Object.values(stagesObj).filter((s) => s.status === 'selesai').length;
                const docsObj = c.documents || {};
                const completedDocsCount = Object.values(docsObj).filter((v) => v === true || v === 'ada').length;

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-[#F7F5F2]/60 transition-colors ${
                      selectedCpmiId === c.id ? 'bg-[#1F3A5F]/5' : ''
                    }`}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#1F3A5F] text-white font-bold text-[11px] shadow-xs">
                        {c.id}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1F3A5F] text-sm">{c.name}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8C8479] mt-0.5">
                        <span>{c.gender}</span>
                        {c.phone && <span>• {c.phone}</span>}
                      </div>
                    </td>

                    {/* PT Penempatan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-900 text-xs font-semibold" title={c.agency || ptName}>
                        <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span className="truncate max-w-[140px]">{c.agency || ptName}</span>
                      </div>
                    </td>

                    {/* Destination & Category */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#212529] flex items-center gap-1">
                        <span>{c.destination || 'Taiwan'}</span>
                      </div>
                      <span className="text-[10px] text-[#8C8479] block">
                        {c.category || 'TKW (In Formal)'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusMeta.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                        <span>{c.status}</span>
                      </span>
                    </td>

                    {/* Recruiter */}
                    <td className="py-3.5 px-4 text-[#4B6584] whitespace-nowrap">
                      <span className="font-medium">{c.recruiter || 'Kantor Pusat'}</span>
                    </td>

                    {/* Biaya Kasir */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-xs text-[#1F3A5F]">
                        {formatRupiah(totalSpent)}
                      </span>
                    </td>

                    {/* Kelengkapan */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-[10px] font-mono text-[#4B6584]">
                          Tahap {completedStagesCount}/10 • Berkas {completedDocsCount}/13
                        </span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{
                              width: `${Math.round(((completedStagesCount + completedDocsCount) / 23) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCpmiId(c.id)}
                          className="p-1.5 text-[#1F3A5F] hover:bg-[#1F3A5F]/10 rounded-lg transition-colors cursor-pointer"
                          title="Buka Lembar Monitoring & Berkas CPMI"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPrintCpmi(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Lembar Monitoring & Kontrol CPMI"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Biodata CPMI"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus data CPMI ${c.id} (${c.name})?`)) {
                              onDeleteCpmi(c.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus CPMI"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#E2DDD5] bg-[#F7F5F2]/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <span className="text-[#8C8479]">
            Halaman <b>{currentPage}</b> dari <b>{totalPages}</b>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#E2DDD5] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 3 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#1F3A5F] text-white'
                      : 'bg-white border border-[#E2DDD5] text-[#212529] hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
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

      {/* DETAIL DRAWER / MODAL */}
      {currentDetailCpmi && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left">
            {/* Drawer Header */}
            <div className="bg-[#1F3A5F] text-white p-6 shrink-0 relative">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPrintCpmi(currentDetailCpmi)}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                  title="Cetak Dokumen & Lembar Monitoring CPMI"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCpmiId(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-serif text-2xl font-bold text-amber-300 shrink-0">
                  {currentDetailCpmi.name.charAt(0)}
                </div>
                <div className="min-w-0 pr-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-400 text-slate-900 font-mono text-xs font-bold px-2.5 py-0.5 rounded-md">
                      {currentDetailCpmi.id}
                    </span>
                    <span className="bg-white/20 text-white font-mono text-[10px] px-2 py-0.5 rounded-full">
                      {currentDetailCpmi.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-serif mt-1 text-white truncate">
                    {currentDetailCpmi.name}
                  </h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    {currentDetailCpmi.gender} • {currentDetailCpmi.destination} ({currentDetailCpmi.category}) • Sponsor: {currentDetailCpmi.recruiter || 'Kantor Pusat'}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-amber-200 text-xs font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>PT: {currentDetailCpmi.agency || ptName}</span>
                  </div>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="flex space-x-2 mt-6 border-t border-white/20 pt-4 overflow-x-auto no-scrollbar">
                {[
                  { id: 'alur' as const, label: 'Alur 10 Tahapan', icon: Clock },
                  { id: 'berkas' as const, label: 'Checklist Berkas', icon: CheckCircle2 },
                  { id: 'lampiran' as const, label: 'Lampiran / Foto', icon: UploadCloud },
                  { id: 'keuangan' as const, label: 'Biaya Kasir', icon: CreditCard },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeDrawerTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveDrawerTab(t.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-[#1F3A5F] shadow-sm'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick PT Overview Banner */}
              <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                      Perusahaan / PT Penempatan CPMI:
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-blue-950 font-serif">
                      {currentDetailCpmi.agency || ptName}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(currentDetailCpmi)}
                  className="px-3 py-1.5 bg-white hover:bg-blue-100 border border-blue-300 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer self-start sm:self-center"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Ganti PT / Edit Data</span>
                </button>
              </div>
              {/* TAB 1: ALUR 10 TAHAPAN */}
              {activeDrawerTab === 'alur' && (
                <div className="space-y-4">
                  <div className="bg-[#F7F5F2] p-4 rounded-2xl border border-[#E2DDD5] text-xs text-[#8C8479]">
                    Klik pada status tahapan untuk mengubah perkembangan alur proses kandidat secara real-time.
                  </div>

                  <div className="space-y-3">
                    {Object.entries(DEFAULT_STAGE_LABELS).map(([key, label], idx) => {
                      const stageKey = key as StageKey;
                      const stageObj = currentDetailCpmi.stages?.[stageKey] || {
                        id: stageKey,
                        label,
                        order: idx + 1,
                        status: 'belum',
                      };
                      const meta = getStageStatusMeta(stageObj.status);

                      return (
                        <div
                          key={key}
                          className="p-3.5 bg-white rounded-2xl border border-[#E2DDD5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-[#1F3A5F]/40 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-slate-100 text-[#1F3A5F] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-[#1F3A5F]">{label}</p>
                              <span className="text-[10px] text-[#8C8479]">
                                Update: {formatDateIndo(stageObj.updatedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            {(['belum', 'proses', 'selesai', 'masalah'] as StageStatus[]).map((st) => {
                              const isSelected = stageObj.status === st;
                              const stMeta = getStageStatusMeta(st);
                              return (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateStageStatus(stageKey, st)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                                    isSelected
                                      ? stMeta.bgClass + ' shadow-xs scale-105'
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {stMeta.icon} {stMeta.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: CHECKLIST BERKAS */}
              {activeDrawerTab === 'berkas' && (
                <div className="space-y-4">
                  <div className="bg-[#F7F5F2] p-4 rounded-2xl border border-[#E2DDD5] text-xs text-[#8C8479]">
                    Centang berkas yang telah diterima dan diverifikasi oleh pihak kantor cabang.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEFAULT_DOCUMENT_KEYS.map((docKey) => {
                      const isChecked = Boolean(currentDetailCpmi.documents?.[docKey]);
                      const docLabels: Record<DocumentKey, string> = {
                        ktp: 'KTP Asli / e-KTP',
                        kk: 'Kartu Keluarga (KK)',
                        aktaLahir: 'Akta Kelahiran',
                        ijazah: 'Ijazah Terakhir',
                        suratIzinKeluarga: 'Surat Izin Keluarga / Suami',
                        paspor: 'Buku Paspor Asli',
                        medicalCheck: 'Medical Check Up (MCU Pra/Fit)',
                        dokumenSponsor: 'Dokumen Sponsor / PL',
                        jobOrder: 'Job Order / Kontrak Kerja',
                        visa: 'Visa Kerja Resmi',
                        pap: 'Sertifikat PAP BP3MI',
                        bp3mi: 'Verifikasi E-PMI / BP3MI',
                        tiket: 'Tiket Pesawat Terbang',
                      };

                      return (
                        <div
                          key={docKey}
                          onClick={() => handleToggleDocument(docKey)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                              : 'bg-white border-[#E2DDD5] text-[#212529] hover:bg-[#F7F5F2]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                            />
                            <span className="text-xs font-semibold">{docLabels[docKey] || docKey}</span>
                          </div>
                          <span className="text-xs">{isChecked ? '✅' : '⬜'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: LAMPIRAN FILE / FOTO */}
              {activeDrawerTab === 'lampiran' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleUploadFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#1F3A5F] bg-[#1F3A5F]/10'
                        : 'border-[#E2DDD5] hover:border-[#1F3A5F] bg-[#F7F5F2]/50 hover:bg-[#F7F5F2]'
                    }`}
                  >
                    <UploadCloud className="w-10 h-10 text-[#1F3A5F] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1F3A5F]">
                      Tarik & lepas berkas ke sini, atau klik untuk memilih
                    </p>
                    <p className="text-[10px] text-[#8C8479] mt-1">
                      Mendukung format gambar (JPG, PNG, WEBP) atau PDF hingga 5 MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUploadFiles(e.target.files)}
                    />
                  </div>

                  {/* List of Attachments */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider">
                      Berkas Tersimpan ({currentDetailCpmi.attachments?.length || 0})
                    </h4>

                    {(!currentDetailCpmi.attachments || currentDetailCpmi.attachments.length === 0) && (
                      <p className="text-xs text-[#8C8479] italic py-4 text-center">
                        Belum ada berkas lampiran yang diunggah untuk CPMI ini.
                      </p>
                    )}

                    {currentDetailCpmi.attachments?.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-white rounded-2xl border border-[#E2DDD5] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {att.type.startsWith('image/') ? (
                            <img
                              src={att.base64Data}
                              alt={att.name}
                              className="w-10 h-10 object-cover rounded-lg border border-[#E2DDD5]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1F3A5F] truncate">{att.name}</p>
                            <span className="text-[10px] text-[#8C8479]">
                              {(att.size / 1024).toFixed(1)} KB • {formatDateIndo(att.uploadedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDownloadAttachment(att)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Unduh Berkas"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: BIAYA KASIR & KEUANGAN */}
              {activeDrawerTab === 'keuangan' && (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="p-4 rounded-2xl bg-[#1F3A5F] text-white flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-white/70">
                        Total Kasir Terkait CPMI Ini
                      </span>
                      <p className="text-xl font-bold font-serif mt-0.5 text-amber-300">
                        {formatRupiah(currentCpmiTotalSpent)}
                      </p>
                    </div>
                    <span className="text-xs font-bold font-mono bg-white/20 px-3 py-1 rounded-full">
                      {currentCpmiTransactions.length} Transaksi
                    </span>
                  </div>

                  {/* List of related transactions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider">
                      Riwayat Buku Kasir Kandidat
                    </h4>

                    {currentCpmiTransactions.length === 0 ? (
                      <p className="text-xs text-[#8C8479] italic py-4 text-center">
                        Belum ada catatan pengeluaran kasir untuk nomor referensi ini.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#E2DDD5] border border-[#E2DDD5] rounded-2xl overflow-hidden bg-white">
                        {currentCpmiTransactions.map((tx) => (
                          <div key={tx.id} className="p-3 flex justify-between items-center hover:bg-[#F7F5F2]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#1F3A5F]">{tx.category}</span>
                                <span className="text-[10px] text-[#8C8479] font-mono">
                                  {formatDateIndo(tx.date)}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4B6584] mt-0.5">{tx.description}</p>
                            </div>
                            <span className="font-mono font-bold text-xs text-[#1F3A5F]">
                              {formatRupiah(tx.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E2DDD5] bg-[#F7F5F2] flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (currentDetailCpmi) {
                    onPrintCpmi(currentDetailCpmi);
                  }
                }}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Monitoring & Kontrol CPMI</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCpmiId(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#212529] border border-[#E2DDD5] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CPMI MODAL */}
      {isModalOpen && editingCpmi && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E2DDD5] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-[#E2DDD5] mb-5">
              <h3 className="text-lg font-bold font-serif text-[#1F3A5F]">
                {cpmis.some((c) => c.id === editingCpmi.id) ? 'Edit Profil CPMI' : 'Pendaftaran CPMI Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    ID / No. CPMI <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCpmi.id}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, id: e.target.value.toUpperCase() })}
                    placeholder="TS 6850"
                    className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#1F3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    Status Proses <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingCpmi.status}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  >
                    <option value="PROCESS">PROCESS</option>
                    <option value="BNSP/BLK">BNSP/BLK</option>
                    <option value="FINAL STAGE">FINAL STAGE</option>
                    <option value="TERBANG (FLIGHT)">TERBANG (FLIGHT)</option>
                    <option value="VERIF ID">VERIF ID</option>
                    <option value="CANCEL">CANCEL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                  Nama Lengkap CPMI <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCpmi.name}
                  onChange={(e) => setEditingCpmi({ ...editingCpmi, name: e.target.value })}
                  placeholder="Contoh: SITI NURHALIZAH"
                  className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                />
              </div>

              {/* PT / Perusahaan Penempatan (Manual Input or Suggestions) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#1F3A5F]">
                    Nama PT / Perusahaan Penempatan <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-semibold">
                    Bisa ketik manual atau pilih dari daftar
                  </span>
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    list="pt-database-suggestions"
                    value={editingCpmi.agency || ''}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, agency: e.target.value })}
                    placeholder="Ketik atau pilih PT (Contoh: PT. TRIAS INSAN MADANI / PT. LAINNYA)"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs font-bold text-[#1F3A5F] focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all"
                  />
                  <datalist id="pt-database-suggestions">
                    {availablePtList.map((pt) => (
                      <option key={pt} value={pt} />
                    ))}
                  </datalist>
                </div>
                {/* Pilihan Cepat PT */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-medium mr-1">Pilihan Cepat:</span>
                  {availablePtList.slice(0, 5).map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setEditingCpmi({ ...editingCpmi, agency: pt })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                        editingCpmi.agency === pt
                          ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingCpmi.gender}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  >
                    <option value="Perempuan">Perempuan</option>
                    <option value="Laki-laki">Laki-laki</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    Negara Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingCpmi.destination}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, destination: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  >
                    <option value="Taiwan">Taiwan</option>
                    <option value="Hong Kong">Hong Kong</option>
                    <option value="Singapura">Singapura</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Polandia">Polandia</option>
                    <option value="Jepang">Jepang</option>
                    <option value="Korea Selatan">Korea Selatan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    Posisi / Sektor Pekerjaan
                  </label>
                  <input
                    type="text"
                    value={editingCpmi.category}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, category: e.target.value })}
                    placeholder="TKW (In Formal) / Caregiver"
                    className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    Sponsor / Agen Penyalur (PL)
                  </label>
                  <input
                    type="text"
                    value={editingCpmi.recruiter}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, recruiter: e.target.value })}
                    placeholder="PA Irwan / Bu Yatni"
                    className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={editingCpmi.phone || ''}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, phone: e.target.value })}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                    Tanggal Masuk Proses
                  </label>
                  <input
                    type="date"
                    value={editingCpmi.dateInput || ''}
                    onChange={(e) => setEditingCpmi({ ...editingCpmi, dateInput: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                  Alamat Domisili Asal
                </label>
                <textarea
                  rows={2}
                  value={editingCpmi.address || ''}
                  onChange={(e) => setEditingCpmi({ ...editingCpmi, address: e.target.value })}
                  placeholder="Kecamatan, Kabupaten Cirebon / Indramayu / Majalengka"
                  className="w-full px-3 py-2 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#212529]"
                />
              </div>

              <div className="pt-4 border-t border-[#E2DDD5] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E2DDD5] text-xs font-semibold text-[#8C8479] hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#152A4A] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  Simpan CPMI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
