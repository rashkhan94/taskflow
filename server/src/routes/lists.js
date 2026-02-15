import { Router } from 'express';
import { updateList, deleteList, reorderLists } from '../controllers/listController.js';
import { createTask } from '../controllers/taskController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.put('/reorder', reorderLists);
router.route('/:id')
    .put(updateList)
    .delete(deleteList);

router.post('/:listId/tasks', createTask);

export default router;
