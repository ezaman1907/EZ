
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

// Helper to format user full name into Defender device naming pattern
// Pattern: "FirstMiddleLast" names merged, underscore, Surname.
// e.g. "Onat Cem Yanik" -> "onatcem_yanik"
// e.g. "Erdinç Zaman" -> "erdinc_zaman"
const formatNameForDefender = (fullName: string): string => {
  // 1. Lowercase and normalize Turkish chars to English equivalents
  let clean = fullName.toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // 2. Remove any characters that aren't letters, numbers, or spaces
  clean = clean.replace(/[^a-z0-9\s]/g, '');

  // 3. Split by whitespace
  const parts = clean.trim().split(/\s+/);
  
  if (parts.length < 2) {
      return parts[0] || '';
  }

  // 4. Pop the surname (last part)
  const lastName = parts.pop();
  
  // 5. Join all remaining parts (First + Middle names) without spaces
  const firstNames = parts.join(''); 
  
  return `${firstNames}_${lastName}`;
};

// Normalize device type based on Brand/Model/Type AND Status
const determineType = (brand: string, model: string, rawType: string, status: string): DeviceType => {
  // Use Turkish locale for robustness (Fixes 'IPHONE' vs 'iphone' vs 'İPHONE' issues)
  const combined = `${brand || ''} ${model || ''} ${rawType || ''} ${status || ''}`.toLocaleLowerCase('tr');
  
  // 1. Detect Tablets
  // 'ıpad' handles Turkish uppercase IPAD -> ıpad
  if (combined.includes('ipad') || combined.includes('ıpad') || combined.includes('tablet')) {
    return DeviceType.iPad;
  }

  // 2. Detect Phones (Crucial: check before Mac to prevent misclassification)
  // Handle Turkish casing: IPHONE -> ıphone, IOS -> ıos
  if (
    combined.includes('iphone') || combined.includes('ıphone') || 
    combined.includes('ios') || combined.includes('ıos') || 
    combined.includes('telefon') || combined.includes('phone') || 
    combined.includes('mobile')
  ) {
    return DeviceType.iPhone;
  }
  
  // 3. Detect Macs (Explicit keywords)
  // Specific Mac keywords
  if (combined.includes('macbook') || combined.includes('imac') || combined.includes('mac mini') || combined.includes('mac studio') || combined.includes('mac pro') || combined.includes('osx') || combined.includes('macos')) {
    return DeviceType.MacBook;
  }

  // 4. Detect Monitors
  if (combined.includes('monitor') || combined.includes('display') || combined.includes('screen') || combined.includes('ekran')) {
     // Exclude items that might have 'display' in name but are laptops (rare, but safe to check)
     if (!combined.includes('latitude') && !combined.includes('thinkpad') && !combined.includes('mac')) {
        return DeviceType.Monitor;
     }
  }

  // 5. Notebooks (Turkish & English keywords)
  const notebookKeywords = [
    'laptop', 'notebook', 'dizüstü', 'portable', 'latitude', 'thinkpad', 'elitebook', 'probook', 
    'yoga', 'surface', 'xps', 'zenbook', 'spectre', 'air', 'book'
  ];
  if (notebookKeywords.some(k => combined.includes(k))) {
    return DeviceType.Notebook;
  }

  // 6. Desktops (Turkish & English keywords)
  const desktopKeywords = [
    'desktop', 'tower', 'masaüstü', 'optiplex', 'precision', 'prodesk', 'elitedesk', 
    'inspiron dt', 'veriton', 'esprimo', 'workstation', 'all-in-one', 'aio', 'kasa', 'pc'
  ];
  if (desktopKeywords.some(k => combined.includes(k))) {
    return DeviceType.Desktop;
  }
  
  // 7. Fallback: "Apple" without other context
  if (combined.includes('apple')) {
      // HEURISTIC: Check for iPhone models if the word "iPhone" is missing
      // e.g. "13 256GB", "14 Plus", "12 64GB", "SE", "7 32GB", "16E"
      // Regex looks for whole word numbers 6-16, or SE, X, XR, XS, 16E
      const iphoneModelRegex = /\b(1[1-9][a-z]?|se|x|xr|xs|mini|plus|max|pro|6s?|7|8|16e)\b/;
      
      // Check if it looks like an iPhone model
      if (iphoneModelRegex.test(combined)) {
          // Double check it doesn't have strong Mac signals that were missed
          if (!combined.includes('ssd') && !combined.includes('tb') && !combined.includes('m1') && !combined.includes('m2') && !combined.includes('m3')) {
               return DeviceType.iPhone;
          }
          // If it has GB storage (typical for phones) and matches model number or generic apple
          if (/\b\d{2,3}gb\b/.test(combined)) {
              return DeviceType.iPhone;
          }
      }

      return DeviceType.MacBook;
  }
  
  // Default fallback
  return DeviceType.Notebook;
};

