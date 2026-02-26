import mongoose from 'mongoose';

const wordHistorySchema = new mongoose.Schema({
    word: { type: String, required: true, unique: true },
    isValid: { type: Boolean, required: true },
    definition: { type: String },
    usageCount: { type: Number, default: 1 },
    lastUsed: { type: Date, default: Date.now },
    cachedAt: { type: Date, default: Date.now }
});

const WordHistory = mongoose.models.WordHistory || mongoose.model('WordHistory', wordHistorySchema);

export default WordHistory;
