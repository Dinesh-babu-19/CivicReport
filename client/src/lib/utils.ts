import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats location data for Andhra Pradesh in the format: village/city/town, District, Andhra Pradesh
 */
export function formatAndhraPradeshLocation(geocodingData: any): string {
  if (!geocodingData || !geocodingData.localityInfo) {
    return 'Location not available';
  }

  const { localityInfo } = geocodingData;
  
  // Extract different administrative levels
  const administrative = localityInfo.administrative || [];
  const informative = localityInfo.informative || [];
  
  // Try to find village/city/town name
  let localityName = '';
  let districtName = '';
  
  // Look for village, city, or town in informative data first
  if (informative.length > 0) {
    const locality = informative.find((item: any) => 
      item.name && (
        item.name.toLowerCase().includes('village') ||
        item.name.toLowerCase().includes('city') ||
        item.name.toLowerCase().includes('town') ||
        item.name.toLowerCase().includes('municipality') ||
        item.name.toLowerCase().includes('panchayat')
      )
    );
    if (locality) {
      localityName = locality.name.replace(/\s+(village|city|town|municipality|panchayat)/i, '').trim();
    }
  }
  
  // If no locality found in informative, try administrative levels
  if (!localityName && administrative.length > 0) {
    // Look for the most specific locality (usually the first few levels, excluding country)
    for (let i = 0; i < Math.min(3, administrative.length); i++) {
      const item = administrative[i];
      if (item && item.name) {
        const name = item.name.toLowerCase();
        // Skip if it's a country, state, or district
        if (!name.includes('india') && 
            !name.includes('andhra pradesh') && 
            !name.includes('district') &&
            !name.includes('state')) {
          localityName = item.name.trim();
          break;
        }
      }
    }
  }
  
  // Find district name - look for items containing 'district' or get from administrative levels
  const district = administrative.find((item: any) => 
    item.name && item.name.toLowerCase().includes('district')
  );
  if (district) {
    districtName = district.name.replace(/\s+district/i, '').trim();
  } else {
    // Try to find district from administrative levels (usually level 1 or 2)
    for (let i = 1; i < Math.min(3, administrative.length); i++) {
      const item = administrative[i];
      if (item && item.name) {
        const name = item.name.toLowerCase();
        // Skip if it's a country or state
        if (!name.includes('india') && 
            !name.includes('andhra pradesh') &&
            !name.includes('state')) {
          districtName = item.name.trim();
          break;
        }
      }
    }
  }
  
  // Clean up names - remove any trailing commas or extra spaces
  localityName = localityName.replace(/[,\s]+$/, '').trim();
  districtName = districtName.replace(/[,\s]+$/, '').trim();
  
  // Remove any country references
  localityName = localityName.replace(/\s*,?\s*india\s*,?/i, '').trim();
  districtName = districtName.replace(/\s*,?\s*india\s*,?/i, '').trim();
  
  // Format the final string
  if (localityName && districtName) {
    return `${localityName}, ${districtName}, Andhra Pradesh`;
  } else if (localityName) {
    return `${localityName}, Andhra Pradesh`;
  } else if (districtName) {
    return `${districtName}, Andhra Pradesh`;
  } else {
    // Fallback - try to get any meaningful location data
    const fallbackName = administrative.find((item: any) => 
      item && item.name && 
      !item.name.toLowerCase().includes('india') &&
      !item.name.toLowerCase().includes('andhra pradesh')
    )?.name;
    
    if (fallbackName) {
      return `${fallbackName.trim()}, Andhra Pradesh`;
    }
    
    return 'Andhra Pradesh, India';
  }
}
