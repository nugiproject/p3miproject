import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Upload,
  Trash2,
  UserPlus,
  Shield,
  Download,
  UploadCloud,
  RotateCcw,
  CheckCircle2,
  Lock,
  Mail,
  User,
  AlertTriangle,
} from 'lucide-react';
import { PortalUser, CpmiRecord, KasTransaction } from '../types/cpmi';
import { loadPortalUsers, savePortalUsers, exportCompleteBackupJson } from '../services/storage';

interface SettingsPtViewProps {
  ptName: string;
  onUpdatePtName: (name: string) => void;
  ptLogo: string | null;
  onUpdatePtLogo: (logo: string | null) => void;
  currentUser: PortalUser | null;
  cpmis: CpmiRecord[];
  transactions: KasTransaction[];
  onRestoreData: (cpmis: CpmiRecord[], txs: KasTransaction[]) => void;
  onResetDefaults: () => void;
}

export const SettingsPtView: React.FC<SettingsPtViewProps> = ({
  ptName,
  onUpdatePtName,
  ptLogo,
  onUpdatePtLogo,
  currentUser,
  cpmis,
  transactions,
  onRestoreData,
  onResetDefaults,
}) => {
  const [nameInput, setNameInput] = useState(ptName);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  // Users Management State
  const [usersList, setUsersList] = useState<PortalUser[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Staff Portal' | 'Kasir'>('Staff Portal');

  useEffect(() => {
    setUsersList(loadPortalUsers());
  }, []);

  const flashMessage = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Update PT Name
  const handleSavePtName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      alert('Nama PT tidak boleh kosong!');
      return;
    }
    onUpdatePtName(nameInput.trim());
    flashMessage('Nama PT berhasil diperbarui secara real-time!');
  };

  // Upload Logo
  const processLogoFile = (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      alert('Format berkas harus berupa gambar (PNG, JPG, atau WEBP)!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2 MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        onUpdatePtLogo(base64);
        flashMessage('Logo PT berhasil diperbarui!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Add User Staff
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('Semua kolom data staff wajib diisi!');
      return;
    }

    const emailClean = newUserEmail.trim().toLowerCase();
    if (usersList.some((u) => u.email.toLowerCase() === emailClean)) {
      alert(`User dengan email "${emailClean}" sudah terdaftar!`);
      return;
    }

    const newUser: PortalUser = {
      id: `USER-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newUserName.trim(),
      email: emailClean,
      passwordHash: newUserPassword.trim(),
      role: newUserRole,
      createdAt: new Date().toISOString(),
    };

    const updated = [...usersList, newUser];
    savePortalUsers(updated);
    setUsersList(updated);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    flashMessage(`Staff "${newUser.name}" berhasil ditambahkan.`);
  };

  // Delete User Staff
  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === 'ADMIN-DEFAULT') {
      alert('Akun Administrator bawaan tidak dapat dihapus.');
      return;
    }
    if (confirm(`Yakin ingin menghapus akses staff "${userName}"?`)) {
      const updated = usersList.filter((u) => u.id !== userId);
      savePortalUsers(updated);
      setUsersList(updated);
      flashMessage(`Hak akses "${userName}" telah dicabut.`);
    }
  };

  // Handle Restore Backup JSON
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json && Array.isArray(json.cpmis) && Array.isArray(json.transactions)) {
          onRestoreData(json.cpmis, json.transactions);
          alert(`Sukses memulihkan database: ${json.cpmis.length} CPMI dan ${json.transactions.length} transaksi kasir!`);
        } else {
          alert('Format berkas backup JSON tidak sesuai!');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON cadangan.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6" id="pengaturan-pt-root">
      {/* Title Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
        <div className="flex items-center space-x-3 text-[#1F3A5F]">
          <div className="p-2.5 bg-[#1F3A5F]/10 rounded-2xl">
            <Building2 className="w-6 h-6 text-[#1F3A5F]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1F3A5F] font-serif">
              Pengaturan Organisasi & Portal P3MI
            </h2>
            <p className="text-xs text-[#8C8479]">
              Kelola identitas badan usaha cabang, logo resmi, hak akses staf, serta cadangan database lokal.
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Grid: Profil PT & Logo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identitas PT */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
          <h3 className="font-serif font-bold text-[#1F3A5F] text-base mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1F3A5F]" />
            Identitas Perusahaan / Kantor Cabang
          </h3>

          <form onSubmit={handleSavePtName} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1F3A5F] mb-1.5">
                Nama Resmi Badan Usaha P3MI
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="PT. TRIAS INSAN MADANI - CABANG CIREBON"
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#E2DDD5] rounded-xl text-xs font-bold focus:outline-none focus:border-[#1F3A5F] focus:bg-white text-[#1F3A5F]"
              />
            </div>

            <p className="text-[11px] text-[#8C8479]">
              Nama ini akan dicetak pada seluruh kop surat resmi, lembar kontrol berkas monitoring, dan kwitansi pembukuan kasir.
            </p>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1F3A5F] hover:bg-[#152A4A] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Simpan Perubahan Nama PT
            </button>
          </form>
        </div>

        {/* Logo PT */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
          <h3 className="font-serif font-bold text-[#1F3A5F] text-base mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#1F3A5F]" />
            Logo Resmi Perusahaan
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#1F3A5F] border border-amber-400/40 flex items-center justify-center text-white shrink-0 overflow-hidden shadow-md">
              {ptLogo ? (
                <img src={ptLogo} alt="Logo PT" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-amber-300" />
              )}
            </div>

            <div className="flex-1 w-full text-center sm:text-left">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(true);
                }}
                onDragLeave={() => setIsDraggingLogo(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(false);
                  if (e.dataTransfer.files?.[0]) processLogoFile(e.dataTransfer.files[0]);
                }}
                onClick={() => logoInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  isDraggingLogo
                    ? 'border-[#1F3A5F] bg-[#1F3A5F]/10'
                    : 'border-[#E2DDD5] hover:border-[#1F3A5F] bg-[#F7F5F2]'
                }`}
              >
                <p className="text-xs font-bold text-[#1F3A5F]">Klik atau tarik logo baru ke sini</p>
                <p className="text-[10px] text-[#8C8479]">Maks. 2 MB (PNG, JPG, WEBP)</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processLogoFile(e.target.files[0])}
                />
              </div>

              {ptLogo && (
                <button
                  type="button"
                  onClick={() => onUpdatePtLogo(null)}
                  className="text-[11px] text-rose-600 hover:underline mt-2 font-bold cursor-pointer"
                >
                  Kembalikan ke Logo Default
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Staff User Management */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
        <h3 className="font-serif font-bold text-[#1F3A5F] text-base mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#1F3A5F]" />
          Manajemen Hak Akses Staf / Kasir
        </h3>
        <p className="text-xs text-[#8C8479] mb-4">
          Kelola kredensial akun staf cabang yang berwenang mengakses portal pembukuan
        </p>

        {/* Add User Form */}
        <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-[#F7F5F2] border border-[#E2DDD5]">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#1F3A5F] mb-1">
              Nama Staf
            </label>
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Contoh: Staff Cirebon"
              className="w-full px-3 py-2 bg-white border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#1F3A5F] mb-1">
              Email Staf
            </label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="staf@trias.co.id"
              className="w-full px-3 py-2 bg-white border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#1F3A5F] mb-1">
              Password / PIN
            </label>
            <input
              type="text"
              required
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="PIN rahasia"
              className="w-full px-3 py-2 bg-white border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-[#1F3A5F] hover:bg-[#152A4A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Staf</span>
            </button>
          </div>
        </form>

        {/* Users List */}
        <div className="divide-y divide-[#E2DDD5] border border-[#E2DDD5] rounded-2xl overflow-hidden">
          {usersList.map((user) => (
            <div key={user.id} className="p-3.5 flex justify-between items-center hover:bg-[#F7F5F2]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#1F3A5F]">{user.name}</span>
                  <span className="text-[9px] bg-[#1F3A5F] text-white px-2 py-0.5 rounded font-mono font-bold">
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#8C8479] font-mono mt-0.5">
                  <span>{user.email}</span>
                  <span>PW: ••••••</span>
                </div>
              </div>

              {user.id !== 'ADMIN-DEFAULT' && (
                <button
                  type="button"
                  onClick={() => handleDeleteUser(user.id, user.name)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Cabut Akses Staf"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Database Backup & Reset */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DDD5] shadow-xs">
        <h3 className="font-serif font-bold text-[#1F3A5F] text-base mb-1 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-600" />
          Pencadangan & Pemulihan Database Lokal
        </h3>
        <p className="text-xs text-[#8C8479] mb-4">
          Seluruh data CPMI dan transaksi tersimpan aman di browser lokal Anda. Buat salinan cadangan berkala agar data dapat dipindahkan ke komputer lain atau disimpan sebagai arsip kantor.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Download Backup */}
          <button
            onClick={() => exportCompleteBackupJson(cpmis, transactions)}
            className="p-4 rounded-2xl border border-[#E2DDD5] hover:border-[#1F3A5F] bg-[#F7F5F2] hover:bg-white text-left transition-all cursor-pointer shadow-xs group"
          >
            <Download className="w-5 h-5 text-[#1F3A5F] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-[#1F3A5F]">Unduh Cadangan (.json)</h4>
            <p className="text-[10px] text-[#8C8479] mt-0.5">
              Simpan seluruh rekaman CPMI & Buku Kas ke file JSON
            </p>
          </button>

          {/* Restore Backup */}
          <div
            onClick={() => restoreInputRef.current?.click()}
            className="p-4 rounded-2xl border border-[#E2DDD5] hover:border-emerald-600 bg-[#F7F5F2] hover:bg-white text-left transition-all cursor-pointer shadow-xs group"
          >
            <UploadCloud className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-emerald-900">Pulihkan dari JSON</h4>
            <p className="text-[10px] text-[#8C8479] mt-0.5">
              Unggah file cadangan untuk memulihkan seluruh data
            </p>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileRestore}
            />
          </div>

          {/* Reset to Trias Defaults */}
          <button
            onClick={onResetDefaults}
            className="p-4 rounded-2xl border border-rose-200 hover:border-rose-400 bg-rose-50/50 hover:bg-rose-50 text-left transition-all cursor-pointer shadow-xs group"
          >
            <RotateCcw className="w-5 h-5 text-rose-600 mb-2 group-hover:rotate-180 transition-transform" />
            <h4 className="text-xs font-bold text-rose-900">Reset ke Data Bawaan PT</h4>
            <p className="text-[10px] text-rose-700 mt-0.5">
              Muat ulang 52 data CPMI & 250 transaksi awal bawaan Trias Cirebon
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
