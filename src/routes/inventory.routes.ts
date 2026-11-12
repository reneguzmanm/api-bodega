
import { Router } from 'express';
import { listInventory } from '../controllers/inventory.controller';
import { addInventoryMovement } from '../controllers/inventory-movements.controller';

const router = Router();

router.get('/', listInventory);
router.post('/movements', addInventoryMovement);

export default router;
