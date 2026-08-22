import mongoose, { Document, Schema } from 'mongoose';

export enum ScreeningOutcome {
  PASS = 'PASS',
  REVIEW = 'REVIEW',
  REJECT = 'REJECT'
}

export interface IQuestionAnswer {
  questionId: string;
  selectedOptions: string[];
  description?: string;
}

export interface IScreeningForm extends Document {
  appointmentId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  responses: IQuestionAnswer[];
  outcome: ScreeningOutcome;
  testResult?: 'Pass' | 'Rejected';
  vitals?: {
    bloodPressure?: string;
    weight?: number;
    bodyTemperature?: number;
    hemoglobinLevel?: number;
  };
  screeningNotes?: string;
  eligibilityFlag?: string;
  reviewedByStaffId?: mongoose.Types.ObjectId;
  submittedAt: Date;
}

const QuestionAnswerSchema: Schema = new Schema({
  questionId: { type: String, required: true },
  selectedOptions: { type: [String], required: true },
  description: { type: String }
}, { _id: false });

const ScreeningFormSchema: Schema = new Schema({
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  templateId: { type: Schema.Types.ObjectId },
  responses: { type: [QuestionAnswerSchema], required: true },
  outcome: { type: String, enum: Object.values(ScreeningOutcome), required: true },
  testResult: { type: String, enum: ['Pass', 'Rejected'] },
  vitals: { type: Schema.Types.Mixed },
  screeningNotes: { type: String, default: '' },
  eligibilityFlag: { type: String, default: 'Eligible' },
  reviewedByStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date, default: Date.now }
}, {
  collection: 'screening_forms'
});

export const ScreeningForm = mongoose.model<IScreeningForm>('ScreeningForm', ScreeningFormSchema);
