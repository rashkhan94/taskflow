import Activity from '../models/Activity.js';
import Board from '../models/Board.js';

export const getActivities = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const boardId = req.params.id;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (!board.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const total = await Activity.countDocuments({ board: boardId });
        const activities = await Activity.find({ board: boardId })
            .populate('user', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            activities,
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
