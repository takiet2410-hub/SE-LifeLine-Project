/**
 * Medical Blood Compatibility Helper (Red Blood Cells / Whole Blood)
 * Maps a recipient's blood type to all compatible donor blood types that can safely donate to them.
 */
export function getCompatibleDonorBloodTypes(recipientBloodType: string): string[] {
  if (!recipientBloodType) return [];
  const normalized = recipientBloodType.trim().toUpperCase();

  // Medical Red Blood Cell Compatibility Table (Donor -> Recipient)
  const map: Record<string, string[]> = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],

    // Generic ABO types (if Rh factor is omitted)
    'O': ['O-', 'O+', 'O'],
    'A': ['O-', 'O+', 'A-', 'A+', 'O', 'A'],
    'B': ['O-', 'O+', 'B-', 'B+', 'O', 'B'],
    'AB': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'O', 'A', 'B', 'AB'],
  };

  const compatibleList = map[normalized] || [recipientBloodType];
  return Array.from(new Set([recipientBloodType, ...compatibleList]));
}

/**
 * Check if a donor's blood type is compatible with a recipient's blood type
 */
export function isBloodTypeCompatible(donorBloodType: string, recipientBloodType: string): boolean {
  if (!donorBloodType || !recipientBloodType) return false;
  const compatibleTypes = getCompatibleDonorBloodTypes(recipientBloodType);
  return compatibleTypes.some(
    type => type.trim().toUpperCase() === donorBloodType.trim().toUpperCase()
  );
}

export interface BloodBagSendableEvaluation {
  isSendable: boolean;
  isExactMatch: boolean;
  isCompatible: boolean;
  isExpired: boolean;
  isAvailable: boolean;
  daysRemaining: number;
  reason?: string;
}

/**
 * Evaluates whether a blood bag can be sent to fulfill a given SOS blood type requirement.
 */
export function evaluateBloodBagForSOS(
  bag: {
    bloodType: string;
    status?: string;
    expiryDate: string | Date;
  },
  recipientBloodType: string
): BloodBagSendableEvaluation {
  const normDonorType = (bag.bloodType || '').trim().toUpperCase();
  const normRecipientType = (recipientBloodType || '').trim().toUpperCase();

  const isExactMatch = normDonorType === normRecipientType;
  const isCompatible = isBloodTypeCompatible(normDonorType, normRecipientType);

  const expiry = new Date(bag.expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = diffTime <= 0;

  const isAvailable = bag.status === 'Available' || !bag.status;

  let isSendable = true;
  let reason: string | undefined;

  if (!isAvailable) {
    isSendable = false;
    reason = `Trạng thái túi: ${bag.status || 'Không khả dụng'}`;
  } else if (isExpired) {
    isSendable = false;
    reason = 'Túi máu đã hết hạn sử dụng';
  } else if (!isCompatible) {
    isSendable = false;
    reason = `Không tương thích (${normDonorType} ➔ ${normRecipientType})`;
  }

  return {
    isSendable,
    isExactMatch,
    isCompatible,
    isExpired,
    isAvailable,
    daysRemaining,
    reason,
  };
}
