import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";


export type MovementReferences = {
    productId: number;
    locationId: number;
    actorId: number;
};

export type StockEntryInput = MovementReferences & {
    quantity: number;
};

export type StockAdjustmentInput = MovementReferences & {
    countedQuantity: number;
    notes: string;
};


export class InventoryReferenceError extends Error{
    constructor(resource: string){
        super(`${resource} not found`);
        this.name = 'InventoryErrorReference';
    }
}

const MAX_TRANSACTION_ATTEMPTS = 3;

export const registerStockEntry = async (
    input: StockEntryInput,
) =>{
    for(
        let attemp = 1;
        attemp <= MAX_TRANSACTION_ATTEMPTS;
        attemp++
    ){
        try {
            return await prisma.$transaction(
                async (tx) =>{
                    await validateMovementReferences(tx, input);


                    const  inventoryKey ={
                        productId:  input.productId,
                        locationId: input.locationId,
                    }

                    const currentInventory = await tx.inventory.findUnique({
                        where:{
                            productId_locationId: inventoryKey,
                        }
                    });
                    const stockBefore = currentInventory?.quantity ?? 0;

                    const updatedInventory = await tx.inventory.upsert({
                        where:{
                            productId_locationId: inventoryKey,
                        },
                        create:{
                            ...inventoryKey,
                            quantity: input.quantity,
                        },
                        update:{
                            quantity:{
                                increment: input.quantity,
                            },
                        },
                    });
                    return tx.inventoryMovement.create({
                        data:{
                            ...inventoryKey,
                            userId: input.actorId,
                            type: 'IN',
                            quantityDelta: input.quantity,
                            stockBefore,
                            stockAfter: updatedInventory.quantity,
                        },
                    });
                },
                {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                },
            );
        } catch (error) {
            const isConcurrencyError = error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === 'P2034' || error.code === 'P2002');
            if(!isConcurrencyError || attemp === MAX_TRANSACTION_ATTEMPTS){
                throw error;
            }
        }
    }
    throw new Error('Transaction retry limits exceeded');
};


export class InsufficientStockError extends Error {
    constructor() {
        super('Insufficient stock');
        this.name = 'InsufficientStockError';
    }
}


const validateMovementReferences = async (
    tx: Prisma.TransactionClient,
    input: MovementReferences,
): Promise<void> => {
    const product = await tx.product.findUnique({
        where: {
            id: input.productId,
        },
    });

    if (!product || !product.isActive) {
        throw new InventoryReferenceError('Active product');
    }

    const location = await tx.location.findUnique({
        where: {
            id: input.locationId,
        },
    });

    if (!location) {
        throw new InventoryReferenceError('Location');
    }

    const actor = await tx.user.findUnique({
        where: {
            id: input.actorId,
        },
    });

    if (!actor) {
        throw new InventoryReferenceError('User');
    }
};



export const registerStockExit = async (
    input: StockEntryInput,
) => {
    for (
        let attempt = 1;
        attempt <= MAX_TRANSACTION_ATTEMPTS;
        attempt++
    ) {
        try {
            return await prisma.$transaction(
                async (tx) => {
                    const product = await tx.product.findUnique({
                        where: {
                            id: input.productId,
                        },
                    });

                    if (!product || !product.isActive) {
                        throw new InventoryReferenceError('Active product');
                    }

                    const location = await tx.location.findUnique({
                        where: {
                            id: input.locationId,
                        },
                    });

                    if (!location) {
                        throw new InventoryReferenceError('Location');
                    }

                    const actor = await tx.user.findUnique({
                        where: {
                            id: input.actorId,
                        },
                    });

                    if (!actor) {
                        throw new InventoryReferenceError('User');
                    }

                    const currentInventory = await tx.inventory.findUnique({
                        where: {
                            productId_locationId: {
                                productId: input.productId,
                                locationId: input.locationId,
                            },
                        },
                    });

                    if (
                        !currentInventory ||
                        currentInventory.quantity < input.quantity
                    ) {
                        throw new InsufficientStockError();
                    }

                    const result = await tx.inventory.updateMany({
                        where: {
                            productId: input.productId,
                            locationId: input.locationId,
                            quantity: {
                                gte: input.quantity,
                            },
                        },
                        data: {
                            quantity: {
                                decrement: input.quantity,
                            },
                        },
                    });

                    if (result.count !== 1) {
                        throw new InsufficientStockError();
                    }

                    return tx.inventoryMovement.create({
                        data: {
                            productId: input.productId,
                            locationId: input.locationId,
                            userId: input.actorId,
                            type: 'OUT',
                            quantityDelta: -input.quantity,
                            stockBefore: currentInventory.quantity,
                            stockAfter:
                                currentInventory.quantity - input.quantity,
                        },
                    });
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable,
                },
            );
        } catch (error) {
            const shouldRetry =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2034';

            if (
                !shouldRetry ||
                attempt === MAX_TRANSACTION_ATTEMPTS
            ) {
                throw error;
            }
        }
    }

    throw new Error('Transaction retry limit exceeded');
};


export const registerStockAdjustment = async (
    input: StockAdjustmentInput,
) => {
    for (
        let attempt = 1;
        attempt <= MAX_TRANSACTION_ATTEMPTS;
        attempt++
    ) {
        try {
            return await prisma.$transaction(
                async (tx) => {
                    await validateMovementReferences(tx, input);

                    const inventoryKey = {
                        productId: input.productId,
                        locationId: input.locationId,
                    };

                    const currentInventory = await tx.inventory.findUnique({
                        where: {
                            productId_locationId: inventoryKey,
                        },
                    });

                    const stockBefore = currentInventory?.quantity ?? 0;
                    const stockAfter = input.countedQuantity;
                    const quantityDelta = stockAfter - stockBefore;

                    await tx.inventory.upsert({
                        where: {
                            productId_locationId: inventoryKey,
                        },
                        create: {
                            ...inventoryKey,
                            quantity: stockAfter,
                        },
                        update: {
                            quantity: stockAfter,
                        },
                    });

                    return tx.inventoryMovement.create({
                        data: {
                            ...inventoryKey,
                            userId: input.actorId,
                            type: 'ADJUSTMENT',
                            quantityDelta,
                            stockBefore,
                            stockAfter,
                            notes: input.notes,
                        },
                    });
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable,
                },
            );
        } catch (error) {
            const isConcurrencyError =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === 'P2034' || error.code === 'P2002');

            if (
                !isConcurrencyError ||
                attempt === MAX_TRANSACTION_ATTEMPTS
            ) {
                throw error;
            }
        }
    }

    throw new Error('Transaction retry limit exceeded');
};
