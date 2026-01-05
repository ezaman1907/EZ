
import { read, utils } from 'xlsx';
import { Asset, DeviceType } from '../types';

// Helper to read file as ArrayBuffer
const readFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

// Seri numarasını eşleştirme için temizleyen fonksiyon
const normalizeIdentifier = (val: string): string => {
  if (!val) return '';
  return String(val)
    .replace(/^(s\/n[:\s]+|seri[:\s]+|sn[:\s]+)/i, '') // S/N:, Seri: gibi ekleri temizle
    .trim()
    .toLowerCase();
};

/**
 * iPhone/iPad cihazlarda seri numarasının başındaki hatalı 'S' harfini temizler
 * Örnek: SV22P3H6YY3 -> V22P3H6YY3
 */
const cleanAppleMobileSerial = (serial: string, type: DeviceType): string => {
  if (!serial) return '';
  const s = serial.trim();
  if ((type === DeviceType.iPhone || type === DeviceType.iPad) && 
      (s.startsWith('S') || s.startsWith('s')) && 
      s.length >= 10) {
    return s.substring(1);
  }
  return s;
};

const getValue = (row: any, possibleKeys: string[]): string => {
  const rowKeys = Object.keys(row);
  for (const key of possibleKeys) {
    const searchKey = key.toLocaleLowerCase('tr').trim();
    const foundKey = rowKeys.find(k => {
        const rowKey = k.toLocaleLowerCase('tr').trim();
        return rowKey === searchKey || rowKey.includes(searchKey);
    });
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      const val = row[foundKey];
      if (typeof val === 'string' && val.trim() === '') return '';
      if (val instanceof Date) {
        const date = new Date(val.getTime() - (val.getTimezoneOffset() * 60000));
        return date.toISOString().split('T')[0];
      }
      return String(val).trim();
    }
  }
  return '';
};

const calculateDaysDiff = (dateStr: string | Date): number | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const determineType = (brand: string, model: string, rawType: string, status: string): DeviceType => {
  const b = (brand || '').toLocaleLowerCase('tr');
  const m = (model || '').toLocaleLowerCase('tr');
  const t = (rawType || '').toLocaleLowerCase('tr');
  const s = (status || '').toLocaleLowerCase('tr');
  const combined = `${b} ${m} ${t} ${s}`;

  if (combined.includes('ipad') || combined.includes('ıpad') || combined.includes('tablet')) return DeviceType.iPad;
  if (combined.includes('iphone') || combined.includes('ıphone') || combined.includes('mobile')) return DeviceType.iPhone;
  
  if (combined.includes('macbook') || combined.includes('macos') || combined.includes('imac')) return DeviceType.MacBook;
  if (b.includes('apple') && (combined.includes('notebook') || combined.includes('laptop') || combined.includes('air') || combined.includes('pro'))) {
      return DeviceType.MacBook;
  }

  if (combined.includes('monitor') || combined.includes('display')) {
     if (!combined.includes('latitude') && !combined.includes('thinkpad')) return DeviceType.Monitor;
  }
  
  const notebookKeywords = ['laptop', 'notebook', 'dizüstü', 'latitude', 'thinkpad', 'precision', 'vostro'];
  if (notebookKeywords.some(k => combined.includes(k))) return DeviceType.Notebook;
  
  const desktopKeywords = ['desktop', 'masaüstü', 'optiplex', 'kasa', 'pc', 'tower', 'workstation'];
  if (desktopKeywords.some(k => combined.includes(k))) return DeviceType.Desktop;
  
  if (b.includes('apple')) return DeviceType.iPhone;
  
  return DeviceType.Notebook;
};

export const SPECIAL_EXEMPTIONS = [
    'C02K13QZQ6L4', 
    'C02K13QRQ6L4', 
    'K2WP0696DG', 
    'QGGJ7YQMNW', 
    'FVFGK5C1Q05N'
];

export const SPECIAL_EXEMPT_USERS: string[] = [
  'MEHMET ALİ AKARCA',
  'AHMET BARIŞ DÜZENLI',
  'CÜNEYT ÖZDİLEK',
  'EVREN DERECI'
];

