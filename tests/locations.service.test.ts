/// <reference types="jest" />
import { prisma } from '../src/lib/prisma';
import {
    getAllLocations,
    createLocation
} from '../src/services/locations.service';

jest.mock('../src/lib/prisma', () => ({
    prisma: {
        location: {
            findMany: jest.fn(),
            create: jest.fn()
        }
    }
}));

describe('Location Service', () => {
    it('should retrieve locations ordered by physical position', async () => {
        jest.mocked(prisma.location.findMany)
            .mockResolvedValue([]);

        const result = await getAllLocations();

        expect(prisma.location.findMany).toHaveBeenCalledWith({
            orderBy: [
                { zone: 'asc' },
                { aisle: 'asc' },
                { rack: 'asc' },
                { level: 'asc' },
                { position: 'asc' }
            ]
        });

        expect(result).toEqual([]);
    });

    it('should create a location using Prisma', async () => {
        const locationData = {
            zone: 'A',
            aisle: 1,
            rack: 2,
            level: 3,
            position: 4,
            description: 'Main storage shelf'
        };

        const expectedLocation = {
            id: 1,
            ...locationData,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        jest.mocked(prisma.location.create)
            .mockResolvedValue(expectedLocation);

        const result = await createLocation(locationData);

        expect(prisma.location.create).toHaveBeenCalledWith({
            data: locationData
        });

        expect(result).toEqual(expectedLocation);
    });

    it('should mock Prisma location methods', () => {
        expect(jest.isMockFunction(prisma.location.findMany)).toBe(true);
        expect(jest.isMockFunction(prisma.location.create)).toBe(true);
    });
});
