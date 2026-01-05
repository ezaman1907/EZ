
import { Asset, DashboardStats, DeviceType } from '../types';

export const calculateDashboardStats = (
  inventory: Asset[], 
  cloudCounts: { intune: number; jamf: number; defender: number }
): DashboardStats => {
  const activeAssets = inventory; 

  // Total Assets includes everything (Stock, Department, Active, Exempt)
  const totalAssets = activeAssets.length;

  // STOCK LOGIC
  const stockItems = activeAssets.filter(a => a.isStock);
  const stockCount = stockItems.length;
  const riskyStockCount = stockItems.filter(a => a.compliance?.inIntune || a.compliance?.inJamf).length;

  // PRODUCTION UNIVERSE (The core group we measure compliance for)
  const productionUniverse = activeAssets.filter(a => {
      if (a.isStock) return false;
      if (a.isExempt) return false;
      if (a.isDepartment && a.userName && a.userName.startsWith('031')) return false;
      if (a.isDepartment && a.type === DeviceType.MacBook) return false;
      return true;
  });
  
  // COMPLIANCE LOGIC
  const compliantCount = productionUniverse.filter(a => {
    if (a.isExempt) return true;

    const isMac = a.type === DeviceType.MacBook;
    const isPC = a.type === DeviceType.Desktop || a.type === DeviceType.Notebook;
    const isMobile = a.type === DeviceType.iPhone || a.type === DeviceType.iPad;
    
    const hasIntune = a.compliance?.inIntune;
    const hasJamf = a.compliance?.inJamf;
    const hasDefender = a.compliance?.inDefender;

    if (isMac) return hasJamf && hasDefender;
    if (isPC) return hasIntune && hasDefender;
    if (isMobile) return hasIntune;
    
    return hasIntune;
  }).length;

  const missingIntuneCount = productionUniverse.filter(a => 
      a.type !== DeviceType.MacBook && 
      !a.compliance?.inIntune
  ).length;

  const missingJamfCount = productionUniverse.filter(a => 
      a.type === DeviceType.MacBook && 
      !a.compliance?.inJamf
  ).length;
  
  const missingDefenderCount = productionUniverse.filter(a => {
    const allowedTypes = [
      DeviceType.MacBook,
      DeviceType.Desktop,
      DeviceType.Notebook
    ];
    return allowedTypes.includes(a.type) && !a.compliance?.inDefender;
  }).length;

  const productionCount = productionUniverse.length;
  const missingDefenderRatio = productionCount > 0 
    ? Number(((missingDefenderCount / productionCount) * 100).toFixed(2)) 
    : 0;

  const deviceCounts: Record<string, number> = {};
  activeAssets.forEach(item => {
    let typeKey: string = item.type;
    // UPDATED: "iOS Mobile" -> "iPhone & iPad"
    if (item.type === DeviceType.iPhone || item.type === DeviceType.iPad) {
        typeKey = 'iPhone & iPad';
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
    deviceTypeDistribution,
    missingDefenderRatio
  };
};
