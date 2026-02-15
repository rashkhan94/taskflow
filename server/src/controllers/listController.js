import List from '../models/List.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import Activity from '../models/Activity.js';

export const createList = async (req, res, next) => {
    try {
        const { title } = req.body;
        const { boardId } = req.params;

        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (!board.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const maxPosition = await List.findOne({ board: boardId })
            .sort({ position: -1 })
            .select('position');

        const list = await List.create({
            title,
            board: boardId,
            position: maxPosition ? maxPosition.position + 1 : 0,
        });

        await Activity.create({
            board: boardId,
            user: req.user._id,
            action: 'list.created',
            details: { title, listId: list._id },
        });

        req.io?.to(`board:${boardId}`).emit('list:created', list);

        res.status(201).json({ list });
    } catch (error) {
        next(error);
    }
};

export const updateList = async (req, res, next) => {
    try {
        const { title } = req.body;
        const list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        const board = await Board.findById(list.board);
        if (!board.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        list.title = title || list.title;
        await list.save();

        await Activity.create({
            board: list.board,
            user: req.user._id,
            action: 'list.updated',
            details: { title: list.title, listId: list._id },
        });

        req.io?.to(`board:${list.board}`).emit('list:updated', list);

        res.json({ list });
    } catch (error) {
        next(error);
    }
};

export const deleteList = async (req, res, next) => {
    try {
        const list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        const board = await Board.findById(list.board);
        if (!board.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Task.deleteMany({ list: list._id });
        await List.findByIdAndDelete(list._id);

        await Activity.create({
            board: list.board,
            user: req.user._id,
            action: 'list.deleted',
            details: { title: list.title, listId: list._id },
        });

        req.io?.to(`board:${list.board}`).emit('list:deleted', { listId: list._id, boardId: list.board });

        res.json({ message: 'List deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const reorderLists = async (req, res, next) => {
    try {
        const { lists } = req.body; // [{ _id, position }]

        const bulkOps = lists.map((item) => ({
            updateOne: {
                filter: { _id: item._id },
                update: { position: item.position },
            },
        }));

        await List.bulkWrite(bulkOps);

        const boardId = lists[0]?.boardId;
        if (boardId) {
            req.io?.to(`board:${boardId}`).emit('lists:reordered', lists);
        }

        res.json({ message: 'Lists reordered successfully' });
    } catch (error) {
        next(error);
    }
};
