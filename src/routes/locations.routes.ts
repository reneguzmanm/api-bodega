import { Router } from 'express';
import {
    listLocations,
    addLocation
} from '../controllers/locations.controller';

const router = Router();

router.get('/', listLocations);
router.post('/', addLocation);

export default router;