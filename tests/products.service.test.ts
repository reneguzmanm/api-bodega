
import { prisma } from '../src/lib/prisma';
import {
    createProduct,
    deactivateProduct
} from '../src/services/products.service';

jest.mock('../src/lib/prisma', () => ({
    prisma: {
        product: {
            create: jest.fn(),
            updateMany: jest.fn()
        }
    }
}));

describe('Product Service', () => {
    it('should create a product', async () => {
        const productData = {
            sku: 'BOX-010',
            name: 'Test Box'
        };

        const expectedProduct = {
            id: 10,
            ...productData,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        jest.mocked(prisma.product.create)
            .mockResolvedValue(expectedProduct);

        const result = await createProduct(productData);

        expect(prisma.product.create).toHaveBeenCalledWith({
            data: productData
        });

        expect(result).toEqual(expectedProduct);
    });

    it('should deactivate an active product', async () => {
        jest.mocked(prisma.product.updateMany)
            .mockResolvedValue({ count: 1 });

        const result = await deactivateProduct(10);

        expect(prisma.product.updateMany).toHaveBeenCalledWith({
            where: {
                id: 10,
                isActive: true
            },
            data: {
                isActive: false
            }
        });

        expect(result).toBe(true);
    });

    it('should return false when no product is deactivated', async () => {
        jest.mocked(prisma.product.updateMany)
            .mockResolvedValue({ count: 0 });

        const result = await deactivateProduct(999);

        expect(result).toBe(false);
    });
});
