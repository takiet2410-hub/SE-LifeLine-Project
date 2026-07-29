import { calculateDonorLevel } from '../services/gamification.service';

describe('GamificationService Unit Tests', () => {
  describe('calculateDonorLevel', () => {
    it('should return level 1 for XP < 200', () => {
      expect(calculateDonorLevel(0)).toBe(1);
      expect(calculateDonorLevel(150)).toBe(1);
    });

    it('should return level 2 for XP between 200 and 499', () => {
      expect(calculateDonorLevel(200)).toBe(2);
      expect(calculateDonorLevel(450)).toBe(2);
    });

    it('should return level 3 for XP between 500 and 999', () => {
      expect(calculateDonorLevel(500)).toBe(3);
      expect(calculateDonorLevel(750)).toBe(3);
    });

    it('should return level 4 for XP between 1000 and 1999', () => {
      expect(calculateDonorLevel(1000)).toBe(4);
      expect(calculateDonorLevel(1500)).toBe(4);
    });

    it('should return level 5 for XP >= 2000', () => {
      expect(calculateDonorLevel(2000)).toBe(5);
      expect(calculateDonorLevel(5000)).toBe(5);
    });
  });
});
