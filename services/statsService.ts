
import { Asset, DashboardStats, DeviceType } from '../types';

export const calculateDashboardStats = (
  inventory: Asset[], 
  cloudCounts: { intune: number; jamf: number; defender: number }
): DashboardStats => {
  const totalAssets = inventory.length;

  // STOCK LOGIC
  const stockItems = inventory.filter(a => a.isStock);
  const stockCount = stockItems.length;
  const riskyStockCount = stockItems.filter(a => a.compliance?.inIntune || a.compliance?.inJamf).length;

  // PRODUCTION UNIVERSE
  const productionUniverse = inventory.filter(a => !a.isStock);
  
  // COMPLIANCE LOGIC
  const compliantCount = productionUniverse.filter(a => {
    const isMac = a.type === DeviceType.MacBook;
    const isPC = a.type === DeviceType.Desktop || a.type === DeviceType.Notebook;
    const isMobile = a.type === DeviceType.iPhone || a.type === DeviceType.iPad;
    
    const hasIntune = a.compliance?.inIntune;
    const hasJamf = a.compliance?.inJamf;
    const hasDefender = a.compliance?.inDefender;

    if (isMac) return hasJamf && hasDefender;
    if (isPC) return hasIntune && hasDefender;
    if (isMobile) return hasIntune && hasDefender;
    return hasIntune;
  }).length;

  const missingIntuneCount = productionUniverse.filter(a => a.type !== DeviceType.MacBook && !a.compliance?.inIntune).length;
  const missingJamfCount = productionUniverse.filter(a => a.type === DeviceType.MacBook && !a.compliance?.inJamf).length;
  const missingDefenderCount = productionUniverse.filter(a => {
    const allowedTypes = [
      DeviceType.MacBook,
      DeviceType.Desktop,
      DeviceType.Notebook,
      DeviceType.iPhone,
      DeviceType.iPad
    ];
    return allowedTypes.includes(a.type) && !a.compliance?.inDefender;
  }).length;

  const deviceCounts: Record<string, number> = {};
  inventory.forEach(item => {
    let typeKey: string = item.type;
    if (item.type === DeviceType.iPhone || item.type === DeviceType.iPad) {
        typeKey = 'iOS Mobile';
    }
    deviceCounts[typeKey] = (deviceCounts[typeKey] || 0) + 1;
  });

  const deviceTypeDistribution = Object.keys(deviceCounts).map(key => ({
    name: key,
    value: deviceCounts[key]
  }));
  
  return {
    totalAssets,
    totalIntuneReportCount: cloudCounts.intune,
    totalJamfReportCount: cloudCounts.jamf,
    totalDefenderReportCount: cloudCounts.defender,
    compliantCount,
    missingIntuneCount,
    missingJamfCount,
    missingDefenderCount,
    stockCount,
    riskyStockCount,
    deviceTypeDistribution
  };
};
