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
