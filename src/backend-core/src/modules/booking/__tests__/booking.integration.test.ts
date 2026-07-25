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

// Add error handler
app.use((err: any, req: any, res: any, next: any) => {
  if (err) res.status(400).json({ error: err.message });
});

describe('Booking API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/bookings/locations should call BookingService.searchLocations', async () => {
    (BookingService.searchLocations as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Campaign 1' }]);
    
    const response = await request(app).get('/api/v1/bookings/locations?lat=10&lng=10&radius=5');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 'c1', name: 'Campaign 1' }]);
    expect(BookingService.searchLocations).toHaveBeenCalled();
  });

  it('POST /api/v1/bookings/appointments should call BookingService.createAppointment', async () => {
    (BookingService.createAppointment as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Pending' });
    
    const response = await request(app)
      .post('/api/v1/bookings/appointments')
      .send({
        campaignId: 'c1',
        appointmentDate: new Date().toISOString(),
        timeSlot: '08:00-09:00',
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
      });
      
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 'a1', status: 'Pending' });
    expect(BookingService.createAppointment).toHaveBeenCalled();
  });

  it('POST /api/v1/bookings/appointments/:id/confirm should call BookingService.confirmAppointmentByBloodCenter', async () => {
    (BookingService.confirmAppointmentByBloodCenter as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Confirmed', eTicketId: { ticketCode: 'TK-123' } });
    
    const response = await request(app).post('/api/v1/bookings/appointments/a1/confirm');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'a1', status: 'Confirmed', eTicketId: { ticketCode: 'TK-123' } });
    expect(BookingService.confirmAppointmentByBloodCenter).toHaveBeenCalledWith('a1');
  });

  it('GET /api/v1/bookings/appointments/:id should call BookingService.getAppointmentById', async () => {
    (BookingService.getAppointmentById as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Pending' });
    
    const response = await request(app).get('/api/v1/bookings/appointments/a1');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'a1', status: 'Pending' });
    expect(BookingService.getAppointmentById).toHaveBeenCalled();
  });

  it('PATCH /api/v1/bookings/appointments/:id/cancel should call BookingService.cancelAppointment', async () => {
    (BookingService.cancelAppointment as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Cancelled' });
    
    const response = await request(app)
      .patch('/api/v1/bookings/appointments/a1/cancel')
      .send({ reason: 'Sick' });
      
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'a1', status: 'Cancelled' });
    expect(BookingService.cancelAppointment).toHaveBeenCalled();
  });

  it('GET /api/v1/bookings/appointments/:id/e-ticket should call BookingService.downloadETicket', async () => {
    (BookingService.downloadETicket as jest.Mock).mockResolvedValue({ id: 'e1', ticketCode: 'TK-123' });
    
    const response = await request(app).get('/api/v1/bookings/appointments/a1/e-ticket');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'e1', ticketCode: 'TK-123' });
    expect(BookingService.downloadETicket).toHaveBeenCalled();
  });
});
