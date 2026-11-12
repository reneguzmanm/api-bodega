
import { NextFunction, Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import {
    InventoryReferenceError,
    InsufficientStockError,
    registerStockEntry,
    registerStockExit,
    registerStockAdjustment,
} from '../services/inventory-movements.service';

export const addInventoryMovement = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (process.env.NODE_ENV === 'production') {
            res.status(501).json({
                message: 'Inventory authentication is not implemented',
            });
            return;
        }

        const {
            productId,
            locationId,
            type,
            quantity,
            countedQuantity,
            notes,
        } = req.body ?? {};

        if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
            res.status(400).json({
                message: 'Unsupported movement type',
            });
            return;
        }

        if (
            !Number.isSafeInteger(productId) ||
            productId <= 0 ||
            !Number.isSafeInteger(locationId) ||
            locationId <= 0
        ) {
            res.status(400).json({
                message: 'Invalid product or location ID',
            });
            return;
        }

        if (type === 'ADJUSTMENT') {
            if (
                !Number.isSafeInteger(countedQuantity) ||
                countedQuantity < 0
            ) {
                res.status(400).json({
                    message: 'Invalid counted quantity',
                });
                return;
            }

            if (
                typeof notes !== 'string' ||
                !notes.trim() ||
                notes.trim().length > 500
            ) {
                res.status(400).json({
                    message: 'Adjustment reason is required (max 500 characters)',
                });
                return;
            }
        } else {
            if (
                !Number.isSafeInteger(quantity) ||
                quantity <= 0
            ) {
                res.status(400).json({
                    message: 'Invalid movement quantity',
                });
                return;
            }
        }

        const actorId = Number(process.env.DEV_ACTOR_ID);

        if (!Number.isSafeInteger(actorId) || actorId <= 0) {
            throw new Error('DEV_ACTOR_ID is not configured');
        }

        let movement;

        if (type === 'ADJUSTMENT') {
            movement = await registerStockAdjustment({
                productId,
                locationId,
                actorId,
                countedQuantity,
                notes: notes.trim(),
            });
        } else {
            const movementInput = {
                productId,
                locationId,
                actorId,
                quantity,
            };

            movement = type === 'IN'
                ? await registerStockEntry(movementInput)
                : await registerStockExit(movementInput);
        }

        res.status(201).json(movement);
    } catch (error) {
        if (error instanceof InventoryReferenceError) {
            res.status(404).json({
                message: error.message,
            });
            return;
        }

        if (error instanceof InsufficientStockError) {
            res.status(409).json({
                message: error.message,
            });
            return;
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2034' || error.code === 'P2002')
        ) {
            res.status(503).json({
                message: 'Inventory operation could not be completed',
            });
            return;
        }

        next(error);
    }
};
