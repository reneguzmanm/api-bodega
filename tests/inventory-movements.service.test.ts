
/// <reference types="jest" />

import { prisma } from '../src/lib/prisma';
import {
    registerStockAdjustment,
    registerStockEntry,
    registerStockExit,
} from '../src/services/inventory-movements.service';

jest.mock('../src/lib/prisma', () => ({
    prisma: {
        $transaction: jest.fn(),
    },
}));

describe('Inventory Movement Service', () => {
    const tx = {
        product: {
            findUnique: jest.fn(),
        },
        location: {
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        inventory: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            updateMany: jest.fn(),
        },
        inventoryMovement: {
            create: jest.fn(),
        },
    };

    const input = {
        productId: 1,
        locationId: 1,
        actorId: 1,
        quantity: 50,
    };

    beforeEach(() => {
        jest.resetAllMocks();

        (prisma.$transaction as jest.Mock).mockImplementation(
            async (
                callback: (client: typeof tx) => Promise<unknown>,
            ) => callback(tx),
        );

        tx.product.findUnique.mockResolvedValue({
            id: 1,
            isActive: true,
        });

        tx.location.findUnique.mockResolvedValue({
            id: 1,
        });

        tx.user.findUnique.mockResolvedValue({
            id: 1,
        });
    });

    it('should create an initial stock entry', async () => {
        tx.inventory.findUnique.mockResolvedValue(null);

        tx.inventory.upsert.mockResolvedValue({
            quantity: 50,
        });

        const expectedMovement = {
            id: 1,
            productId: 1,
            locationId: 1,
            userId: 1,
            type: 'IN',
            quantityDelta: 50,
            stockBefore: 0,
            stockAfter: 50,
        };

        tx.inventoryMovement.create.mockResolvedValue(
            expectedMovement,
        );

        const result = await registerStockEntry(input);

        expect(result).toEqual(expectedMovement);

        expect(tx.inventory.upsert).toHaveBeenCalledWith({
            where: {
                productId_locationId: {
                    productId: 1,
                    locationId: 1,
                },
            },
            create: {
                productId: 1,
                locationId: 1,
                quantity: 50,
            },
            update: {
                quantity: {
                    increment: 50,
                },
            },
        });

        expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
            data: {
                productId: 1,
                locationId: 1,
                userId: 1,
                type: 'IN',
                quantityDelta: 50,
                stockBefore: 0,
                stockAfter: 50,
            },
        });

        expect(prisma.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            {
                isolationLevel: 'Serializable',
            },
        );
    });

    it('should increment existing inventory', async () => {
        tx.inventory.findUnique.mockResolvedValue({
            quantity: 50,
        });

        tx.inventory.upsert.mockResolvedValue({
            quantity: 70,
        });

        tx.inventoryMovement.create.mockResolvedValue({
            stockBefore: 50,
            stockAfter: 70,
        });

        const result = await registerStockEntry({
            ...input,
            quantity: 20,
        });

        expect(result.stockBefore).toBe(50);
        expect(result.stockAfter).toBe(70);

        expect(tx.inventory.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                update: {
                    quantity: {
                        increment: 20,
                    },
                },
            }),
        );
    });

    it('should reject inactive products', async () => {
        tx.product.findUnique.mockResolvedValue({
            id: 1,
            isActive: false,
        });

        await expect(
            registerStockEntry(input),
        ).rejects.toThrow('Active product not found');

        expect(tx.inventory.upsert).not.toHaveBeenCalled();
        expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    });


    it('should register a valid stock exit', async () => {
        tx.inventory.findUnique.mockResolvedValue({
            quantity: 50,
        });

        tx.inventory.updateMany.mockResolvedValue({
            count: 1,
        });

        const expectedMovement = {
            id: 2,
            productId: 1,
            locationId: 1,
            userId: 1,
            type: 'OUT',
            quantityDelta: -20,
            stockBefore: 50,
            stockAfter: 30,
        };

        tx.inventoryMovement.create.mockResolvedValue(expectedMovement);

        const result = await registerStockExit({
            ...input,
            quantity: 20,
        });

        expect(result).toEqual(expectedMovement);

        expect(tx.inventory.updateMany).toHaveBeenCalledWith({
            where: {
                productId: 1,
                locationId: 1,
                quantity: {
                    gte: 20,
                },
            },
            data: {
                quantity: {
                    decrement: 20,
                },
            },
        });

        expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
            data: {
                productId: 1,
                locationId: 1,
                userId: 1,
                type: 'OUT',
                quantityDelta: -20,
                stockBefore: 50,
                stockAfter: 30,
            },
        });
    });

    it('should reject stock exits exceeding available quantity', async () => {
        tx.inventory.findUnique.mockResolvedValue({
            quantity: 10,
        });

        await expect(
            registerStockExit({
                ...input,
                quantity: 20,
            }),
        ).rejects.toThrow('Insufficient stock');

        expect(tx.inventory.updateMany).not.toHaveBeenCalled();
        expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    });

    it('should reject an exit when the conditional update affects no rows', async () => {
        tx.inventory.findUnique.mockResolvedValue({
            quantity: 50,
        });

        tx.inventory.updateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            registerStockExit({
                ...input,
                quantity: 20,
            }),
        ).rejects.toThrow('Insufficient stock');

        expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    });

    it('should reject movements when the user does not exist', async () => {
        tx.user.findUnique.mockResolvedValue(null);

        await expect(
            registerStockEntry(input),
        ).rejects.toThrow('User not found');

        expect(tx.inventory.upsert).not.toHaveBeenCalled();
        expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    });


    it('should register a negative stock adjustment', async () => {
        tx.inventory.findUnique.mockResolvedValue({
            quantity: 50,
        });

        const expectedMovement = {
            type: 'ADJUSTMENT',
            quantityDelta: -3,
            stockBefore: 50,
            stockAfter: 47,
            notes: 'Physical inventory count',
        };

        tx.inventoryMovement.create.mockResolvedValue(expectedMovement);

        const result = await registerStockAdjustment({
            productId: 1,
            locationId: 1,
            actorId: 1,
            countedQuantity: 47,
            notes: 'Physical inventory count',
        });

        expect(result).toEqual(expectedMovement);

        expect(tx.inventory.upsert).toHaveBeenCalledWith({
            where: {
                productId_locationId: {
                    productId: 1,
                    locationId: 1,
                },
            },
            create: {
                productId: 1,
                locationId: 1,
                quantity: 47,
            },
            update: {
                quantity: 47,
            },
        });

        expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
            data: {
                productId: 1,
                locationId: 1,
                userId: 1,
                type: 'ADJUSTMENT',
                quantityDelta: -3,
                stockBefore: 50,
                stockAfter: 47,
                notes: 'Physical inventory count',
            },
        });
    });

    it('should register a positive stock adjustment', async () => {
        tx.inventory.findUnique.mockResolvedValue({
            quantity: 50,
        });

        tx.inventoryMovement.create.mockResolvedValue({
            quantityDelta: 5,
            stockBefore: 50,
            stockAfter: 55,
        });

        const result = await registerStockAdjustment({
            productId: 1,
            locationId: 1,
            actorId: 1,
            countedQuantity: 55,
            notes: 'Additional units found',
        });

        expect(result.quantityDelta).toBe(5);
        expect(result.stockAfter).toBe(55);
    });

    it('should record a physical count with no stock difference', async () => {
        tx.inventory.findUnique.mockResolvedValue({
            quantity: 50,
        });

        tx.inventoryMovement.create.mockResolvedValue({
            quantityDelta: 0,
            stockBefore: 50,
            stockAfter: 50,
        });

        const result = await registerStockAdjustment({
            productId: 1,
            locationId: 1,
            actorId: 1,
            countedQuantity: 50,
            notes: 'Stock verified',
        });

        expect(result.quantityDelta).toBe(0);
        expect(tx.inventoryMovement.create).toHaveBeenCalledTimes(1);
    });



});
