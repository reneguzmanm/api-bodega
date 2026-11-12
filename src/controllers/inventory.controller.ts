import { NextFunction, Request, Response } from "express";
import { getAllInventory } from "../services/inventory.service";
import { formatLocationCode } from "../utils/location-code";


export const listInventory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> =>{
    try {
        const inventory = await getAllInventory();

        const result = inventory.map(item => ({
            ...item,
            location:{
                ...item.location,
                code: formatLocationCode(item.location)
            }
        }));

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}