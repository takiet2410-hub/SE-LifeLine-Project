import { AuthRoutes } from './routes/authRoutes';
import { BookingRoutes } from './modules/booking-location/bookingRoutes';
import { ImpactTrackingRoutes } from './modules/impact-tracking/impactTrackingRoutes';

function App() {
  return (
    <>
      <AuthRoutes />
      <BookingRoutes />
      <ImpactTrackingRoutes />
    </>
  );
}

export default App;
