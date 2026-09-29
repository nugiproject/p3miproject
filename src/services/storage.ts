import { CpmiRecord, KasTransaction, PortalUser } from '../types/cpmi';
import { INITIAL_TRIAS_CPMIS, INITIAL_TRIAS_TXS } from '../data/triasDataLoader';

const STORAGE_KEY_CPMI = 'CPMI_PORTAL_CPMIS_V1';
const STORAGE_KEY_TX = 'CPMI_PORTAL_TRANSACTIONS_V1';
const STORAGE_KEY_PT_NAME = 'CPMI_PORTAL_PT_NAME';
const STORAGE_KEY_PT_LOGO = 'CPMI_PORTAL_PT_LOGO';
const STORAGE_KEY_USERS = 'CPMI_PORTAL_USERS';
const STORAGE_KEY_AUTH = 'CPMI_PORTAL_LOGGED_IN_USER';

export const DEFAULT_PT_NAME = 'PT. TRIAS INSAN MADANI - CABANG CIREBON';
export const DEFAULT_ADMIN_USER: PortalUser = {
  id: 'ADMIN-DEFAULT',
  name: 'Muhamad Nugi Andri',
  email: 'muhamadnugiandri02@gmail.com',
  passwordHash: '12345',
  role: 'Admin',
  createdAt: '2025-01-01T00:00:00.000Z',
};

// 1. CPMI Data
export function loadCpmiData(): CpmiRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CPMI);
    if (!raw) {
      saveCpmiData(INITIAL_TRIAS_CPMIS);
      return INITIAL_TRIAS_CPMIS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TRIAS_CPMIS;
  } catch (err) {
    console.error('Failed to load CPMI data:', err);
    return INITIAL_TRIAS_CPMIS;
  }
}

export function saveCpmiData(records: CpmiRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CPMI, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save CPMI data:', err);
  }
}

// 2. Transactions Data (Buku Kas)
export function loadTransactions(): KasTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TX);
    if (!raw) {
      saveTransactions(INITIAL_TRIAS_TXS);
      return INITIAL_TRIAS_TXS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TRIAS_TXS;
  } catch (err) {
    console.error('Failed to load transactions:', err);
    return INITIAL_TRIAS_TXS;
  }
}

export function saveTransactions(txs: KasTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(txs));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

// 3. PT Name & Logo Profile
export function loadPtName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_PT_NAME) || DEFAULT_PT_NAME;
  } catch {
    return DEFAULT_PT_NAME;
  }
}

export function savePtName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PT_NAME, name);
  } catch (err) {
    console.error('Failed to save PT name:', err);
  }
}

export function loadPtLogo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_PT_LOGO) || null;
  } catch {
    return null;
  }
}

export function savePtLogo(logoBase64: string | null): void {
  try {
    if (logoBase64) {
      localStorage.setItem(STORAGE_KEY_PT_LOGO, logoBase64);
    } else {
      localStorage.removeItem(STORAGE_KEY_PT_LOGO);
    }
  } catch (err) {
    console.error('Failed to save PT logo:', err);
  }
}

// 4. Portal Users
export function loadPortalUsers(): PortalUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      const defaultList: PortalUser[] = [
        DEFAULT_ADMIN_USER,
        {
          id: 'USER-STAFF-1',
          name: 'Staff Kasir Cirebon',
          email: 'kasir.cirebon@trias.co.id',
          passwordHash: 'kasir123',
          role: 'Staff Portal',
          createdAt: '2025-01-15T00:00:00.000Z',
        },
      ];
      savePortalUsers(defaultList);
      return defaultList;
    }
    const parsed: PortalUser[] = JSON.parse(raw);
    // Ensure DEFAULT_ADMIN_USER is up-to-date with new credentials
    const adminIdx = parsed.findIndex((u) => u.id === 'ADMIN-DEFAULT' || u.email === DEFAULT_ADMIN_USER.email);
    if (adminIdx !== -1) {
      parsed[adminIdx] = DEFAULT_ADMIN_USER;
    } else {
      parsed.unshift(DEFAULT_ADMIN_USER);
    }
    savePortalUsers(parsed);
    return parsed;
  } catch {
    return [DEFAULT_ADMIN_USER];
  }
}

export function savePortalUsers(users: PortalUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save portal users:', err);
  }
}

// 5. Auth / Logged In User
export function loadLoggedInUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLoggedInUser(user: PortalUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  } catch (err) {
    console.error('Failed to save auth user:', err);
  }
}

// 6. Reset to Defaults
export function resetAllToDefaults(): { cpmis: CpmiRecord[]; transactions: KasTransaction[] } {
  saveCpmiData(INITIAL_TRIAS_CPMIS);
  saveTransactions(INITIAL_TRIAS_TXS);
  savePtName(DEFAULT_PT_NAME);
  return {
    cpmis: INITIAL_TRIAS_CPMIS,
    transactions: INITIAL_TRIAS_TXS,
  };
}

// 7. Backup & Restore JSON
export function exportCompleteBackupJson(cpmis: CpmiRecord[], txs: KasTransaction[]): void {
  const backupData = {
    exportedAt: new Date().toISOString(),
    system: 'PT. TRIAS INSAN MADANI - SISTEM INFORMASI P3MI',
    cpmis,
    transactions: txs,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const anchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  anchor.setAttribute('href', dataStr);
  anchor.setAttribute('download', `BACKUP_P3MI_TRIAS_CIREBON_${dateStr}.json`);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

// Auto-generator for next CPMI ID with TS prefix or custom
export function generateNextCpmiId(records: CpmiRecord[], prefix: string = 'TS'): string {
  let maxNum = 6000;
  records.forEach((r) => {
    if (r.id) {
      const match = r.id.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
        }
      }
    }
  });

  return `${prefix.toUpperCase().trim()} ${maxNum + 1}`;
}
