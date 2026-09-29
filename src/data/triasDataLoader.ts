import {
  CpmiRecord,
  KasTransaction,
  StageKey,
  ProcessStage,
  DocumentKey,
  CpmiFinance,
  DocCheckStatus,
} from '../types/cpmi';
import { RAW_TRIAS_CPMI_TEXT, RAW_TRIAS_TX_TEXT } from './rawTriasData';

export const DEFAULT_STAGE_LABELS: Record<StageKey, string> = {
  dataMasuk: 'Data Masuk & Registrasi',
  paspor: 'Pembuatan / Cek Paspor',
  mcuPra: 'Medical Check Up (MCU Pra)',
  jobOrder: 'Job Order & Rekom Disnaker',
  interview: 'Interview User / Majikan',
  visa: 'Pengajuan & Terbit Visa',
  pap: 'Pembekalan Akhir (PAP)',
  bp3mi: 'Verifikasi E-PMI / BP3MI',
  tiket: 'Booking & Terbit Tiket',
  terbang: 'Terbang ke Negara Penempatan',
};

export const DEFAULT_DOCUMENT_KEYS: DocumentKey[] = [
  'ktp',
  'kk',
  'aktaLahir',
  'ijazah',
  'suratIzinKeluarga',
  'paspor',
  'medicalCheck',
  'dokumenSponsor',
  'jobOrder',
  'visa',
  'pap',
  'bp3mi',
  'tiket',
];

export function createDefaultStages(statusStr: string): Record<StageKey, ProcessStage> {
  const norm = statusStr.toUpperCase();
  const isFlight = norm.includes('FLIGHT') || norm.includes('TERBANG');
  const isFinal = norm.includes('FINAL');
  const isBnsp = norm.includes('BNSP') || norm.includes('BLK');
  const isVerif = norm.includes('VERIF') || norm.includes('ID PASPOR');
  const isCancel = norm.includes('CANCEL') || norm.includes('TOLAK');

  const keys: StageKey[] = [
    'dataMasuk',
    'paspor',
    'mcuPra',
    'jobOrder',
    'interview',
    'visa',
    'pap',
    'bp3mi',
    'tiket',
    'terbang',
  ];

  const result = {} as Record<StageKey, ProcessStage>;

  keys.forEach((key, index) => {
    let stageStatus: 'belum' | 'proses' | 'selesai' | 'masalah' = 'belum';

    if (isCancel) {
      stageStatus = index === 0 ? 'selesai' : index === 1 ? 'masalah' : 'belum';
    } else if (isFlight) {
      stageStatus = 'selesai';
    } else if (isFinal) {
      if (index <= 6) stageStatus = 'selesai';
      else if (index <= 8) stageStatus = 'proses';
      else stageStatus = 'belum';
    } else if (isBnsp) {
      if (index <= 3) stageStatus = 'selesai';
      else if (index === 4) stageStatus = 'proses';
      else stageStatus = 'belum';
    } else if (isVerif) {
      if (index <= 1) stageStatus = 'selesai';
      else if (index === 2) stageStatus = 'proses';
      else stageStatus = 'belum';
    } else {
      // Default PROCESS
      if (index === 0) stageStatus = 'selesai';
      else if (index === 1 || index === 2) stageStatus = 'proses';
      else stageStatus = 'belum';
    }

    result[key] = {
      id: key,
      label: DEFAULT_STAGE_LABELS[key],
      order: index + 1,
      status: stageStatus,
      updatedAt: '2025-02-15',
    };
  });

  return result;
}

export function createDefaultDocuments(statusStr: string): Record<DocumentKey, boolean | DocCheckStatus> {
  const norm = statusStr.toUpperCase();
  const isFlight = norm.includes('FLIGHT') || norm.includes('TERBANG');
  const isFinal = norm.includes('FINAL');

  const docs = {} as Record<DocumentKey, boolean | DocCheckStatus>;
  DEFAULT_DOCUMENT_KEYS.forEach((key) => {
    if (['ktp', 'kk', 'aktaLahir', 'ijazah', 'suratIzinKeluarga'].includes(key)) {
      docs[key] = true;
    } else if (key === 'paspor' || key === 'medicalCheck') {
      docs[key] = !norm.includes('PROCESS');
    } else if (['jobOrder', 'visa', 'pap', 'bp3mi'].includes(key)) {
      docs[key] = isFlight || isFinal;
    } else if (key === 'tiket') {
      docs[key] = isFlight;
    } else {
      docs[key] = isFlight || isFinal;
    }
  });

  return docs;
}

export function createEmptyFinance(): CpmiFinance {
  return {
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
  };
}

export function parseDateIndo(str: string): string {
  const parts = str.split('/');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  return '2025-02-26';
}

