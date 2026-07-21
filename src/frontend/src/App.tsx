import { AuthRoutes } from './routes/authRoutes';
import { BookingRoutes } from './modules/booking-location/bookingRoutes';

function App() {
  return (
    <>
      <AuthRoutes />
      <BookingRoutes />
    </>
  );
}

export default App;
