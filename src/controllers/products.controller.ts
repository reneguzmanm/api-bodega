import { NextFunction, Request, Response} from 'express';
import { createProduct, deactivateProduct, getAllProducts, getProductById, updateProduct } from '../services/products.service'
import { Prisma } from '../generated/prisma/client';

export const listProducts = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> =>{
    try {
        const products = await getAllProducts();
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
}


export const listProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({
                message: 'Invalid product ID'
            });
            return;
        }

        const product = await getProductById(id);

        if (!product) {
            res.status(404).json({
                message: 'Product not found'
            });
            return;
        }

        res.status(200).json(product);

    } catch (error) {
        next(error);
    }
};



export const addProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { sku, name } = req.body ?? {};

        if (
            typeof sku !== 'string' ||
            !sku.trim() ||
            sku.trim().length > 50
        ) {
            res.status(400).json({
                message: 'Invalid product SKU'
            });
            return;
        }

        if (
            typeof name !== 'string' ||
            !name.trim() ||
            name.trim().length > 120
        ) {
            res.status(400).json({
                message: 'Invalid product name'
            });
            return;
        }

        const newProduct = await createProduct({
            sku: sku.trim(),
            name: name.trim()
        });

        res.status(201).json(newProduct);

    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            res.status(409).json({
                message: 'Product SKU already exists'
            });
            return;
        }

        next(error);
    }
};



export const editProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const { sku, name } = req.body ?? {};

        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({
                message: 'Invalid product ID'
            });
            return;
        }

        if (
            typeof sku !== 'string' ||
            !sku.trim() ||
            sku.trim().length > 50
        ) {
            res.status(400).json({
                message: 'Invalid product SKU'
            });
            return;
        }

        if (
            typeof name !== 'string' ||
            !name.trim() ||
            name.trim().length > 120
        ) {
            res.status(400).json({
                message: 'Invalid product name'
            });
            return;
        }

        const updatedProduct = await updateProduct(id, {
            sku: sku.trim(),
            name: name.trim()
        });

        res.status(200).json(updatedProduct);

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                res.status(404).json({
                    message: 'Product not found'
                });
                return;
            }

            if (error.code === 'P2002') {
                res.status(409).json({
                    message: 'Product SKU already exists'
                });
                return;
            }
        }

        next(error);
    }
};



export const removeProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({
                message: 'Invalid product ID'
            });
            return;
        }

        const deactivated = await deactivateProduct(id);

        if (!deactivated) {
            res.status(404).json({
                message: 'Product not found'
            });
            return;
        }

        res.status(204).send();

    } catch (error) {
        next(error);
    }
};
