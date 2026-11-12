
/// <reference types="jest" />

import { randomInt, randomUUID } from 'node:crypto';
import { prisma } from '../src/lib/prisma';
import {
    InsufficientStockError,
    registerStockExit,
} from '../src/services/inventory-movements.service';

describe('Inventory Transaction Integration', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should rollback inventory changes when movement creation fails', async () => {
        const databaseUrl = process.env.DATABASE_URL;

        if (
            !databaseUrl ||
            new URL(databaseUrl).pathname !== '/bodega_test_db'
        ) {
            throw new Error('Integration tests require bodega_test_db');
        }

        const product = await prisma.product.create({
            data: {
                sku: `TEST-${randomUUID().slice(0, 12)}`,
                name: 'Rollback Test Product',
            },
        });

        let locationId: number | undefined;

        try {
            const location = await prisma.location.create({
                data: {
                    zone: 'Z',
                    aisle: randomInt(1, 100),
                    rack: randomInt(1, 100),
                    level: randomInt(1, 100),
                    position: randomInt(1, 100),
                },
            });

            locationId = location.id;

            const inventory = await prisma.inventory.create({
                data: {
                    productId: product.id,
                    locationId: location.id,
                    quantity: 10,
                },
            });

            await expect(
                prisma.$transaction(async (tx) => {
                    await tx.inventory.update({
                        where: {
                            id: inventory.id,
                        },
                        data: {
                            quantity: {
                                increment: 5,
                            },
                        },
                    });

                    await tx.inventoryMovement.create({
                        data: {
                            productId: product.id,
                            locationId: location.id,
                            userId: -1,
                            type: 'IN',
                            quantityDelta: 5,
                            stockBefore: 10,
                            stockAfter: 15,
                        },
                    });
                }),
            ).rejects.toMatchObject({
                code: 'P2003',
            });

            const inventoryAfter = await prisma.inventory.findUnique({
                where: {
                    id: inventory.id,
                },
            });

            const movementCount = await prisma.inventoryMovement.count({
                where: {
                    productId: product.id,
                    locationId: location.id,
                },
            });

            expect(inventoryAfter?.quantity).toBe(10);
            expect(movementCount).toBe(0);
        } finally {
            if (locationId !== undefined) {
                await prisma.inventoryMovement.deleteMany({
                    where: {
                        productId: product.id,
                        locationId,
                    },
                });

                await prisma.inventory.deleteMany({
                    where: {
                        productId: product.id,
                        locationId,
                    },
                });

                await prisma.location.delete({
                    where: {
                        id: locationId,
                    },
                });
            }

            await prisma.product.delete({
                where: {
                    id: product.id,
                },
            });
        }
    });


    it('should prevent concurrent stock exits from exceeding available inventory', async () => {
        const databaseUrl = process.env.DATABASE_URL;

        if (
            !databaseUrl ||
            new URL(databaseUrl).pathname !== '/bodega_test_db'
        ) {
            throw new Error('Integration tests require bodega_test_db');
        }

        const actor = await prisma.user.create({
            data: {
                name: 'Concurrent Test Actor',
                email: `concurrent-${randomUUID()}@example.invalid`,
            },
        });

        const product = await prisma.product.create({
            data: {
                sku: `TEST-${randomUUID().slice(0, 12)}`,
                name: 'Concurrent Stock Exit Test',
            },
        });

        let locationId: number | undefined;

        try {
            const location = await prisma.location.create({
                data: {
                    zone: 'Z',
                    aisle: randomInt(1, 100),
                    rack: randomInt(1, 100),
                    level: randomInt(1, 100),
                    position: randomInt(1, 100),
                },
            });

            locationId = location.id;

            await prisma.inventory.create({
                data: {
                    productId: product.id,
                    locationId: location.id,
                    quantity: 10,
                },
            });

            const movementInput = {
                productId: product.id,
                locationId: location.id,
                actorId: actor.id,
                quantity: 7,
            };

            const results = await Promise.allSettled([
                registerStockExit(movementInput),
                registerStockExit(movementInput),
            ]);

            const successful = results.filter(
                (result) => result.status === 'fulfilled',
            );

            const failed = results.filter(
                (result) => result.status === 'rejected',
            );

            expect(successful).toHaveLength(1);
            expect(failed).toHaveLength(1);
            expect(failed[0]?.reason).toBeInstanceOf(
                InsufficientStockError,
            );

            const inventory = await prisma.inventory.findUnique({
                where: {
                    productId_locationId: {
                        productId: product.id,
                        locationId: location.id,
                    },
                },
            });

            expect(inventory?.quantity).toBe(3);

            const movements = await prisma.inventoryMovement.findMany({
                where: {
                    productId: product.id,
                    locationId: location.id,
                },
            });

            expect(movements).toHaveLength(1);
            expect(movements[0]).toMatchObject({
                type: 'OUT',
                quantityDelta: -7,
                stockBefore: 10,
                stockAfter: 3,
                userId: actor.id,
            });
        } finally {
            if (locationId !== undefined) {
                await prisma.inventoryMovement.deleteMany({
                    where: {
                        productId: product.id,
                        locationId,
                    },
                });

                await prisma.inventory.deleteMany({
                    where: {
                        productId: product.id,
                        locationId,
                    },
                });

                await prisma.location.delete({
                    where: {
                        id: locationId,
                    },
                });
            }

            await prisma.product.delete({
                where: {
                    id: product.id,
                },
            });


            await prisma.user.delete({
                where: {
                    id: actor.id,
                },
            });

        }
    });

});
