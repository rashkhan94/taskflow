import { Router } from 'express';
import {
    createBoard, getBoards, getBoard,
    updateBoard, deleteBoard, addMember,
} from '../controllers/boardController.js';
import { createList } from '../controllers/listController.js';
import { searchTasks } from '../controllers/taskController.js';
import { getActivities } from '../controllers/activityController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.route('/')
    .get(getBoards)
    .post(createBoard);

router.route('/:id')
    .get(getBoard)
    .put(updateBoard)
    .delete(deleteBoard);

router.post('/:id/members', addMember);
router.post('/:boardId/lists', createList);
router.get('/:id/tasks/search', searchTasks);
router.get('/:id/activity', getActivities);

export default router;