export function parseRawCpmis(rawText: string): CpmiRecord[] {
  const result: CpmiRecord[] = [];
  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;
    const idxNum = parseInt(parts[0], 10);
    if (isNaN(idxNum)) continue;

    let prefix = parts[1];
    let num = parts[2];
    let tokenIndex = 3;

    if (!/^\d+$/.test(num)) {
      if (/^(TS|TSEX|TSF|TSJK)\d+$/i.test(parts[1])) {
        const m = parts[1].match(/^(TS|TSEX|TSF|TSJK)(\d+)$/i);
        if (m) {
          prefix = m[1].toUpperCase();
          num = m[2];
          tokenIndex = 2;
        }
      } else {
        prefix = 'TS';
        num = parts[1];
        tokenIndex = 2;
      }
    }

    const cpmiId = `${prefix} ${num}`;
    const nameTokens: string[] = [];
    let detectedStatus = 'PROCESS';
    let recruiter = '';

    for (let i = tokenIndex; i < parts.length; i++) {
      const token = parts[i];
      const upper = token.toUpperCase();

      if (['FLIGHT', 'BNSP/BLK', 'PROCESS', 'FINAL', 'VERIF'].includes(upper)) {
        if (upper === 'FINAL' && (parts[i + 1] || '').toUpperCase() === 'STAGE') {
          detectedStatus = 'FINAL STAGE';
          i++;
        } else if (upper === 'VERIF' && (parts[i + 1] || '').toUpperCase() === 'ID') {
          detectedStatus = 'VERIF ID';
          i++;
        } else if (upper === 'FLIGHT') {
          detectedStatus = 'TERBANG (FLIGHT)';
        } else {
          detectedStatus = token;
        }
        recruiter = parts.slice(i + 1).join(' ');
        break;
      } else {
        if (
          ['TAIWAN', 'PEREMPUAN', 'TKW', 'PT.', 'TRIAS', 'INSAN', 'MADANI', '(IN', 'FORMAL)'].includes(
            upper
          )
        ) {
          continue;
        }
        nameTokens.push(token);
      }
    }

    const cleanName = nameTokens
      .join(' ')
      .replace(/Indonesia|PT\.|TRIAS|INSAN|MADANI|Perempuan|Taiwan|\(In\s+Formal\)/g, '')
      .trim();

    result.push({
      id: cpmiId,
      indexNum: idxNum,
      name: cleanName || `Kandidat CPMI ${cpmiId}`,
      gender: 'Perempuan',
      destination: 'Taiwan',
      category: 'TKW (In Formal)',
      agency: 'PT. TRIAS INSAN MADANI',
      recruiter: recruiter.trim() || 'Kantor Pusat Cirebon',
      status: detectedStatus,
      dateInput: '2025-01-15',
      phone: '0812-3456-7890',
      address: 'Wilayah Cirebon & Sekitarnya, Jawa Barat',
      stages: createDefaultStages(detectedStatus),
      documents: createDefaultDocuments(detectedStatus),
      attachments: [],
      finance: createEmptyFinance(),
      createdAt: '2025-01-15T08:00:00.000Z',
    });
  }

  return result;
}

export function parseRawTransactions(rawText: string): KasTransaction[] {
  const result: KasTransaction[] = [];
  const lines = rawText.split(/\r?\n/);
  let lastValidDate = '2025-02-26';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);
    let txDate = lastValidDate;
    let restOfLine = line;

    if (dateMatch) {
      txDate = parseDateIndo(dateMatch[1]);
      lastValidDate = txDate;
      restOfLine = line.substring(dateMatch[1].length).trim();
    }

    const rpMatch = restOfLine.match(/Rp\s*([\d.]+)/i);
    let amount = 0;
    if (rpMatch) {
      amount = parseInt(rpMatch[1].replace(/\./g, ''), 10);
      restOfLine = restOfLine.replace(rpMatch[0], '').trim();
    }

    const categories = [
      'Fee Sponsor',
      'Biaya MD',
      'ID Paspor',
      'Living Cost',
      'Transport',
      'Mcu Pra',
      'Royalti',
      'Keterangan Lain',
      'Tiket',
      'Visa',
      'Operasional Kantor',
    ];

    let detectedCategory = 'Keterangan Lain';
    for (const cat of categories) {
      const reg = new RegExp('^' + cat.replace(/\s+/g, '\\s+'), 'i');
      if (reg.test(restOfLine)) {
        detectedCategory = cat;
        restOfLine = restOfLine.replace(reg, '').trim();
        break;
      }
    }

    const tsMatch = restOfLine.match(/([a-zA-Z]+)\s*(\d+)/);
    let pmiRef = 'OPERASIONAL';
    let pmiName: string | undefined = undefined;
    let description = restOfLine;

    if (tsMatch) {
      const prefix = tsMatch[1].toUpperCase();
      const codeNum = tsMatch[2];
      if (['TS', 'TSEX', 'TSF', 'TSJK'].includes(prefix)) {
        pmiRef = `${prefix} ${codeNum}`;
        const parts = restOfLine.split(tsMatch[0]);
        pmiName = parts[1] ? parts[1].trim() : undefined;
        description = `${detectedCategory} untuk ${pmiRef} ${pmiName || ''}`.trim();
      }
    }

    result.push({
      id: `tx-${i}-${Date.now() % 10000}`,
      date: txDate,
      category: detectedCategory,
      pmiRef,
      pmiName,
      value: amount,
      description: description || `${detectedCategory} - Operasional`,
    });
  }

  return result;
}

// Generate pre-loaded datasets
export const INITIAL_TRIAS_CPMIS: CpmiRecord[] = parseRawCpmis(RAW_TRIAS_CPMI_TEXT);
export const INITIAL_TRIAS_TXS: KasTransaction[] = parseRawTransactions(RAW_TRIAS_TX_TEXT);
