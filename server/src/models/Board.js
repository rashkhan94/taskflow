import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Board title is required'],
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        default: '',
        maxlength: 500,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    background: {
        type: String,
        default: '#6366f1',
    },
}, {
    timestamps: true,
});

boardSchema.index({ members: 1 });

const Board = mongoose.model('Board', boardSchema);
export default Board;
