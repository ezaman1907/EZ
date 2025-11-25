
import { Asset, DeviceType, ComplianceStatus } from '../types';

// Helper to generate random date within last 3 years
const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const calculateAge = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

const generateSerial = (prefix: string) => `${prefix}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

// 1. Mock "Internal Database" (SAP/Excel/SQL)
export const generateInternalInventory = (): Asset[] => {
  const assets: Asset[] = [];
  
  // Generate Windows Notebooks
  for (let i = 0; i < 15; i++) {
    const pDate = getRandomDate(new Date(2021, 0, 1), new Date());
    assets.push({
      id: `win-${i}`,
      assetTag: `KSN${10000 + i}`, // KSN + Reference
      statusDescription: 'Kullanımda',
      brand: 'Dell',
      model: 'Latitude 5420',
      hostname: `TR-WIN-${100 + i}`,
      serialNumber: generateSerial('PC'),
      type: DeviceType.Notebook,
      purchaseDate: pDate,
      assetAgeDays: calculateAge(pDate),
      userName: `0${5000+i}`,
      fullName: `Windows User ${i}`,
      assignedUser: `Windows User ${i}`,
      isStock: false
    });
  }

  // Generate Windows Desktops
  for (let i = 0; i < 5; i++) {
    const pDate = getRandomDate(new Date(2020, 0, 1), new Date());
    assets.push({
      id: `desk-${i}`,
      assetTag: `KSN${80000 + i}`, // KSN + Reference
      statusDescription: 'Kullanımda',
      brand: 'Dell',
      model: 'OptiPlex 7090',
      hostname: `TR-DSK-${100 + i}`,
      serialNumber: generateSerial('DSK'),
      type: DeviceType.Desktop,
      purchaseDate: pDate,
      assetAgeDays: calculateAge(pDate),
      userName: `0${9000+i}`,
      fullName: `Desktop User ${i}`,
      assignedUser: `Desktop User ${i}`,
      isStock: false
    });
  }

  // Generate Macs (MacBook)
  for (let i = 0; i < 8; i++) {
    const serial = generateSerial('APL');
    const pDate = getRandomDate(new Date(2022, 0, 1), new Date());
    assets.push({
      id: `mac-${i}`,
      assetTag: `KSN${serial}`, // Updated: KSN + Serial
      statusDescription: 'Zimmetli',
      brand: 'Apple',
      model: 'MacBook Pro M1',
      hostname: `TR-MAC-${100 + i}`,
      serialNumber: serial,
      type: DeviceType.MacBook,
      purchaseDate: pDate,
      assetAgeDays: calculateAge(pDate),
      userName: `0${6000+i}`,
      fullName: `Mac User ${i}`,
      assignedUser: `Mac User ${i}`,
      isStock: false
    });
  }

  // Generate iPhones
  for (let i = 0; i < 10; i++) {
    const serial = generateSerial('IMEI');
    const pDate = getRandomDate(new Date(2023, 0, 1), new Date());
    assets.push({
      id: `ios-${i}`,
      assetTag: serial, // Updated: Only Serial
      statusDescription: 'Aktif',
      brand: 'Apple',
      model: 'iPhone 14',
      hostname: `iPhone-${100 + i}`,
      serialNumber: serial,
      type: DeviceType.iPhone,
      purchaseDate: pDate,
      assetAgeDays: calculateAge(pDate),
      userName: `0${7000+i}`,
      fullName: `Mobile User ${i}`,
      assignedUser: `Mobile User ${i}`,
      isStock: false
    });
  }

  // Generate Monitors
  for (let i = 0; i < 5; i++) {
    const pDate = getRandomDate(new Date(2020, 0, 1), new Date());
    assets.push({
      id: `mon-${i}`,
      assetTag: `AST-MON-${4000 + i}`,
      statusDescription: 'Depoda',
      brand: 'Samsung',
      model: 'S24R350',
      hostname: `N/A`,
      serialNumber: generateSerial('DISP'),
      type: DeviceType.Monitor,
      purchaseDate: pDate,
      assetAgeDays: calculateAge(pDate),
      userName: 'N/A',
      fullName: 'N/A',
      assignedUser: `N/A`,
      isStock: false
    });
  }

  // Generate STOCK Items (Some Safe, Some Risky)
  for (let i = 0; i < 10; i++) {
      const pDate = getRandomDate(new Date(2023, 0, 1), new Date());
      assets.push({
        id: `stock-${i}`,
        assetTag: `STK-${5000 + i}`,
        statusDescription: 'STOK',
        brand: 'Dell',
        model: 'Latitude 3520',
        hostname: `STK-LAP-${i}`,
        serialNumber: generateSerial('STK'),
        type: DeviceType.Notebook,
        purchaseDate: pDate,
        assetAgeDays: calculateAge(pDate),
        userName: '',
        fullName: '',
        assignedUser: 'IT STOCK',
        isStock: true
      });
  }

  return assets;
};

// 2. Mock "Live Cloud Status" (Intune/Jamf API response simulator)
export const simulateComplianceCheck = (inventory: Asset[]): Asset[] => {
  return inventory.map(asset => {
    const isMonitor = asset.type === DeviceType.Monitor;
    
    // Monitors are usually exempt
    if (isMonitor) {
      return {
        ...asset,
        compliance: {
          inIntune: true,
          inJamf: true,
          inDefender: true
        }
      };
    }

    const randomChance = Math.random();
    let inIntune = true;
    let inJamf = true;
    let inDefender = true;

    // Stock Logic for Mocking
    if (asset.isStock) {
        // 80% of stock is clean (not in cloud)
        if (randomChance < 0.8) {
            inIntune = false;
            inJamf = false;
            inDefender = false;
        } else {
            // 20% Risky Stock (Forgot to wipe or active)
            inIntune = true;
            inDefender = true;
        }
    } else {
        // Normal Device Logic
        // 10% chance missing from Intune
        if (randomChance < 0.10) inIntune = false;
        
        // 15% chance missing from Jamf (if it's a PC/Mac)
        if (randomChance < 0.15 && (asset.type === DeviceType.Desktop || asset.type === DeviceType.Notebook || asset.type === DeviceType.MacBook)) {
          inJamf = false;
        }

        // 12% chance missing from Defender (if it's a PC/Mac)
        if (randomChance < 0.12 && (asset.type === DeviceType.Desktop || asset.type === DeviceType.Notebook || asset.type === DeviceType.MacBook)) {
          inDefender = false;
        }

        if (!inIntune && Math.random() > 0.3) {
          inJamf = false;
        }
    }

    return {
      ...asset,
      compliance: {
        inIntune,
        inJamf,
        inDefender,
        lastSync: inIntune ? new Date().toISOString() : undefined
      }
    };
  });
};
