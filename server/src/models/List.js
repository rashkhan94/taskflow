import mongoose from 'mongoose';

const listSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'List title is required'],
        trim: true,
        maxlength: 100,
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
        index: true,
    },
    position: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    timestamps: true,
});

listSchema.index({ board: 1, position: 1 });

const List = mongoose.model('List', listSchema);
export default List;
