import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, Building2, UserCheck, KeyRound } from 'lucide-react';
import { PortalUser } from '../types/cpmi';
import { loadPortalUsers, DEFAULT_ADMIN_USER } from '../services/storage';

interface AuthScreenProps {
  ptName?: string;
  ptLogo: string | null;
  onLoginSuccess: (user: PortalUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ ptLogo, onLoginSuccess }) => {
  const [email, setEmail] = useState('muhamadnugiandri02@gmail.com');
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Mohon masukkan email dan kata sandi Anda!');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const users = loadPortalUsers();

      // Check default admin
      if (
        email.trim().toLowerCase() === DEFAULT_ADMIN_USER.email.toLowerCase() &&
        password === DEFAULT_ADMIN_USER.passwordHash
      ) {
        onLoginSuccess(DEFAULT_ADMIN_USER);
        setLoading(false);
        return;
      }

      // Check other registered users
      const found = users.find(
        (u) =>
          u.email.toLowerCase() === email.trim().toLowerCase() &&
          u.passwordHash === password
      );

      if (found) {
        onLoginSuccess(found);
      } else {
        setErrorMessage('Email atau Password salah! Periksa kembali kredensial Anda.');
      }
      setLoading(false);
    }, 500);
  };

  const handleQuickDemoLogin = (role: 'Admin' | 'Kasir') => {
    if (role === 'Admin') {
      setEmail(DEFAULT_ADMIN_USER.email);
      setPassword(DEFAULT_ADMIN_USER.passwordHash);
      onLoginSuccess(DEFAULT_ADMIN_USER);
    } else {
      const kasirUser: PortalUser = {
        id: 'USER-STAFF-1',
        name: 'Staff Kasir Cirebon',
        email: 'kasir.cirebon@trias.co.id',
        passwordHash: 'kasir123',
        role: 'Staff Portal',
        createdAt: '2025-01-15T00:00:00.000Z',
      };
      onLoginSuccess(kasirUser);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-4 selection:bg-[#1F3A5F] selection:text-white relative overflow-hidden"
      id="login-container"
    >
      <div className="absolute top-0 inset-x-0 h-56 bg-gradient-to-b from-[#1F3A5F]/15 to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2DDD5] shadow-xl overflow-hidden relative z-10 p-8 sm:p-10">
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-16 h-16 bg-[#1F3A5F] rounded-2xl flex items-center justify-center text-white font-bold tracking-wider relative overflow-hidden shadow-lg border border-amber-400/30">
            {ptLogo ? (
              <img src={ptLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Building2 className="w-8 h-8 text-amber-300" />
                <span className="text-[9px] font-mono font-bold tracking-tighter text-amber-200">PORTAL</span>
              </div>
            )}
          </div>
          <div>
            <span className="inline-block bg-[#1F3A5F]/10 text-[#1F3A5F] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-1.5">
              PORTAL P3MI RESMI
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1F3A5F] tracking-tight">
              Masuk Portal Sistem
            </h1>
            <p className="text-xs text-[#8C8479] font-medium mt-1">
              Sistem Manajemen CPMI & Buku Kas Kasir Operasional
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1F3A5F] uppercase tracking-wider mb-1.5">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="muhamadnugiandri02@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-[#F7F5F2]/50 border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all text-[#212529]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F3A5F] uppercase tracking-wider mb-1.5">
              Kata Sandi / PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="12345"
                className="w-full pl-10 pr-10 py-3 bg-[#F7F5F2]/50 border border-[#E2DDD5] rounded-xl text-xs focus:outline-none focus:border-[#1F3A5F] focus:bg-white transition-all text-[#212529]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8479] hover:text-[#1F3A5F] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[#4B6584] font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Sesi dienkripsi secara lokal di browser Anda</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1F3A5F] hover:bg-[#152A4A] disabled:bg-[#1F3A5F]/50 text-white py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memvalidasi Masuk...</span>
              </>
            ) : (
              <span>Masuk Portal Organisasi</span>
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="mt-6 pt-5 border-t border-[#E2DDD5]/70">
          <p className="text-[11px] font-bold text-[#1F3A5F] text-center mb-2.5 flex items-center justify-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            Akses Cepat Masuk (1-Klik):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('Admin')}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              Masuk sbg Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('Kasir')}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              Masuk sbg Staff
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2.5 font-mono">
            Email: <span className="text-[#1F3A5F] font-bold">muhamadnugiandri02@gmail.com</span> • Kata Sandi:{' '}
            <span className="text-[#1F3A5F] font-bold">12345</span>
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E2DDD5]/40 text-center">
          <p className="text-[10px] text-[#8C8479] font-mono">
            Sistem Informasi Manajemen CPMI • Hak Cipta Dilindungi
          </p>
        </div>
      </div>
    </div>
  );
};
