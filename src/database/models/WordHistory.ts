import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWordHistory extends Document {
    word: string;
    isValid: boolean;
    definition?: string;
    usageCount?: number;
    lastUsed?: Date;
    cachedAt?: Date;
}

const wordHistorySchema = new Schema<IWordHistory>({
    word: { type: String, required: true, unique: true },
    isValid: { type: Boolean, required: true },
    definition: { type: String },
    usageCount: { type: Number, default: 1 },
    lastUsed: { type: Date, default: Date.now },
    cachedAt: { type: Date, default: Date.now }
});

const WordHistory: Model<IWordHistory> = mongoose.models.WordHistory || mongoose.model<IWordHistory>('WordHistory', wordHistorySchema);

export default WordHistory;
