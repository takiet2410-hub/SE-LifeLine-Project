/**
 * Shared Geocoding Utility for LifeLine
 * Converts Vietnamese addresses (Street, Ward, District, Province) into [lng, lat] G eoJSON coordinates.
 */
export async function geocodeAddress(addressStr?: string): Promise<[number, number] | null> {
  if (!addressStr || typeof addressStr !== 'string') return null;
  const cleanAddr = addressStr.trim();
  if (!cleanAddr || cleanAddr === 'N/A') return null;

  let queryStr = cleanAddr;
  if (
    !queryStr.toLowerCase().includes('hồ chí minh') &&
    !queryStr.toLowerCase().includes('hcm') &&
    !queryStr.toLowerCase().includes('tphcm') &&
    !queryStr.toLowerCase().includes('hà nội') &&
    !queryStr.toLowerCase().includes('đà nẵng') &&
    !queryStr.toLowerCase().includes('cần thơ')
  ) {
    queryStr += ', TP. Hồ Chí Minh, Việt Nam';
  }

  // 1. Try Nominatim OpenStreetMap API with short timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryStr)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LifeLine-BloodDonationApp/1.0 (contact@lifeline.org.vn)',
        'Accept-Language': 'vi,en;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as any[];
      if (data && data.length > 0 && data[0].lon && data[0].lat) {
        const lng = parseFloat(data[0].lon);
        const lat = parseFloat(data[0].lat);
        if (!isNaN(lng) && !isNaN(lat) && lng > 100 && lat > 8 && lat < 24) {
          return [lng, lat];
        }
      }
    }
  } catch (err) {
    // Network or timeout, fallback to heuristic dictionary
  }

  // 2. Fallback Heuristic Dictionary for Vietnam (TP.HCM, Hanoi, Da Nang, etc.)
  const lower = cleanAddr.toLowerCase();

  // TP.HCM Districts
  if (lower.includes('quận 1') || lower.includes('q1') || lower.includes('bến nghé') || lower.includes('bến thành'))
    return [106.69928, 10.780561];
  if (lower.includes('quận 3') || lower.includes('q3') || lower.includes('võ thị sáu'))
    return [106.68361, 10.763428];
  if (lower.includes('quận 4') || lower.includes('q4'))
    return [106.70258, 10.75782];
  if (lower.includes('quận 5') || lower.includes('q5') || lower.includes('chợ lớn') || lower.includes('nguyễn chí thanh'))
    return [106.660172, 10.755498];
  if (lower.includes('quận 6') || lower.includes('q6'))
    return [106.63412, 10.74651];
  if (lower.includes('quận 7') || lower.includes('q7') || lower.includes('phú mỹ hưng') || lower.includes('tân phong'))
    return [106.72183, 10.73403];
  if (lower.includes('quận 8') || lower.includes('q8'))
    return [106.66315, 10.72408];
  if (lower.includes('quận 10') || lower.includes('q10') || lower.includes('lý thường kiệt') || lower.includes('3 tháng 2'))
    return [106.666133, 10.756247];
  if (lower.includes('quận 11') || lower.includes('q11') || lower.includes('đầm sen'))
    return [106.65082, 10.76297];
  if (lower.includes('quận 12') || lower.includes('q12') || lower.includes('an phú đông'))
    return [106.65583, 10.86715];
  if (lower.includes('tân bình') || lower.includes('hoàng văn thụ') || lower.includes('sân bay') || lower.includes('tân sơn nhất'))
    return [106.660812, 10.771945];
  if (lower.includes('tân phú') || lower.includes('trịnh đình trọng') || lower.includes('phú trung') || lower.includes('lũy bán bích'))
    return [106.62854, 10.79035];
  if (lower.includes('bình thạnh') || lower.includes('bạch đằng') || lower.includes('hàng xanh') || lower.includes('điện biên phủ'))
    return [106.69612, 10.80351];
  if (lower.includes('gò vấp') || lower.includes('quang trung') || lower.includes('nguyễn oanh'))
    return [106.67824, 10.81753];
  if (lower.includes('phú nhuận') || lower.includes('phan xích long') || lower.includes('nguyễn văn trỗi'))
    return [106.68041, 10.79919];
  if (lower.includes('bình tân') || lower.includes('tên lửa') || lower.includes('an lạc'))
    return [106.60623, 10.76542];
  if (lower.includes('thủ đức') || lower.includes('quận 2') || lower.includes('quận 9') || lower.includes('thảo điền') || lower.includes('hiệp phú'))
    return [106.75837, 10.84941];
  if (lower.includes('hóc môn')) return [106.59321, 10.88412];
  if (lower.includes('bình chánh')) return [106.59823, 10.69315];
  if (lower.includes('nhà bè')) return [106.73215, 10.68412];
  if (lower.includes('củ chi')) return [106.49512, 11.00642];
  if (lower.includes('cần giờ')) return [106.86412, 10.41245];

  // Other Major Cities
  if (lower.includes('hà nội') || lower.includes('hoàn kiếm') || lower.includes('ba đình') || lower.includes('đống đa') || lower.includes('cầu giấy'))
    return [105.854444, 21.028511];
  if (lower.includes('đà nẵng') || lower.includes('hải châu') || lower.includes('thanh khê') || lower.includes('sơn trà'))
    return [108.202167, 16.054407];
  if (lower.includes('cần thơ') || lower.includes('ninh kiều'))
    return [105.784485, 10.045162];
  if (lower.includes('hải phòng') || lower.includes('hồng bàng'))
    return [106.688084, 20.844912];
  if (lower.includes('bình dương') || lower.includes('thủ dầu một') || lower.includes('dĩ an') || lower.includes('thuận an'))
    return [106.65342, 10.98045];
  if (lower.includes('đồng nai') || lower.includes('biên hòa'))
    return [106.82412, 10.95214];

  // Default central HCM point
  return [106.660172, 10.762622];
}
