import { Router } from "express";
import { listProducts, listProduct, addProduct, editProduct, removeProduct } from "../controllers/products.controller";

const router = Router();

router.get('/', listProducts);
router.get('/:id', listProduct);
router.post('/', addProduct)
router.put('/:id', editProduct)
router.delete('/:id', removeProduct)

export default router;