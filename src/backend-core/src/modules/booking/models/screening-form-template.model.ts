import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionOption {
  label: string;
  requiresDescription: boolean;
  outcomeFlag: 'PASS' | 'REVIEW' | 'REJECT';
}

export interface IQuestion {
  questionId: string;
  questionText: string;
  isMultiSelect: boolean;
  options: IQuestionOption[];
}

export interface IScreeningFormTemplate extends Document {
  versionName: string;
  isActive: boolean;
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionOptionSchema: Schema = new Schema({
  label: { type: String, required: true },
  requiresDescription: { type: Boolean, default: false },
  outcomeFlag: { type: String, enum: ['PASS', 'REVIEW', 'REJECT'], required: true }
}, { _id: false });

const QuestionSchema: Schema = new Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  isMultiSelect: { type: Boolean, default: false },
  options: { type: [QuestionOptionSchema], required: true }
}, { _id: false });

const ScreeningFormTemplateSchema: Schema = new Schema({
  versionName: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: false },
  questions: { type: [QuestionSchema], required: true },
}, {
  collection: 'screening_form_templates',
  timestamps: true
});

export const ScreeningFormTemplate = mongoose.model<IScreeningFormTemplate>('ScreeningFormTemplate', ScreeningFormTemplateSchema);
