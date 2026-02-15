import Task from '../models/Task.js';
import List from '../models/List.js';
import Board from '../models/Board.js';
import Activity from '../models/Activity.js';

export const createTask = async (req, res, next) => {
    try {
        const { title, description, priority, dueDate, labels } = req.body;
        const { listId } = req.params;

        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        const board = await Board.findById(list.board);
        if (!board.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const maxPosition = await Task.findOne({ list: listId })
            .sort({ position: -1 })
            .select('position');

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            labels,
            list: listId,
            board: list.board,
            position: maxPosition ? maxPosition.position + 1 : 0,
        });

        const populated = await Task.findById(task._id)
            .populate('assignees', 'name email avatar');

        await Activity.create({
            board: list.board,
            user: req.user._id,
            action: 'task.created',
            details: { title, taskId: task._id, listTitle: list.title },
        });

        req.io?.to(`board:${list.board}`).emit('task:created', populated);

        res.status(201).json({ task: populated });
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (req, res, next) => {
    try {
        const { title, description, priority, dueDate, labels } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const board = await Board.findById(task.board);
        if (!board.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (labels !== undefined) task.labels = labels;
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('assignees', 'name email avatar');

        await Activity.create({
            board: task.board,
            user: req.user._id,
            action: 'task.updated',
            details: { title: task.title, taskId: task._id },
        });

        req.io?.to(`board:${task.board}`).emit('task:updated', populated);

        res.json({ task: populated });
    } catch (error) {
        next(error);
    }
};

export const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const board = await Board.findById(task.board);
        if (!board.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Task.findByIdAndDelete(task._id);

        await Activity.create({
            board: task.board,
            user: req.user._id,
            action: 'task.deleted',
            details: { title: task.title, taskId: task._id },
        });

        req.io?.to(`board:${task.board}`).emit('task:deleted', { taskId: task._id, listId: task.list, boardId: task.board });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const reorderTasks = async (req, res, next) => {
    try {
        const { tasks, boardId } = req.body; // [{ _id, list, position }]

        const bulkOps = tasks.map((item) => ({
            updateOne: {
                filter: { _id: item._id },
                update: { list: item.list, position: item.position },
            },
        }));

        await Task.bulkWrite(bulkOps);

        if (boardId) {
            await Activity.create({
                board: boardId,
                user: req.user._id,
                action: 'task.moved',
                details: { taskCount: tasks.length },
            });

            req.io?.to(`board:${boardId}`).emit('tasks:reordered', { tasks, boardId });
        }

        res.json({ message: 'Tasks reordered successfully' });
    } catch (error) {
        next(error);
    }
};

export const assignTask = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const board = await Board.findById(task.board);
        if (!board.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!board.members.some((m) => m.toString() === userId)) {
            return res.status(400).json({ message: 'User is not a board member' });
        }

        const isAssigned = task.assignees.some((a) => a.toString() === userId);
        if (isAssigned) {
            task.assignees = task.assignees.filter((a) => a.toString() !== userId);
        } else {
            task.assignees.push(userId);
        }
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('assignees', 'name email avatar');

        await Activity.create({
            board: task.board,
            user: req.user._id,
            action: isAssigned ? 'task.unassigned' : 'task.assigned',
            details: { title: task.title, taskId: task._id, userId },
        });

        req.io?.to(`board:${task.board}`).emit('task:updated', populated);

        res.json({ task: populated });
    } catch (error) {
        next(error);
    }
};

export const searchTasks = async (req, res, next) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;
        const boardId = req.params.id;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { board: boardId };
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
            ];
        }

        const total = await Task.countDocuments(query);
        const tasks = await Task.find(query)
            .populate('assignees', 'name email avatar')
            .sort({ position: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            tasks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};
