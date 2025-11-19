
import React, { useState, useEffect, useRef } from 'react';
import { Asset, DeviceType, DashboardFilterType } from '../types';
import { StatusBadge } from './StatusBadge';
import { Search, Filter, Monitor, Laptop, Smartphone, Cpu, Tag, AlertCircle, PcCase, Tablet, XCircle, Calendar, ChevronDown, Check, User } from 'lucide-react';

interface InventoryTableProps {
  data: Asset[];
  dashboardFilter: DashboardFilterType;
  onClearDashboardFilter: () => void;
  deviceFilter: string;
  onDeviceFilterChange: (type: string) => void;
}

interface ColumnFilters {
  status?: string;
  brand?: string;
  model?: string;
  assignedUser?: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  data, 
  dashboardFilter, 
  onClearDashboardFilter,
  deviceFilter,
  onDeviceFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Close dropdowns when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset internal filters if dashboard filter changes (optional, but good UX)
  useEffect(() => {
    if (dashboardFilter !== 'ALL') {
       // Keep column filters or reset? Let's keep them for power users.
    }
  }, [dashboardFilter]);

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case DeviceType.Desktop: 
        return <PcCase className="w-5 h-5 text-slate-600" />;
      case DeviceType.Notebook: 
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case DeviceType.MacBook: 
        return <Laptop className="w-5 h-5 text-slate-900" />;
      case DeviceType.iPhone: 
        return <Smartphone className="w-5 h-5 text-sky-600" />;
      case DeviceType.iPad: 
        return <Tablet className="w-5 h-5 text-indigo-600" />;
      case DeviceType.Monitor: 
        return <Monitor className="w-5 h-5 text-slate-500" />;
      default: 
        return <Cpu className="w-5 h-5 text-slate-400" />;
    }
  };

  // --- Filtering Logic ---
  const filteredData = data.filter(asset => {
    const term = searchTerm.toLowerCase();
    const isMac = asset.type === DeviceType.MacBook;
    const isComputer = asset.type === DeviceType.MacBook || asset.type === DeviceType.Desktop || asset.type === DeviceType.Notebook;
    const isMobile = asset.type === DeviceType.iPhone || asset.type === DeviceType.iPad;
    
    // 1. Dashboard Filter Logic (Pre-existing)
    if (dashboardFilter === 'COMPLIANT') {
      if (isMac) {
        if (!asset.compliance?.inJamf || !asset.compliance?.inDefender) return false;
      } else if (isComputer || isMobile) {
        if (!asset.compliance?.inIntune || !asset.compliance?.inDefender) return false;
      }
    } else if (dashboardFilter === 'MISSING_INTUNE') {
      if (isMac) return false;
      if (asset.compliance?.inIntune) return false;
    } else if (dashboardFilter === 'MISSING_JAMF') {
      if (asset.type !== DeviceType.MacBook) return false; 
      if (asset.compliance?.inJamf) return false;
    } else if (dashboardFilter === 'MISSING_DEFENDER') {
      const allowedTypes = [DeviceType.MacBook, DeviceType.Desktop, DeviceType.Notebook, DeviceType.iPhone, DeviceType.iPad];
      if (!allowedTypes.includes(asset.type)) return false;
      if (asset.compliance?.inDefender) return false;
    }

    // 2. Device Category Filter (Pre-existing)
    if (deviceFilter !== 'All') {
        if (deviceFilter === DeviceType.iPhone) {
             if (asset.type !== DeviceType.iPhone && asset.type !== DeviceType.iPad) return false;
        } else {
             if (asset.type !== deviceFilter) return false;
        }
    }

    // 3. Column Specific Filters (NEW)
    if (columnFilters.status && asset.statusDescription !== columnFilters.status) return false;
    if (columnFilters.brand && asset.brand !== columnFilters.brand) return false;
    if (columnFilters.model && asset.model !== columnFilters.model) return false;
    
    // User Filter Logic: Match against the primary displayed name
    if (columnFilters.assignedUser) {
      const displayUser = asset.fullName || asset.userName || asset.assignedUser || 'Unassigned';
      if (displayUser !== columnFilters.assignedUser) return false;
    }

    // 4. Text Search (Pre-existing)
    if (term) {
      const matchesSearch = 
        asset.hostname.toLowerCase().includes(term) ||
        asset.assetTag.toLowerCase().includes(term) ||
        asset.serialNumber.toLowerCase().includes(term) ||
        (asset.fullName && asset.fullName.toLowerCase().includes(term)) ||
        (asset.userName && asset.userName.toLowerCase().includes(term)) ||
        asset.assignedUser.toLowerCase().includes(term) ||
        (asset.brand && asset.brand.toLowerCase().includes(term));
      
      if (!matchesSearch) return false;
    }

    return true;
  });

  // --- Helpers for Dropdowns ---
  const getUniqueValues = (key: keyof Asset) => {
    const values = new Set<string>();
    data.forEach(item => {
       // Apply Device Filter basic logic
       let typeMatch = true;
       if (deviceFilter !== 'All') {
          if (deviceFilter === DeviceType.iPhone) typeMatch = (item.type === DeviceType.iPhone || item.type === DeviceType.iPad);
          else typeMatch = item.type === deviceFilter;
       }
       
       if (typeMatch && item[key]) {
         values.add(String(item[key]));
       }
    });
    return Array.from(values).sort();
  };

  // Special helper for Users because the data is spread across 3 fields
  const getUniqueUsers = () => {
    const values = new Set<string>();
    data.forEach(item => {
       let typeMatch = true;
       if (deviceFilter !== 'All') {
          if (deviceFilter === DeviceType.iPhone) typeMatch = (item.type === DeviceType.iPhone || item.type === DeviceType.iPad);
          else typeMatch = item.type === deviceFilter;
       }
       
       if (typeMatch) {
          // Priority order must match the table cell rendering
          const displayUser = item.fullName || item.userName || item.assignedUser;
          if (displayUser) values.add(displayUser);
       }
    });
    return Array.from(values).sort();
  };

  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  const applyColumnFilter = (key: keyof ColumnFilters, value: string | undefined) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
    setActiveDropdown(null);
  };

  const getFilterLabel = () => {
    switch (dashboardFilter) {
      case 'COMPLIANT': return 'Showing: Fully Compliant Devices';
      case 'MISSING_INTUNE': return 'Showing: Devices Missing from Intune';
      case 'MISSING_JAMF': return 'Showing: MacBooks Missing from Jamf';
      case 'MISSING_DEFENDER': return 'Showing: Devices Missing from Defender';
      default: return null;
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden pb-12">
      {/* Active Dashboard Filter Banner */}
      {dashboardFilter !== 'ALL' && (
        <div className="bg-blue-50/50 px-5 py-3 border-b border-blue-100 flex items-center justify-between">
          <div className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {getFilterLabel()}
          </div>
          <button 
            onClick={onClearDashboardFilter}
            className="text-xs bg-white text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1 transition-colors"
          >
            <XCircle className="w-3 h-3" />
            Clear Filter
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
        <h3 className="text-lg font-bold text-slate-800">Inventory Database</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search referans, serial, user..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 bg-white text-slate-800 placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-slate-800 font-medium"
              value={deviceFilter}
              onChange={(e) => onDeviceFilterChange(e.target.value)}
            >
              <option value="All">All Devices</option>
              <option value={DeviceType.Desktop}>Desktop</option>
              <option value={DeviceType.Notebook}>Notebook</option>
              <option value={DeviceType.MacBook}>MacBook</option>
              <option value={DeviceType.iPhone}>iPhone / iPad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-visible" ref={dropdownRef}>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {/* Column: Device / Status */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-64 relative">
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleDropdown('status')}>
                  <span>Device<br/><span className="text-slate-400 font-normal lowercase">(referans / durum)</span></span>
                  <div className={`p-1 rounded hover:bg-slate-200 transition-colors ${columnFilters.status ? 'bg-blue-100 text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`}>
                     <Filter className="w-3 h-3" />
                  </div>
                </div>
                {/* Status Dropdown */}
                {activeDropdown === 'status' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-64 overflow-y-auto">
                    <div className="p-2">
                      <div 
                         className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${!columnFilters.status ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                         onClick={() => applyColumnFilter('status', undefined)}
                      >
                        All Statuses
                        {!columnFilters.status && <Check className="w-3 h-3" />}
                      </div>
                      <div className="my-1 border-t border-slate-100"></div>
                      {getUniqueValues('statusDescription').map(status => (
                        <div 
                          key={status}
                          className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${columnFilters.status === status ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                          onClick={() => applyColumnFilter('status', status)}
                        >
                          {status}
                          {columnFilters.status === status && <Check className="w-3 h-3" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </th>

              {/* Column: Marka / Model */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider relative">
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleDropdown('brandModel')}>
                  <span>Marka / Model</span>
                  <div className={`p-1 rounded hover:bg-slate-200 transition-colors ${(columnFilters.brand || columnFilters.model) ? 'bg-blue-100 text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`}>
                     <Filter className="w-3 h-3" />
                  </div>
                </div>
                 {/* Brand/Model Dropdown */}
                 {activeDropdown === 'brandModel' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Marka (Brand)</div>
                      <div 
                         className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${!columnFilters.brand ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                         onClick={() => applyColumnFilter('brand', undefined)}
                      >
                        All Brands
                        {!columnFilters.brand && <Check className="w-3 h-3" />}
                      </div>
                      {getUniqueValues('brand').map(brand => (
                        <div 
                          key={brand}
                          className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${columnFilters.brand === brand ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                          onClick={() => applyColumnFilter('brand', brand)}
                        >
                          {brand}
                          {columnFilters.brand === brand && <Check className="w-3 h-3" />}
                        </div>
                      ))}
                      
                      <div className="my-2 border-t border-slate-100"></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Model</div>
                      <div 
                         className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${!columnFilters.model ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                         onClick={() => applyColumnFilter('model', undefined)}
                      >
                        All Models
                        {!columnFilters.model && <Check className="w-3 h-3" />}
                      </div>
                      {getUniqueValues('model').map(model => (
                        <div 
                          key={model}
                          className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${columnFilters.model === model ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                          onClick={() => applyColumnFilter('model', model)}
                        >
                          {model}
                          {columnFilters.model === model && <Check className="w-3 h-3" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </th>

              {/* Column: Details (User Filter) */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider relative">
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleDropdown('user')}>
                  <span>Details<br/><span className="text-slate-400 font-normal lowercase">(serial / user)</span></span>
                  <div className={`p-1 rounded hover:bg-slate-200 transition-colors ${columnFilters.assignedUser ? 'bg-blue-100 text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`}>
                     <Filter className="w-3 h-3" />
                  </div>
                </div>
                {/* User Dropdown */}
                {activeDropdown === 'user' && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                      <div className="px-2 pb-2 pt-1 border-b border-slate-100 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Assigned User</span>
                      </div>
                      <div 
                         className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${!columnFilters.assignedUser ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                         onClick={() => applyColumnFilter('assignedUser', undefined)}
                      >
                        All Users
                        {!columnFilters.assignedUser && <Check className="w-3 h-3" />}
                      </div>
                      {getUniqueUsers().map(user => (
                        <div 
                          key={user}
                          className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${columnFilters.assignedUser === user ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                          onClick={() => applyColumnFilter('assignedUser', user)}
                        >
                          <div className="flex items-center gap-2 truncate">
                             <User className="w-3 h-3 text-slate-400" />
                             <span className="truncate">{user}</span>
                          </div>
                          {columnFilters.assignedUser === user && <Check className="w-3 h-3 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </th>

              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Intune
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Jamf
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Defender
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredData.length > 0 ? (
              filteredData.map((asset) => {
                 const isMonitor = asset.type === DeviceType.Monitor;
                 const isMac = asset.type === DeviceType.MacBook;
                 const isComputer = asset.type === DeviceType.MacBook || asset.type === DeviceType.Desktop || asset.type === DeviceType.Notebook;
                 const isMobile = asset.type === DeviceType.iPhone || asset.type === DeviceType.iPad;

                 // Highlight row slightly if filtering for compliance
                 const rowClass = (dashboardFilter === 'COMPLIANT') 
                    ? "bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors" 
                    : "hover:bg-slate-50 transition-colors";

                 return (
                  <tr key={asset.id} className={rowClass}>
                    {/* Device (Ref / Status) */}
                    <td className="px-6 py-4 relative">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center mt-1">
                          {getDeviceIcon(asset.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {asset.assetTag}
                          </div>
                          {asset.statusDescription && (
                             <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                               <AlertCircle className="w-3 h-3" />
                               {asset.statusDescription}
                             </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Brand / Model */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{asset.brand || '-'}</div>
                      <div className="text-xs text-slate-500">{asset.model || '-'}</div>
                      {asset.assetAgeDays !== undefined && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-slate-500 bg-slate-100 w-fit px-2 py-0.5 rounded">
                           <Calendar className="w-3 h-3 text-slate-400" />
                           {asset.assetAgeDays} days old
                        </div>
                      )}
                    </td>

                    {/* Details (Serial / User Name / Full Name) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-800 tracking-wide mb-1">{asset.serialNumber}</div>
                      <div className="flex flex-col gap-1">
                        {asset.userName && (
                          <div className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-fit">
                            {asset.userName}
                          </div>
                        )}
                        {asset.fullName && (
                          <div className="text-sm text-slate-700 font-medium">
                            {asset.fullName}
                          </div>
                        )}
                        {/* Fallback if individual fields missing but assignedUser present */}
                        {!asset.userName && !asset.fullName && (
                          <div className="text-xs text-slate-500">{asset.assignedUser}</div>
                        )}
                      </div>
                    </td>

                    {/* Cloud Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!isMonitor && !isMac ? (
                        <StatusBadge 
                          present={asset.compliance?.inIntune || false} 
                          label="Intune" 
                          type="intune" 
                        />
                      ) : <span className="text-xs text-slate-300 font-medium px-2 text-center block w-fit">N/A</span>}
                    </td>
                    
                    {/* Jamf Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                       {!isMonitor && isMac ? (
                        <StatusBadge 
                          present={asset.compliance?.inJamf || false} 
                          label="Jamf" 
                          type="jamf" 
                        />
                       ) : <span className="text-xs text-slate-300 font-medium px-2 text-center block w-fit">N/A</span>}
                    </td>

                    {/* Defender Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                       {isComputer || isMobile ? (
                        <StatusBadge 
                          present={asset.compliance?.inDefender || false} 
                          label="Defender" 
                          type="defender" 
                        />
                       ) : <span className="text-xs text-slate-300 font-medium px-2 text-center block w-fit">N/A</span>}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-slate-200" />
                    <p>No devices found matching your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
         <span>Showing {filteredData.length} records</span>
         <span>Last Sync: {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
};
