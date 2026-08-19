import request from 'supertest';
import express from 'express';
import bookingRoutes from '../routes/booking.routes';
import { BookingService } from '../services/booking.service';

jest.mock('../../../shared/auth.middleware', () => ({
  authenticateJWT: (req: any, res: any, next: any) => {
    req.user = { _id: 'donor-1', role: 'Donor' };
    next();
  }
}));

jest.mock('../services/booking.service');

const app = express();
app.use(express.json());
app.use('/api/v1/bookings', bookingRoutes);

const validBookingPayload = {
  campaignId: 'c1',
  appointmentDate: '2026-08-10',
  timeSlot: '07:30-09:00',
  answers: {
    responses: [
      { questionId: '1', selectedOptions: ['Không'] },
      { questionId: '2', selectedOptions: ['Không'] },
      { questionId: '3', selectedOptions: ['Không'] },
      { questionId: '4', selectedOptions: ['Không'] },
      { questionId: '5', selectedOptions: ['Không'] },
      { questionId: '6', selectedOptions: ['Không'] },
      { questionId: '7', selectedOptions: ['Không'] },
      { questionId: '8', selectedOptions: ['Không'] }
    ]
  }
};

describe('Booking API Integration Tests (Full TC Coverage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/bookings/locations (TC_UC06_001 - TC_UC06_005)', () => {
    it('TC_UC06_001 & TC_UC06_003: should return 200 OK with locations array', async () => {
      (BookingService.searchLocations as jest.Mock).mockResolvedValue([
        { id: 'c1', name: 'Chiến dịch Bệnh viện Chợ Rẫy', lat: 10.7554, lng: 106.6653 }
      ]);
      
      const response = await request(app).get('/api/v1/bookings/locations?lat=10.7769&lng=106.7009&radius=15&bloodType=O+');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 'c1', name: 'Chiến dịch Bệnh viện Chợ Rẫy', lat: 10.7554, lng: 106.6653 }
      ]);
      expect(BookingService.searchLocations).toHaveBeenCalled();
    });

    it('TC_UC06_004: should return 200 OK with empty array when no location matches', async () => {
      (BookingService.searchLocations as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/v1/bookings/locations?radius=1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/v1/bookings/appointments (TC_UC07_001 - TC_UC07_014)', () => {
    it('TC_UC07_002: should create appointment successfully and return 201 Created', async () => {
      (BookingService.createAppointment as jest.Mock).mockResolvedValue({
        id: 'a1',
        status: 'Pending',
        appointmentDate: '2026-08-10',
        timeSlot: '07:30-09:00'
      });

      const response = await request(app)
        .post('/api/v1/bookings/appointments')
        .send(validBookingPayload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: 'a1',
        status: 'Pending',
        appointmentDate: '2026-08-10',
        timeSlot: '07:30-09:00'
      });
      expect(BookingService.createAppointment).toHaveBeenCalled();
    });

    it('TC_UC07_003: should return 403 Forbidden when donor is not eligible (84-day rule)', async () => {
      (BookingService.createAppointment as jest.Mock).mockRejectedValue(new Error('ELIGIBILITY_FAILED_84_DAYS'));

      const response = await request(app)
        .post('/api/v1/bookings/appointments')
        .send(validBookingPayload);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('ELIGIBILITY_FAILED_84_DAYS');
    });

    it('TC_UC07_004: should return 409 Conflict when donor has duplicate active appointment', async () => {
      (BookingService.createAppointment as jest.Mock).mockRejectedValue(new Error('DUPLICATE_APPOINTMENT'));

      const response = await request(app)
        .post('/api/v1/bookings/appointments')
        .send(validBookingPayload);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('DUPLICATE_APPOINTMENT');
    });

    it('TC_UC07_005: should return 409 Conflict when campaign is full', async () => {
      (BookingService.createAppointment as jest.Mock).mockRejectedValue(new Error('CAMPAIGN_FULL'));

      const response = await request(app)
        .post('/api/v1/bookings/appointments')
        .send(validBookingPayload);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('CAMPAIGN_FULL');
    });

    it('TC_UC07_011: should return 404 Not Found when campaign does not exist', async () => {
      (BookingService.createAppointment as jest.Mock).mockRejectedValue(new Error('NOT_FOUND_CAMPAIGN'));

      const response = await request(app)
        .post('/api/v1/bookings/appointments')
        .send(validBookingPayload);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('NOT_FOUND_CAMPAIGN');
    });
  });

  describe('GET /api/v1/bookings/appointments & /:id (TC_UC08_001 - TC_UC08_004)', () => {
    it('TC_UC08_001: should return 200 OK and appointment details by ID', async () => {
      (BookingService.getAppointmentById as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Pending' });

      const response = await request(app).get('/api/v1/bookings/appointments/a1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'a1', status: 'Pending' });
      expect(BookingService.getAppointmentById).toHaveBeenCalledWith('a1', 'donor-1');
    });

    it('TC_UC08_002: should return 200 OK with appointments history array', async () => {
      (BookingService.listAppointments as jest.Mock).mockResolvedValue([
        { id: 'a1', status: 'Pending' },
        { id: 'a2', status: 'Completed' }
      ]);

      const response = await request(app).get('/api/v1/bookings/appointments');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(BookingService.listAppointments).toHaveBeenCalledWith('donor-1');
    });

    it('TC_UC08_003: should return 404 Not Found when unauthorized access to another donor appointment', async () => {
      (BookingService.getAppointmentById as jest.Mock).mockRejectedValue(new Error('APPOINTMENT_NOT_FOUND'));

      const response = await request(app).get('/api/v1/bookings/appointments/other-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('APPOINTMENT_NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/bookings/appointments/:id/cancel (TC_UC09_001 - TC_UC09_005)', () => {
    it('TC_UC09_001: should cancel appointment successfully and return 200 OK', async () => {
      (BookingService.cancelAppointment as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Cancelled' });

      const response = await request(app)
        .patch('/api/v1/bookings/appointments/a1/cancel')
        .send({ reason: 'Sick' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'a1', status: 'Cancelled' });
      expect(BookingService.cancelAppointment).toHaveBeenCalledWith('a1', 'donor-1');
    });

    it('TC_UC09_003: should return 400 Bad Request when cancellation deadline passed (< 24h)', async () => {
      (BookingService.cancelAppointment as jest.Mock).mockRejectedValue(new Error('CANCELLATION_DEADLINE_PASSED'));

      const response = await request(app)
        .patch('/api/v1/bookings/appointments/a1/cancel')
        .send({ reason: 'Late cancel' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('CANCELLATION_DEADLINE_PASSED');
    });
  });

  describe('GET /api/v1/bookings/appointments/:id/e-ticket (TC_UC10_001 - TC_UC10_004)', () => {
    it('TC_UC10_001 & TC_UC10_003: should return eTicket object when confirmed', async () => {
      (BookingService.downloadETicket as jest.Mock).mockResolvedValue({
        id: 'e1',
        ticketCode: 'TK-123',
        qrPayloadSigned: 'SIGNED-TK-123'
      });

      const response = await request(app).get('/api/v1/bookings/appointments/a1/e-ticket');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'e1', ticketCode: 'TK-123', qrPayloadSigned: 'SIGNED-TK-123' });
      expect(BookingService.downloadETicket).toHaveBeenCalledWith('a1', 'donor-1');
    });

    it('TC_UC10_002: should return 400 Bad Request when appointment is still Pending', async () => {
      (BookingService.downloadETicket as jest.Mock).mockRejectedValue(new Error('ETICKET_NOT_READY'));

      const response = await request(app).get('/api/v1/bookings/appointments/a1/e-ticket');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('ETICKET_NOT_READY');
    });
  });

  describe('Staff & Sync Operations (TC_STAFF_001 - TC_STAFF_003)', () => {
    it('TC_STAFF_001: POST /sync-bloodcenter should return 200 OK', async () => {
      (BookingService.syncToBloodCenter as jest.Mock).mockResolvedValue({ success: true, message: 'Synced' });

      const response = await request(app).post('/api/v1/bookings/appointments/a1/sync-bloodcenter');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: 'Synced' });
    });

    it('TC_STAFF_002: POST /confirm should return 200 OK and Confirmed appointment', async () => {
      (BookingService.confirmAppointmentByBloodCenter as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Confirmed', eTicketId: { ticketCode: 'TK-123' } });

      const response = await request(app).post('/api/v1/bookings/appointments/a1/confirm');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'a1', status: 'Confirmed', eTicketId: { ticketCode: 'TK-123' } });
    });

    it('TC_STAFF_003: POST /reject should return 200 OK and Rejected appointment', async () => {
      (BookingService.rejectAppointmentByBloodCenter as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Rejected' });

      const response = await request(app)
        .post('/api/v1/bookings/appointments/a1/reject')
        .send({ reason: 'Medical reason' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'a1', status: 'Rejected' });
    });
  });
});
