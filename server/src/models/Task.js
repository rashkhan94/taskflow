import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        default: '',
        maxlength: 2000,
    },
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true,
        index: true,
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
    assignees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    dueDate: {
        type: Date,
        default: null,
    },
    labels: [{
        type: String,
        trim: true,
    }],
}, {
    timestamps: true,
});

taskSchema.index({ board: 1, list: 1, position: 1 });
taskSchema.index({ title: 'text', description: 'text' });

const Task = mongoose.model('Task', taskSchema);
export default Task;
