import { Router } from 'express';
import { getUpcomingContests, getPastContests } from '../controllers/contestController';

const router: Router = Router();

router.get('/upcoming', getUpcomingContests);
router.get('/past', getPastContests);

export default router;