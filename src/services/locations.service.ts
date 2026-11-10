
import { prisma } from '../lib/prisma';
import { LocationCodeParts } from '../utils/location-code';

export type CreateLocationInput = LocationCodeParts & {
    description?: string;
};

export const getAllLocations = async () => {
    return prisma.location.findMany({
        orderBy: [
            { zone: 'asc' },
            { aisle: 'asc' },
            { rack: 'asc' },
            { level: 'asc' },
            { position: 'asc' }
        ]
    });
};

export const createLocation = async (
    locationData: CreateLocationInput
) => {
    return prisma.location.create({
        data: locationData
    });
};
