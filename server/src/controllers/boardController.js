import Board from '../models/Board.js';
import List from '../models/List.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';

export const createBoard = async (req, res, next) => {
    try {
        const { title, description, background } = req.body;
        const board = await Board.create({
            title,
            description,
            background,
            owner: req.user._id,
            members: [req.user._id],
        });

        await Activity.create({
            board: board._id,
            user: req.user._id,
            action: 'board.created',
            details: { title },
        });

        const populated = await Board.findById(board._id)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar');

        req.io?.to(`board:${board._id}`).emit('board:created', populated);

        res.status(201).json({ board: populated });
    } catch (error) {
        next(error);
    }
};

export const getBoards = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const query = { members: req.user._id };
        const total = await Board.countDocuments(query);
        const boards = await Board.find(query)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            boards,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getBoard = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar');

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (!board.members.some((m) => m._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const lists = await List.find({ board: board._id }).sort({ position: 1 });
        const tasks = await Task.find({ board: board._id })
            .populate('assignees', 'name email avatar')
            .sort({ position: 1 });

        res.json({ board, lists, tasks });
    } catch (error) {
        next(error);
    }
};

export const updateBoard = async (req, res, next) => {
    try {
        const { title, description, background } = req.body;
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the owner can update the board' });
        }

        if (title) board.title = title;
        if (description !== undefined) board.description = description;
        if (background) board.background = background;
        await board.save();

        const populated = await Board.findById(board._id)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar');

        await Activity.create({
            board: board._id,
            user: req.user._id,
            action: 'board.updated',
            details: { title: board.title },
        });

        req.io?.to(`board:${board._id}`).emit('board:updated', populated);

        res.json({ board: populated });
    } catch (error) {
        next(error);
    }
};

export const deleteBoard = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the owner can delete the board' });
        }

        await Task.deleteMany({ board: board._id });
        await List.deleteMany({ board: board._id });
        await Activity.deleteMany({ board: board._id });
        await Board.findByIdAndDelete(board._id);

        req.io?.to(`board:${board._id}`).emit('board:deleted', { boardId: board._id });

        res.json({ message: 'Board deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const addMember = async (req, res, next) => {
    try {
        const { email } = req.body;
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the owner can add members' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with that email' });
        }

        if (board.members.includes(user._id)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        board.members.push(user._id);
        await board.save();

        const populated = await Board.findById(board._id)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar');

        await Activity.create({
            board: board._id,
            user: req.user._id,
            action: 'member.added',
            details: { memberName: user.name, memberEmail: user.email },
        });

        req.io?.to(`board:${board._id}`).emit('member:added', {
            board: populated,
            member: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        });

        res.json({ board: populated });
    } catch (error) {
        next(error);
    }
};
