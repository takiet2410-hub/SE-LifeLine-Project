/**
 * Utility to generate a formatted Travel Pass / E-Ticket Image on HTML5 Canvas
 */

export interface ETicketPassData {
  ticketCode: string;
  donorName?: string;
  bloodType?: string;
  campaignName: string;
  locationAddress?: string;
  date: string;
  timeSlot: string;
  qrCodeUrl?: string;
}

export const generateETicketPassImage = async (data: ETicketPassData): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const width = 1000;
  const height = 560;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not supported');

  // 1. Background Card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border & shadow effect
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, width, height);

  // 2. Header Banner (Gradient Crimson)
  const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
  headerGradient.addColorStop(0, '#be123c');
  headerGradient.addColorStop(1, '#881337');
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, width, 100);

  // Header Brand & Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('🩸 LifeLine', 40, 60);

  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('DONATION E-TICKET PASS / THẺ HẸN HIẾN MÁU', width - 40, 60);
  ctx.textAlign = 'left';

  // 3. Campaign & Location Section
  ctx.fillStyle = '#be123c';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('CHIẾN DỊCH HIẾN MÁU / CAMPAIGN', 40, 140);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  
  // Truncate long campaign names cleanly if needed
  let campaignNameText = data.campaignName || 'Chiến Dịch Hiến Máu Nhân Đạo LifeLine';
  if (campaignNameText.length > 45) {
    campaignNameText = campaignNameText.substring(0, 42) + '...';
  }
  ctx.fillText(campaignNameText, 40, 172);

  if (data.locationAddress) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(data.locationAddress, 40, 198);
  }

  // 4. Details Grid
  // Column 1: Date
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('NGÀY HIẾN MÁU / DATE', 40, 245);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(data.date, 40, 275);

  // Column 2: Time Slot
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('KHUNG GIỜ / TIME SLOT', 340, 245);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(data.timeSlot, 340, 275);

  // Row 2: Donor Info
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('NGƯỜI HIẾN MÁU / DONOR NAME', 40, 325);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(data.donorName || 'Người hiến máu LifeLine', 40, 355);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('NHÓM MÁU / BLOOD TYPE', 340, 325);
  ctx.fillStyle = '#be123c';
  ctx.font = 'bold 22px sans-serif';
  const bloodTypeText =
    data.bloodType &&
    data.bloodType !== 'Unknown' &&
    data.bloodType !== 'Chưa rõ' &&
    data.bloodType !== 'Chưa cập nhật'
      ? data.bloodType
      : 'Chưa cập nhật';
  ctx.fillText(bloodTypeText, 340, 355);

  // 5. Ticket Code Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, 400, 560, 60);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 400, 560, 60);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('PASS CODE:', 55, 436);

  ctx.fillStyle = '#be123c';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(data.ticketCode || 'TK-LIFELINE-PASS', 160, 437);

  // 6. Perforated Divider Line (Pass Stub)
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(640, 100);
  ctx.lineTo(640, height - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // 7. Right Side: Ticket Stub & QR Code
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QUÉT MÃ CHECK-IN', 820, 150);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('SCAN AT RECEPTION', 820, 170);

  // Draw QR Code Image if present
  if (data.qrCodeUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = data.qrCodeUrl!;
      });
      // QR Container Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(710, 190, 220, 220);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(710, 190, 220, 220);
      
      ctx.drawImage(img, 725, 205, 190, 190);
    } catch (e) {
      console.warn('Could not load QR code image for pass:', e);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(710, 190, 220, 220);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText('[ Mã QR ]', 820, 300);
    }
  }

  ctx.fillStyle = '#475569';
  ctx.font = '13px sans-serif';
  ctx.fillText('Vui lòng mang theo CCCD gốc', 820, 440);
  ctx.fillText('khi đến điểm hiến máu', 820, 460);

  // 8. Footer Note
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LifeLine Voluntary Blood Donation Platform • Nền tảng Hiến Máu Tự Nguyện Quốc Gia', 40, 525);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate pass blob'));
    }, 'image/png');
  });
};