interface ProcessResult {
  assets: Asset[];
  orphans: Asset[];
  cloudCounts: { intune: number; jamf: number; defender: number; };
}

export const processFiles = async (
  inventoryFile: File | null,
  intuneFile: File | null,
  jamfFile: File | null,
  defenderFile: File | null
): Promise<ProcessResult> => {
   if (!inventoryFile) throw new Error("Envanter dosyası zorunludur");
   
   const rawInventory = await readFile(inventoryFile);
   let intuneData: any[] = [];
   if (intuneFile) intuneData = await readFile(intuneFile);
   let jamfData: any[] = [];
   if (jamfFile) jamfData = await readFile(jamfFile);
   let defenderData: any[] = [];
   if (defenderFile) defenderData = await readFile(defenderFile);

   const matchedSerials = new Set<string>();
   const matchedHostnames = new Set<string>();

   // 1. Process Inventory
   const assets: Asset[] = rawInventory.map((row, index) => {
      let assetTag = getValue(row, ['referans numarası', 'referans', 'asset tag', 'demirbaş no', 'tag']);
      const statusDesc = getValue(row, ['durum açıklama', 'durum']);
      const brand = getValue(row, ['marka', 'brand']);
      const model = getValue(row, ['model']);
      const rawSerial = getValue(row, ['seri numarası', 'seri', 'serial', 'serial number']);
      let userName = getValue(row, ['kullanıcı adı', 'sicil', 'username']);
      const fullName = getValue(row, ['tam isim', 'isim', 'fullname', 'kullanıcı']);
      const rawCategory = getValue(row, ['tip', 'tür', 'type', 'kategori']);
      const usageType = getValue(row, ['kullanım tipi', 'usage type']);
      
      if (userName && (userName.startsWith('248') || userName.startsWith('969'))) userName = '0' + userName;
      const type = determineType(brand, model, rawCategory, statusDesc);

      const serial = cleanAppleMobileSerial(rawSerial, type);

      const isStock = usageType.toLowerCase().includes('stok') || statusDesc.toLowerCase().includes('stok');
      const isDepartment = usageType.toLowerCase().includes('departman') || (userName && userName.startsWith('03160185'));
      
      const normSerial = normalizeIdentifier(serial);
      const isSerialExempt = SPECIAL_EXEMPTIONS.some(ex => normalizeIdentifier(ex) === normSerial);

      const normalizedUser = (fullName || '').toLocaleLowerCase('tr');
      const isUserExempt = SPECIAL_EXEMPT_USERS.some(u => normalizedUser.includes(u.toLocaleLowerCase('tr')));

      const isExempt = isSerialExempt || isUserExempt;

      if (type === DeviceType.MacBook && serial) assetTag = `KSN${serial.replace(/^KSN/i, '').trim()}`;
      else if ((type === DeviceType.iPhone || type === DeviceType.iPad) && serial && !assetTag) assetTag = serial;
      else if (type === DeviceType.Notebook && !assetTag && serial) assetTag = `KSN${serial}`;
      
      const hostname = getValue(row, ['hostname', 'device name', 'bilgisayar adı']) || assetTag || `Unknown-${index}`;
      
      if (normSerial) matchedSerials.add(normSerial);
      if (hostname) matchedHostnames.add(hostname.toLowerCase().trim());

      return {
        id: `asset-${index}`,
        assetTag: assetTag || `UNK-${index}`,
        statusDescription: statusDesc,
        brand, model, hostname,
        serialNumber: serial || `SN-${index}`,
        type, 
        purchaseDate: new Date().toISOString(),
        assetAgeDays: 0,
        userName, fullName,
        assignedUser: fullName || userName || 'Unassigned',
        isStock, 
        isDepartment,
        isExempt,
        compliance: { inIntune: false, inJamf: false, inDefender: false }
      };
   });

   // 2. Build Cloud Maps (Intune)
   const intuneMap = new Map<string, any>();
   const intuneSerialToHost = new Map<string, string>();
   
   intuneData.forEach(row => {
       const host = getValue(row, ['device name', 'hostname', 'devicename', 'displayname']);
       const rawSerial = getValue(row, ['serial', 'imei', 'serial number', 'serialnumber', 'device serial number']);
       
       const model = getValue(row, ['model']).toLowerCase();
       const os = getValue(row, ['operating system', 'os']).toLowerCase();
       const probableType = (model.includes('iphone') || model.includes('ipad') || os.includes('ios')) ? DeviceType.iPhone : DeviceType.Other;
       const serial = cleanAppleMobileSerial(rawSerial, probableType);

       const complianceState = getValue(row, ['compliance', 'compliance state', 'status']);
       const lastContact = getValue(row, ['last contact', 'last check-in', 'last sync', 'last successfull scan']);
       
       const details = { hostname: host, complianceState, lastContact, raw: row };
       
       if (host) intuneMap.set(host.toLowerCase().trim(), details);
       if (serial) {
           const nSerial = normalizeIdentifier(serial);
           intuneMap.set(nSerial, details);
           if (host) intuneSerialToHost.set(nSerial, host.toLowerCase().trim());
       }
   });

   // 3. Build Cloud Maps (Jamf)
   const jamfMap = new Map<string, any>();
   jamfData.forEach(row => {
       const host = getValue(row, ['computer name', 'hostname', 'display name', 'computername']);
       const serial = getValue(row, ['serial', 'serial number', 'serialnumber']);
       if (host) jamfMap.set(host.toLowerCase().trim(), row);
       if (serial) jamfMap.set(normalizeIdentifier(serial), row);
   });

   // 4. Build Cloud Maps (Defender)
   const defenderMap = new Map<string, any>();
   defenderData.forEach(row => {
       const host = getValue(row, ['device name', 'hostname', 'computer name', 'devicename']);
       if (host) defenderMap.set(host.toLowerCase().trim(), row);
   });

   // 5. Match Assets
   const mappedAssets = assets.map(asset => {
       const nSerial = normalizeIdentifier(asset.serialNumber);
       const host = asset.hostname.toLowerCase().trim();
       
       let inIntune = false;
       let intuneComplianceState = undefined;
       let intuneLastCheckInDays = undefined;
       let intuneMatchMethod: 'Serial' | 'Hostname' | undefined = undefined;
       let rawIntuneData = undefined;

       let inJamf = false;
       let jamfMatchMethod: 'Serial' | 'Hostname' | undefined = undefined;
       let rawJamfData = undefined;

       let inDefender = false;
       let defenderMatchMethod: 'Hostname' | 'Serial' | undefined = undefined;
       let rawDefenderData = undefined;

       // Intune Matching
       const intuneDetails = intuneMap.get(nSerial) || intuneMap.get(host);
       if (intuneDetails) {
            inIntune = true;
            intuneMatchMethod = intuneMap.get(nSerial) ? 'Serial' : 'Hostname';
            intuneComplianceState = intuneDetails.complianceState;
            intuneLastCheckInDays = calculateDaysDiff(intuneDetails.lastContact);
            rawIntuneData = intuneDetails.raw;
       }

       // Jamf Matching
       rawJamfData = jamfMap.get(nSerial) || jamfMap.get(host);
       if (rawJamfData) {
           inJamf = true;
           jamfMatchMethod = jamfMap.get(nSerial) ? 'Serial' : 'Hostname';
       }

       // Defender Matching
       rawDefenderData = defenderMap.get(host);
       if (rawDefenderData) {
           inDefender = true;
           defenderMatchMethod = 'Hostname';
       } else {
           const iHost = intuneSerialToHost.get(nSerial);
           if (iHost && defenderMap.has(iHost)) {
               inDefender = true;
               defenderMatchMethod = 'Serial';
               rawDefenderData = defenderMap.get(iHost);
           }
       }

       return { 
           ...asset, 
           compliance: { 
               inIntune, 
               intuneComplianceState,
               intuneLastCheckInDays,
               intuneMatchMethod,
               inJamf,
               jamfMatchMethod,
               inDefender,
               defenderMatchMethod,
               rawIntuneData,
               rawJamfData,
               rawDefenderData
           } 
       };
   });

   // 6. Orphans (Envanter Dışı Cihazlar)
   const orphans: Asset[] = [];
   const processedOrphanKeys = new Set<string>();

   // Intune Orphans
   intuneData.forEach((row, i) => {
       const host = getValue(row, ['device name', 'hostname', 'devicename']);
       const rawSerial = getValue(row, ['serial', 'imei', 'serial number', 'serialnumber']);
       const model = getValue(row, ['model']).toLowerCase();
       const probableType = (model.includes('iphone') || model.includes('ipad')) ? DeviceType.iPhone : DeviceType.Other;
       const serial = cleanAppleMobileSerial(rawSerial, probableType);
       const nSerial = normalizeIdentifier(serial);
       const key = `intune-${nSerial || host?.toLowerCase().trim()}`;
       if (!key || processedOrphanKeys.has(key)) return;
       const isMatched = (nSerial && matchedSerials.has(nSerial)) || (host && matchedHostnames.has(host.toLowerCase().trim()));
       if (!isMatched) {
           processedOrphanKeys.add(key);
           orphans.push({
                id: `orphan-intune-${i}`,
                assetTag: 'ENVANTER DIŞI',
                statusDescription: 'Envanter Dışı (Intune)',
                brand: getValue(row, ['manufacturer']) || 'Bilinmiyor',
                model: getValue(row, ['model']) || 'Bilinmiyor',
                hostname: host || 'Unknown',
                serialNumber: serial || 'Unknown',
                type: DeviceType.Other,
                purchaseDate: new Date().toISOString(),
                assignedUser: getValue(row, ['user', 'primary user']) || 'Cloud User',
                isStock: false, isDepartment: false, isOrphan: true, orphanSource: 'Intune',
                compliance: { inIntune: true, inJamf: false, inDefender: false, rawIntuneData: row }
           });
       }
   });

   // Jamf Orphans
   jamfData.forEach((row, i) => {
       const host = getValue(row, ['computer name', 'hostname', 'display name', 'computername']);
       const serial = getValue(row, ['serial', 'serial number', 'serialnumber']);
       const nSerial = normalizeIdentifier(serial);
       const key = `jamf-${nSerial || host?.toLowerCase().trim()}`;
       if (!key || processedOrphanKeys.has(key)) return;
       const isMatched = (nSerial && matchedSerials.has(nSerial)) || (host && matchedHostnames.has(host.toLowerCase().trim()));
       if (!isMatched) {
           processedOrphanKeys.add(key);
           orphans.push({
                id: `orphan-jamf-${i}`,
                assetTag: 'ENVANTER DIŞI',
                statusDescription: 'Envanter Dışı (Jamf)',
                brand: 'Apple',
                model: getValue(row, ['model']) || 'MacBook',
                hostname: host || 'Unknown',
                serialNumber: serial || 'Unknown',
                type: DeviceType.MacBook,
                purchaseDate: new Date().toISOString(),
                assignedUser: getValue(row, ['user', 'full name']) || 'Jamf User',
                isStock: false, isDepartment: false, isOrphan: true, orphanSource: 'Jamf',
                compliance: { inIntune: false, inJamf: true, inDefender: false, rawJamfData: row }
           });
       }
   });

   // Defender Orphans
   defenderData.forEach((row, i) => {
       const host = getValue(row, ['device name', 'hostname', 'devicename']);
       const key = `defender-${host?.toLowerCase().trim()}`;
       if (!key || processedOrphanKeys.has(key)) return;
       const isMatched = host && matchedHostnames.has(host.toLowerCase().trim());
       if (!isMatched) {
           processedOrphanKeys.add(key);
           orphans.push({
                id: `orphan-defender-${i}`,
                assetTag: 'ENVANTER DIŞI',
                statusDescription: 'Envanter Dışı (Defender)',
                brand: 'Unknown',
                model: 'Unknown',
                hostname: host || 'Unknown',
                serialNumber: 'Unknown',
                type: DeviceType.Other,
                purchaseDate: new Date().toISOString(),
                assignedUser: 'Defender User',
                isStock: false, isDepartment: false, isOrphan: true, orphanSource: 'Defender',
                compliance: { inIntune: false, inJamf: false, inDefender: true, rawDefenderData: row }
           });
       }
   });

   return {
       assets: mappedAssets,
       orphans,
       cloudCounts: { 
           intune: intuneData.length, 
           jamf: jamfData.length, 
           defender: defenderData.length 
       }
   };
};