export const processFiles = async (
  inventoryFile: File | null,
  intuneFile: File | null,
  jamfFile: File | null,
  defenderFile: File | null
): Promise<Asset[]> => {
  if (!inventoryFile) throw new Error("Inventory file is required");

  // 1. Parse Inventory (Source of Truth)
  const rawInventory = await readFile(inventoryFile);
  
  // Map raw rows to Asset objects
  const assets: Asset[] = rawInventory.map((row, index) => {
    // Specific Turkish mappings requested by user
    let assetTag = getValue(row, ['referans numarası', 'referans', 'asset tag', 'demirbaş no']);
    const statusDesc = getValue(row, ['durum açıklama', 'durum açıklam', 'durum']);
    const brand = getValue(row, ['marka', 'brand', 'üretici']);
    const model = getValue(row, ['model', 'model adı', 'ürün', 'ürün adı']);
    const serial = getValue(row, ['seri numarası', 'seri', 'serial number', 'serial']);
    
    // New User Fields with expanded search terms
    let userName = getValue(row, ['kullanıcı adı', 'kullanıcı', 'username', 'sicil', 'sicil no']);
    const fullName = getValue(row, ['tam isim', 'isim', 'ad soyad', 'adı soyadı', 'personel adı', 'fullname']);
    
    // Extract a generic type/category column if it exists, to help classification
    const rawCategory = getValue(row, ['tip', 'tür', 'cins', 'kategori', 'category', 'type', 'device type']);
    
    // User ID Logic: Add leading 0 if starts with 248 or 969
    if (userName) {
       if (userName.startsWith('248') || userName.startsWith('969')) {
           userName = '0' + userName;
       }
    }

    // Determine Type first to apply Formatting Logic
    // NOW PASSING statusDesc to help identify iPhones labeled in the Status column
    const type = determineType(brand, model, rawCategory, statusDesc);

    // --- DEVICE COLUMN FORMATTING LOGIC ---
    
    // 1. MacBook: Device = KSN + Serial Number
    if (type === DeviceType.MacBook && serial) {
        assetTag = `KSN${serial}`;
    }
    // 2. iPhone/iPad: Device = Serial Number ONLY (No KSN)
    else if ((type === DeviceType.iPhone || type === DeviceType.iPad) && serial) {
        assetTag = serial;
    }
    // 3. Notebook: If Reference is missing or UNK, use KSN + Serial
    else if (type === DeviceType.Notebook && (!assetTag || assetTag.trim() === '' || assetTag.toUpperCase().startsWith('UNK'))) {
        if (serial) {
             assetTag = `KSN${serial}`;
        }
    }
    // 4. Desktop/Notebook: Device = KSN + Reference Number (if numeric)
    else if ((type === DeviceType.Notebook || type === DeviceType.Desktop) && assetTag) {
        // Check if string contains only digits (ignoring whitespace)
        if (/^\d+$/.test(assetTag.trim())) {
            assetTag = `KSN${assetTag.trim()}`;
        }
    }

    // Fallback for generic display if needed
    const assignedUser = fullName || userName || 'Unassigned';

    // "Demirbaş Yaşı" column contains the Date
    let date = getValue(row, ['demirbaş yaşı', 'tarih', 'purchase date']);
    if (!date) date = new Date().toISOString();
    
    // Calculate Age in Days
    const purchaseDateObj = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - purchaseDateObj.getTime());
    const assetAgeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Hostname might not be in the specific columns requested, but is critical for matching.
    // We try to find it, or default to Asset Tag if missing.
    const hostname = getValue(row, ['hostname', 'device name', 'bilgisayar adı']) || assetTag || `Unknown-${index}`;

    return {
      id: `asset-${index}`,
      assetTag: assetTag || `UNK-${index}`,
      statusDescription: statusDesc,
      brand: brand,
      model: model,
      hostname: hostname,
      serialNumber: serial || `SN-${index}`,
      type: type, // Use calculated type
      purchaseDate: date,
      assetAgeDays: assetAgeDays,
      userName: userName,
      fullName: fullName,
      assignedUser: assignedUser,
      compliance: {
        inIntune: false,
        inJamf: false,
        inDefender: false
      }
    };
  });

  // 2. Parse Intune (Management)
  // Map to bridge Serial -> Hostname (e.g. for matching KOCSISTEM names in Defender)
  const intuneSerialToHostMap = new Map<string, string>();
  let intuneDevices: Set<string> = new Set();
  
  if (intuneFile) {
    const rawIntune = await readFile(intuneFile);
    rawIntune.forEach(row => {
      const host = getValue(row, ['device name', 'name', 'hostname']);
      const serial = getValue(row, ['serial', 'serial number', 'imei']);
      
      if (host) {
          const h = host.toLowerCase();
          intuneDevices.add(h);
          if (serial) {
              intuneSerialToHostMap.set(serial.toLowerCase(), h);
          }
      }
      if (serial) intuneDevices.add(serial.toLowerCase());
    });
  }

  // 3. Parse Jamf
  let jamfDevices: Set<string> = new Set();
  if (jamfFile) {
    const rawJamf = await readFile(jamfFile);
    rawJamf.forEach(row => {
      const host = getValue(row, ['device name', 'name', 'hostname', 'bilgisayar adı']);
      const serial = getValue(row, ['serial', 'serial number', 'seri numarası', 'imei']);
      
      if (host) jamfDevices.add(host.toLowerCase());
      if (serial) jamfDevices.add(serial.toLowerCase());
    });
  }

  // 4. Parse Defender
  let defenderDevices: Set<string> = new Set();
  if (defenderFile) {
    const rawDefender = await readFile(defenderFile);
    rawDefender.forEach(row => {
      // Defender exports typically have "DeviceName" or "Device Name"
      const host = getValue(row, ['device name', 'devicename', 'hostname', 'bilgisayar adı']);
      const serial = getValue(row, ['serial', 'serial number', 'seri numarası']); 
      // Check for explicit user column in Defender if available (isim_soyisim)
      const user = getValue(row, ['isim_soyisim', 'isim soyisim', 'user', 'username', 'kullanıcı']);
      
      if (host) defenderDevices.add(host.toLowerCase());
      if (serial) defenderDevices.add(serial.toLowerCase());
      if (user) defenderDevices.add(user.toLowerCase());
    });
  }

  // 5. Reconcile
  return assets.map(asset => {
    // Check Intune
    const inIntune = intuneFile 
      ? (intuneDevices.has(asset.hostname.toLowerCase()) || intuneDevices.has(asset.serialNumber.toLowerCase()))
      : false; 

    // Check Jamf (Matches against Hostname OR Serial Number)
    const inJamf = jamfFile
      ? (jamfDevices.has(asset.hostname.toLowerCase()) || jamfDevices.has(asset.serialNumber.toLowerCase()))
      : false;

    // Check Defender (Matches against Hostname OR Serial Number)
    let inDefender = defenderFile
      ? (defenderDevices.has(asset.hostname.toLowerCase()) || defenderDevices.has(asset.serialNumber.toLowerCase()))
      : false;

    // INTUNE BRIDGE LOGIC:
    // If not found directly in Defender, check if Intune has a record for this Serial.
    // If yes, grab the Hostname from Intune (e.g. KOCSISTEM-123) and check THAT against Defender.
    if (!inDefender && defenderFile && intuneFile) {
        const intuneHost = intuneSerialToHostMap.get(asset.serialNumber.toLowerCase());
        if (intuneHost) {
             if (defenderDevices.has(intuneHost)) {
                 inDefender = true;
             }
        }
    }

    // SMART MATCH: iOS User Name Matching for Defender
    // If not found by Serial/Hostname, try matching by User Name format: "FirstMiddle_Last" pattern
    // Example: Inventory "Onat Cem Yanik" -> Defender "onatcem_yanik" (column) or "onatcem_yanik_iPad" (device name)
    if (!inDefender && defenderFile && (asset.type === DeviceType.iPhone || asset.type === DeviceType.iPad) && asset.fullName) {
        const normalizedUser = formatNameForDefender(asset.fullName); // e.g. "onatcem_yanik"
        
        // 1. Check if the normalized name exists directly (e.g. matched 'isim_soyisim' column)
        if (defenderDevices.has(normalizedUser)) {
            inDefender = true;
        } 
        // 2. Fuzzy match: check if it's part of a device name string (e.g. "erdinc_zaman_iPad")
        else {
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
        inJamf,
        inDefender,
        lastSync: new Date().toISOString()
      }
    };
  });
};
