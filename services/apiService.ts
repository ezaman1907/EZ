
import { ApiConfig } from '../types';

// Helper for standard fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

/**
 * Fetches computers from Jamf Pro (via UAPI or Classic API)
 */
export const fetchJamfDevices = async (config: ApiConfig) => {
  if (!config.jamfToken || !config.jamfUrl) return [];

  // clean url
  const baseUrl = config.jamfUrl.replace(/\/$/, '');

  try {
    // Trying UAPI Inventory endpoint
    const response = await fetchWithTimeout(
      `${baseUrl}/uapi/v1/computers-inventory?page-size=1000&section=GENERAL&section=HARDWARE`, 
      {
        headers: {
          'Authorization': `Bearer ${config.jamfToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
        throw new Error(`Jamf API Hatası: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || []; 
  } catch (error) {
    console.error("Jamf Fetch Error:", error);
    throw new Error("Jamf verisi çekilemedi. URL ve Token'ı kontrol edin.");
  }
};
