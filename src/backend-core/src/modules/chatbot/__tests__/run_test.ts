import { FormatterService } from '../services/formatter.service';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { Campaign } from '../../campaign/models/campaign.model';

async function runVerification() {
  console.log('--- Testing FormatterService ---');

  // Test 1: Medical Disclaimer
  const text = 'Bạn nên ăn nhẹ trước khi hiến máu.';
  const formatted = FormatterService.appendMedicalDisclaimer(text);
  if (!formatted.includes('Lưu ý: Các tư vấn y tế')) {
    throw new Error('Test 1 Failed: Disclaimer missing');
  }
  console.log('✅ Test 1 Passed: Medical Disclaimer Appended');

  // Test 2: Double Disclaimer check
  const doubleFormatted = FormatterService.appendMedicalDisclaimer(formatted);
  const count = (doubleFormatted.match(/Lưu ý: Các tư vấn y tế/g) || []).length;
  if (count !== 1) {
    throw new Error('Test 2 Failed: Duplicate Disclaimer');
  }
  console.log('✅ Test 2 Passed: No Duplicate Disclaimer');

  // Test 3: Guest Context
  Campaign.find = (() => ({
    sort: () => ({
      limit: () => ({
        lean: async () => [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Chiến dịch Test',
            venue: 'Bệnh viện A',
            fullAddress: '123 Đường B',
            startDateTime: new Date('2026-08-15'),
            endDateTime: new Date('2026-08-20'),
            targetBloodGroups: ['O+'],
            capacity: 50,
            registeredCount: 10,
            status: 'Active',
          }
        ]
      })
    })
  })) as any;

  const guestContext = await FormatterService.prepareDonorContext(null);
  if (guestContext.isAuthenticated !== false) throw new Error('Test 3 Failed: isAuthenticated');
  if (guestContext.availableCampaigns.length !== 1) throw new Error('Test 3 Failed: campaign length');
  if ((guestContext as any).phone !== undefined) throw new Error('Test 3 Failed: phone revealed');
  console.log('✅ Test 3 Passed: Guest Context & Privacy');

  // Test 4: Authenticated Donor Context & 84-Day Math
  DonorProfile.findOne = (async () => ({
    userId: '507f1f77bcf86cd799439012',
    bloodType: 'AB+',
    donorLevel: 'Bạc',
    totalDonations: 3,
    lastDonationDate: new Date('2026-07-01'),
    phone: '0987654321',
    identityNumber: '987654321098',
    homeAddress: 'Private Street 1'
  })) as any;

  const authContext = await FormatterService.prepareDonorContext('507f1f77bcf86cd799439012');
  if (authContext.isAuthenticated !== true) throw new Error('Test 4 Failed: isAuthenticated');
  if (authContext.bloodType !== 'AB+') throw new Error('Test 4 Failed: bloodType');
  if (authContext.donorLevel !== 'Bạc') throw new Error('Test 4 Failed: donorLevel');
  if (authContext.totalDonations !== 3) throw new Error('Test 4 Failed: totalDonations');
  if (authContext.lastDonationDate !== '2026-07-01') throw new Error('Test 4 Failed: lastDonationDate');
  if (authContext.nextEligibleDate !== '2026-09-23') throw new Error(`Test 4 Failed: expected 2026-09-23 got ${authContext.nextEligibleDate}`);
  
  // Privacy Check
  if ((authContext as any).phone !== undefined) throw new Error('Test 4 Privacy Failed: phone');
  if ((authContext as any).identityNumber !== undefined) throw new Error('Test 4 Privacy Failed: identityNumber');
  if ((authContext as any).homeAddress !== undefined) throw new Error('Test 4 Privacy Failed: homeAddress');
  console.log('✅ Test 4 Passed: Authenticated Donor Context, 84-Day Eligibility & Privacy Filter');

  console.log('🎉 ALL FORMATTER SERVICE TESTS PASSED SUCCESSFULLY!');
}

runVerification().catch(err => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
