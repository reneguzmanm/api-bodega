
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '../generated/prisma/client';
import {
    getAllLocations,
    createLocation
} from '../services/locations.service';
import { formatLocationCode } from '../utils/location-code';

export const listLocations = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const locations = await getAllLocations();

        const result = locations.map(location => ({
            ...location,
            code: formatLocationCode(location)
        }));

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const addLocation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const {
            zone,
            aisle,
            rack,
            level,
            position,
            description
        } = req.body ?? {};

        const normalizedZone =
            typeof zone === 'string'
                ? zone.trim().toUpperCase()
                : '';

        if (!/^[A-Z]$/.test(normalizedZone)) {
            res.status(400).json({
                message: 'Invalid location zone'
            });
            return;
        }

        const dimensions = [aisle, rack, level, position];

        if (!dimensions.every(
            value => Number.isInteger(value) &&
                     value >= 1 &&
                     value <= 99
        )) {
            res.status(400).json({
                message: 'Location dimensions must be integers between 1 and 99'
            });
            return;
        }

        if (
            description !== undefined &&
            (
                typeof description !== 'string' ||
                description.length > 255
            )
        ) {
            res.status(400).json({
                message: 'Invalid location description',
            });
            return;
        }

        const location = await createLocation({
            zone: normalizedZone,
            aisle,
            rack,
            level,
            position,
            description: description?.trim(),
        });

        res.status(201).json({
            ...location,
            code: formatLocationCode(location),
        });

    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            res.status(409).json({
                message: 'Location already exists'
            });
            return;
        }
        next(error);
    }
};