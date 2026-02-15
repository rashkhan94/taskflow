import { Router } from 'express';
import { updateTask, deleteTask, reorderTasks, assignTask } from '../controllers/taskController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.put('/reorder', reorderTasks);
router.route('/:id')
    .put(updateTask)
    .delete(deleteTask);

router.post('/:id/assign', assignTask);

export default router;
