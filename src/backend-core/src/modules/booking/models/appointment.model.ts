import mongoose, { Document, Schema } from 'mongoose';

export enum AppointmentStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Scheduled = 'Scheduled',
  CheckedIn = 'CheckedIn',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Rejected = 'Rejected',
  NoShow = 'NoShow'
}

export interface IAppointment extends Document {
  donorId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  timeSlot: string;
  status: AppointmentStatus;
  screeningFormId?: mongoose.Types.ObjectId;
  eTicketId?: mongoose.Types.ObjectId;
  donationVolume?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema({
  donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: Object.values(AppointmentStatus), default: AppointmentStatus.Pending },
  screeningFormId: { type: Schema.Types.ObjectId, ref: 'ScreeningForm' },
  eTicketId: { type: Schema.Types.ObjectId, ref: 'ETicket' },
  donationVolume: { type: Number, default: 350 }
}, {
  timestamps: true
});

AppointmentSchema.index({ donorId: 1 });
AppointmentSchema.index({ campaignId: 1 });
AppointmentSchema.index({ appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ donorId: 1, appointmentDate: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
