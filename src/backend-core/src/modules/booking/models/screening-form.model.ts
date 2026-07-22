import mongoose, { Document, Schema } from 'mongoose';

export enum EligibilityFlag {
  Eligible = 'Eligible',
  RequiresReview = 'RequiresReview',
  Ineligible = 'Ineligible'
}

export interface IScreeningForm extends Document {
  appointmentId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  medicalHistory: Record<string, any>;
  currentHealthStatus: string;
  recentTravel: string;
  medicationHistory: string;
  consentGiven: boolean;
  eligibilityFlag: EligibilityFlag;
  submittedAt: Date;
}

const ScreeningFormSchema: Schema = new Schema({
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  templateId: { type: Schema.Types.ObjectId },
  medicalHistory: { type: Schema.Types.Mixed, default: {} },
  currentHealthStatus: { type: String, required: true },
  recentTravel: { type: String, required: true },
  medicationHistory: { type: String, required: true },
  consentGiven: { type: Boolean, required: true },
  eligibilityFlag: { type: String, enum: Object.values(EligibilityFlag), required: true },
  submittedAt: { type: Date, default: Date.now }
}, {
  collection: 'screening_forms'
});

export const ScreeningForm = mongoose.model<IScreeningForm>('ScreeningForm', ScreeningFormSchema);
