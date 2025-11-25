
import { read, utils } from 'xlsx';
import { Asset, DeviceType } from '../types';

// Helper to read file as ArrayBuffer
const readFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // raw: false forces parsing of dates and numbers to strings where possible
        // cellDates: true ensures dates are parsed as Date objects if formatted as such in Excel
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

// Fuzzy key matcher to find columns with Turkish locale support
const getValue = (row: any, possibleKeys: string[]): string => {
  const rowKeys = Object.keys(row);
  
  for (const key of possibleKeys) {
    // Use Turkish locale for lowercasing to handle I/ı/İ/i correctly
    const searchKey = key.toLocaleLowerCase('tr').trim();
    
    const foundKey = rowKeys.find(k => {
        const rowKey = k.toLocaleLowerCase('tr').trim();
        // Check exact match or if the row key contains the search term
        // e.g. "Personel Tam İsim" should match "tam isim"
        return rowKey === searchKey || rowKey.includes(searchKey);
    });

    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      const val = row[foundKey];
      // Handle empty strings even if key matches
      if (typeof val === 'string' && val.trim() === '') return '';

      // Handle Excel Date Objects
      if (val instanceof Date) {
        // Adjust for timezone offset if necessary, but simple ISO split is usually enough for dates
        const date = new Date(val.getTime() - (val.getTimezoneOffset() * 60000));
        return date.toISOString().split('T')[0];
      }
      return String(val).trim();
    }
  }
  return '';
};

// Helper to calculate days difference
const calculateDaysDiff = (dateStr: string | Date): number | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper to format user full name into Defender device naming pattern
const formatNameForDefender = (fullName: string): string => {
  let clean = fullName.toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  clean = clean.replace(/[^a-z0-9\s]/g, '');
  const parts = clean.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || '';
  const lastName = parts.pop();
  const firstNames = parts.join(''); 
  return `${firstNames}_${lastName}`;
};

// Normalize device type based on Brand/Model/Type AND Status
const determineType = (brand: string, model: string, rawType: string, status: string): DeviceType => {
  const combined = `${brand || ''} ${model || ''} ${rawType || ''} ${status || ''}`.toLocaleLowerCase('tr');
  
  if (combined.includes('ipad') || combined.includes('ıpad') || combined.includes('tablet')) {
    return DeviceType.iPad;
  }

  if (
    combined.includes('iphone') || combined.includes('ıphone') || 
    combined.includes('ios') || combined.includes('ıos') || 
    combined.includes('telefon') || combined.includes('phone') || 
    combined.includes('mobile')
  ) {
    return DeviceType.iPhone;
  }
  
  if (combined.includes('macbook') || combined.includes('imac') || combined.includes('mac mini') || combined.includes('mac studio') || combined.includes('mac pro') || combined.includes('osx') || combined.includes('macos')) {
    return DeviceType.MacBook;
  }

  if (combined.includes('monitor') || combined.includes('display') || combined.includes('screen') || combined.includes('ekran')) {
     if (!combined.includes('latitude') && !combined.includes('thinkpad') && !combined.includes('mac')) {
        return DeviceType.Monitor;
     }
  }

  const notebookKeywords = [
    'laptop', 'notebook', 'dizüstü', 'portable', 'latitude', 'thinkpad', 'elitebook', 'probook', 
    'yoga', 'surface', 'xps', 'zenbook', 'spectre', 'air', 'book'
  ];
  if (notebookKeywords.some(k => combined.includes(k))) {
    return DeviceType.Notebook;
  }

  const desktopKeywords = [
    'desktop', 'tower', 'masaüstü', 'optiplex', 'precision', 'prodesk', 'elitedesk', 
    'inspiron dt', 'veriton', 'esprimo', 'workstation', 'all-in-one', 'aio', 'kasa', 'pc'
  ];
  if (desktopKeywords.some(k => combined.includes(k))) {
    return DeviceType.Desktop;
  }
  
  if (combined.includes('apple')) {
      const iphoneModelRegex = /\b(1[1-9][a-z]?|se|x|xr|xs|mini|plus|max|pro|6s?|7|8|16e)\b/;
      if (iphoneModelRegex.test(combined)) {
          if (!combined.includes('ssd') && !combined.includes('tb') && !combined.includes('m1') && !combined.includes('m2') && !combined.includes('m3')) {
               return DeviceType.iPhone;
          }
          if (/\b\d{2,3}gb\b/.test(combined)) {
              return DeviceType.iPhone;
          }
      }
      return DeviceType.MacBook;
  }
  
  return DeviceType.Notebook;
};

// Define return type including report counts
interface ProcessResult {
  assets: Asset[];
  cloudCounts: {
    intune: number;
    jamf: number;
    defender: number;
  };
}

