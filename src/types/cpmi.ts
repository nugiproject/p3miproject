export type Gender = 'Perempuan' | 'Laki-laki';

export type DestinationCountry =
  | 'Taiwan'
  | 'Singapura'
  | 'Malaysia'
  | 'Hong Kong'
  | 'Polandia'
  | 'Jepang'
  | 'Korea Selatan'
  | 'Lainnya';

export type CpmiWorkflowStatus =
  | 'PROCESS'
  | 'BNSP/BLK'
  | 'ID PASPOR'
  | 'FINAL STAGE'
  | 'TERBANG (FLIGHT)'
  | 'CANCEL'
  | 'TOLAK'
  | 'SPONSOR'
  | 'UPDATE DOKUMEN KELENGKAPAN'
  | 'VERIF ID'
  | 'Siap Terbang'
  | 'Baru';

export type StageStatus = 'belum' | 'proses' | 'selesai' | 'masalah';

export type StageKey =
  | 'dataMasuk'
  | 'paspor'
  | 'mcuPra'
  | 'jobOrder'
  | 'interview'
  | 'visa'
  | 'pap'
  | 'bp3mi'
  | 'tiket'
  | 'terbang';

export interface ProcessStage {
  id: StageKey;
  label: string;
  order: number;
  status: StageStatus;
  updatedAt?: string;
  notes?: string;
}

export type DocumentKey =
  | 'ktp'
  | 'kk'
  | 'aktaLahir'
  | 'ijazah'
  | 'suratIzinKeluarga'
  | 'paspor'
  | 'medicalCheck'
  | 'dokumenSponsor'
  | 'jobOrder'
  | 'visa'
  | 'pap'
  | 'bp3mi'
  | 'tiket';

export type DocCheckStatus = 'ada' | 'belum' | 'kurang';

export interface CpmiAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  base64Data: string;
}

export type PaymentStatus = 'Belum Bayar' | 'DP' | 'Sebagian' | 'Lunas';

export interface PaymentLog {
  id: string;
  date: string;
  amount: number;
  method: 'Transfer Bank' | 'Tunai / Cash' | 'Potong Gaji' | 'Lainnya';
  receivedBy?: string;
  notes?: string;
}

export interface CpmiFinance {
  feeSponsor: number;
  feeCpmi: number;
  feeAgency: number;
  feeLainnya: number;
  biayaTransport: number;
  biayaMcuPra: number;
  biayaPaspor: number;
  biayaAdministrasi: number;
  biayaVisa: number;
  biayaTiket: number;
  biayaPenginapan: number;
  biayaMakan: number;
  biayaDokumen: number;
  biayaLainnya: number;
  totalTagihan: number;
  sudahDibayar: number;
  statusPembayaran: PaymentStatus;
  tanggalPembayaranTerakhir?: string;
  paymentLogs: PaymentLog[];
}

export interface CpmiRecord {
  id: string; // e.g. "TS 6317", "TSEX 6440", "TS 6274"
  indexNum?: number;
  name: string;
  gender: Gender;
  destination: DestinationCountry | string;
  category: string; // e.g. "TKW (In Formal)", "Caregiver", "Manufaktur"
  agency: string; // e.g. "PT. TRIAS INSAN MADANI"
  recruiter: string; // e.g. "PA Irwan", "Pa Hj Nono", "Bu Maskinah"
  status: CpmiWorkflowStatus | string;
  dateInput: string; // YYYY-MM-DD
  
  // Detail Informasi Tambahan
  phone?: string;
  address?: string;
  birthPlace?: string;
  birthDate?: string;
  notes?: string;
  targetDepartureDate?: string;
  actualDepartureDate?: string;

  // 10 Alur Proses
  stages: Record<StageKey, ProcessStage>;

  // Checklist Dokumen
  documents: Record<DocumentKey, boolean | DocCheckStatus>;

  // Berkas Unggahan / Lampiran
  attachments?: CpmiAttachment[];

  // Keuangan & Pembayaran
  finance: CpmiFinance;

  createdAt?: string;
  updatedAt?: string;
}

export type KasCategory =
  | 'Fee Sponsor'
  | 'Biaya MD'
  | 'ID Paspor'
  | 'Living Cost'
  | 'Transport'
  | 'Mcu Pra'
  | 'Royalti'
  | 'Keterangan Lain'
  | 'Tiket'
  | 'Visa'
  | 'Operasional Kantor';

export interface KasTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  category: KasCategory | string;
  pmiRef: string; // e.g. "TS 6701", "TS 6659", "OPERASIONAL"
  pmiName?: string; // e.g. "Khodijah", "Maya Salsabela"
  value: number; // Rupiah integer
  description?: string;
  noReff?: string;
  createdAt?: string;
}

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Staff Portal' | 'Kasir';
  createdAt: string;
}

export interface PtProfile {
  name: string;
  branch: string;
  subtitle: string;
  logoBase64?: string | null;
}
