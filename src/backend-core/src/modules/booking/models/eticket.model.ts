import mongoose, { Document, Schema } from 'mongoose';

export interface IETicket extends Document {
  appointmentId: mongoose.Types.ObjectId;
  ticketCode: string;
  qrPayloadSigned: string;
  fileUrl?: string;
  issuedAt: Date;
}

const ETicketSchema: Schema = new Schema({
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  ticketCode: { type: String, required: true, unique: true },
  qrPayloadSigned: { type: String, required: true },
  fileUrl: { type: String },
  issuedAt: { type: Date, default: Date.now }
}, {
  collection: 'e_tickets'
});

export const ETicket = mongoose.model<IETicket>('ETicket', ETicketSchema);