export const processFiles = async (
  inventoryFile: File | null,
  intuneFile: File | null,
  jamfFile: File | null,
  defenderFile: File | null
): Promise<ProcessResult> => {
  if (!inventoryFile) throw new Error("Inventory file is required");

  // 1. Parse Inventory
  const rawInventory = await readFile(inventoryFile);
  
  const assets: Asset[] = rawInventory.map((row, index) => {
    let assetTag = getValue(row, ['referans numarası', 'referans', 'asset tag', 'demirbaş no', 'tag']);
    const statusDesc = getValue(row, ['durum açıklama', 'durum açıklam', 'durum']);
    const brand = getValue(row, ['marka', 'brand', 'üretici']);
    const model = getValue(row, ['model', 'model adı', 'ürün', 'ürün adı']);
    const serial = getValue(row, ['seri numarası', 'seri', 'seri no', 'serial number', 'serial', 's/n']);
    let userName = getValue(row, ['kullanıcı adı', 'kullanıcı', 'username', 'sicil', 'sicil no']);
    const fullName = getValue(row, ['tam isim', 'isim', 'ad soyad', 'adı soyadı', 'personel adı', 'fullname']);
    const rawCategory = getValue(row, ['tip', 'tür', 'cins', 'kategori', 'category', 'type', 'device type']);
    const usageType = getValue(row, ['kullanım tipi', 'usage type', 'kullanim tipi', 'kullanım']);
    
    if (userName && (userName.startsWith('248') || userName.startsWith('969'))) {
       userName = '0' + userName;
    }

    const type = determineType(brand, model, rawCategory, statusDesc);

    const isStock = usageType.toLowerCase().includes('stok') || 
                    usageType.toLowerCase().includes('stock') || 
                    usageType.toLowerCase().includes('depo') ||
                    statusDesc.toLowerCase().includes('stok') ||
                    statusDesc.toLowerCase().includes('stock');

    // --- CUSTOM ASSET TAG LOGIC ---

    // Special Logic for MacBooks: Always prefix Serial with KSN (as per user request)
    if (type === DeviceType.MacBook && serial) {
        // Strip existing KSN if present to avoid duplication
        const cleanSerial = serial.replace(/^KSN/i, '').trim();
        assetTag = `KSN${cleanSerial}`;
    }
    // Logic for iPhones/iPads: Use Serial as Asset Tag if missing
    else if ((type === DeviceType.iPhone || type === DeviceType.iPad) && serial) {
         if (!assetTag || assetTag.trim() === '') {
            assetTag = serial;
         }
    }
    // Logic for Notebooks: Fallback to KSN+Serial if tag is missing
    else if (type === DeviceType.Notebook && (!assetTag || assetTag.trim() === '' || assetTag.toUpperCase().startsWith('UNK'))) {
        if (serial) {
             assetTag = `KSN${serial}`;
        }
    }
    // Logic for numeric-only tags: Add KSN prefix
    else if ((type === DeviceType.Notebook || type === DeviceType.Desktop) && assetTag) {
        if (/^\d+$/.test(assetTag.trim())) {
            assetTag = `KSN${assetTag.trim()}`;
        }
    }

    const assignedUser = fullName || userName || 'Unassigned';
    let date = getValue(row, ['demirbaş yaşı', 'tarih', 'purchase date']);
    if (!date) date = new Date().toISOString();
    
    const purchaseDateObj = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - purchaseDateObj.getTime());
    const assetAgeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const hostname = getValue(row, ['hostname', 'device name', 'bilgisayar adı']) || assetTag || `Unknown-${index}`;

    return {
      id: `asset-${index}`,
      assetTag: assetTag || `UNK-${index}`,
      statusDescription: statusDesc,
      brand: brand,
      model: model,
      hostname: hostname,
      serialNumber: serial || `SN-${index}`,
      type: type, 
      purchaseDate: date,
      assetAgeDays: assetAgeDays,
      userName: userName,
      fullName: fullName,
      assignedUser: assignedUser,
      isStock: isStock,
      compliance: {
        inIntune: false,
        inJamf: false,
        inDefender: false
      }
    };
  });

  // 2. Parse Intune (Management)
  const intuneData = new Map<string, { hostname: string, complianceState: string, lastContact: string }>();
  const intuneSerialToHostMap = new Map<string, string>();
  
  // Track counts
  let intuneCount = 0;
  let jamfCount = 0;
  let defenderCount = 0;

  if (intuneFile) {
    const rawIntune = await readFile(intuneFile);
    intuneCount = rawIntune.length;

    rawIntune.forEach(row => {
      const host = getValue(row, ['device name', 'name', 'hostname', 'cihaz adı']);
      const serial = getValue(row, ['serial', 'serial number', 'imei', 'seri numarası', 'seri no']);
      const assetTag = getValue(row, ['asset tag', 'demirbaş no', 'reference']);
      const compliance = getValue(row, ['compliance state', 'uyumluluk durumu', 'complianceStatus', 'state']);
      const lastContact = getValue(row, ['last check-in', 'last contact', 'son iletişim', 'last sync', 'son görülme']);

      const details = {
          hostname: host ? host.toLowerCase() : '',
          complianceState: compliance || 'Unknown',
          lastContact: lastContact
      };

      if (host) {
          intuneData.set(host.toLowerCase(), details);
      }
      if (serial) {
          intuneData.set(serial.toLowerCase(), details);
          intuneSerialToHostMap.set(serial.toLowerCase(), host ? host.toLowerCase() : '');
      }
      if (assetTag) {
          intuneData.set(assetTag.toLowerCase(), details);
      }
    });
  }

  // 3. Parse Jamf
  let jamfDevices: Set<string> = new Set();
  if (jamfFile) {
    const rawJamf = await readFile(jamfFile);
    jamfCount = rawJamf.length;

    rawJamf.forEach(row => {
      const host = getValue(row, ['device name', 'name', 'hostname', 'bilgisayar adı', 'cihaz adı']);
      const serial = getValue(row, ['serial', 'serial number', 'seri numarası', 'seri no', 's/n', 'imei']);
      const assetTag = getValue(row, ['asset tag', 'demirbaş no', 'demirbaş', 'tag']);
      
      if (host) jamfDevices.add(host.toLowerCase());
      if (serial) jamfDevices.add(serial.toLowerCase());
      if (assetTag) jamfDevices.add(assetTag.toLowerCase());
    });
  }

  // 4. Parse Defender
  let defenderDevices: Set<string> = new Set();
  if (defenderFile) {
    const rawDefender = await readFile(defenderFile);
    defenderCount = rawDefender.length;

    rawDefender.forEach(row => {
      const host = getValue(row, ['device name', 'devicename', 'hostname', 'bilgisayar adı', 'cihaz adı']);
      const serial = getValue(row, ['serial', 'serial number', 'seri numarası', 'seri no', 's/n']); 
      const assetTag = getValue(row, ['asset tag', 'demirbaş no']);
      const user = getValue(row, ['isim_soyisim', 'isim soyisim', 'user', 'username', 'kullanıcı']);
      
      if (host) defenderDevices.add(host.toLowerCase());
      if (serial) defenderDevices.add(serial.toLowerCase());
      if (assetTag) defenderDevices.add(assetTag.toLowerCase());
      if (user) defenderDevices.add(user.toLowerCase());
    });
  }

  // 5. Reconcile
  const mappedAssets = assets.map(asset => {
    // Check Intune (Detailed)
    let inIntune = false;
    // Check by Hostname
    let intuneDetails = intuneData.get(asset.hostname.toLowerCase());
    // Check by Serial
    if (!intuneDetails) {
        intuneDetails = intuneData.get(asset.serialNumber.toLowerCase());
    }
    // Check by Asset Tag (Important fix for KSNNK9C4Y924F scenario)
    if (!intuneDetails && asset.assetTag) {
        intuneDetails = intuneData.get(asset.assetTag.toLowerCase());
    }

    if (intuneDetails) {
        inIntune = true;
    }

    // Check Jamf
    const inJamf = jamfFile
      ? (jamfDevices.has(asset.hostname.toLowerCase()) || 
         jamfDevices.has(asset.serialNumber.toLowerCase()) ||
         (asset.assetTag && jamfDevices.has(asset.assetTag.toLowerCase()))) // Added Asset Tag Check
      : false;

    // Check Defender
    let inDefender = defenderFile
      ? (defenderDevices.has(asset.hostname.toLowerCase()) || 
         defenderDevices.has(asset.serialNumber.toLowerCase()) ||
         (asset.assetTag && defenderDevices.has(asset.assetTag.toLowerCase()))) // Added Asset Tag Check
      : false;

    // Defender Logic Extension (Intune correlation)
    if (!inDefender && defenderFile && intuneFile) {
        const intuneHost = intuneSerialToHostMap.get(asset.serialNumber.toLowerCase());
        if (intuneHost) {
             if (defenderDevices.has(intuneHost)) {
                 inDefender = true;
             }
        }
    }

    // Defender Logic Extension (Mobile User Name)
    if (!inDefender && defenderFile && (asset.type === DeviceType.iPhone || asset.type === DeviceType.iPad) && asset.fullName) {
        const normalizedUser = formatNameForDefender(asset.fullName);
        if (defenderDevices.has(normalizedUser)) {
            inDefender = true;
        } else {
            for (const defenderItem of defenderDevices) {
                if (defenderItem.includes(normalizedUser)) {
                    inDefender = true;
                    break;
                }
            }
        }
    }

    return {
      ...asset,
      compliance: {
        inIntune,
        intuneComplianceState: intuneDetails?.complianceState,
        intuneLastCheckInDays: intuneDetails?.lastContact ? calculateDaysDiff(intuneDetails.lastContact) : undefined,
        inJamf,
        inDefender,
        lastSync: new Date().toISOString()
      }
    };
  });

  return {
    assets: mappedAssets,
    cloudCounts: {
      intune: intuneCount,
      jamf: jamfCount,
      defender: defenderCount
    }
  };
};
