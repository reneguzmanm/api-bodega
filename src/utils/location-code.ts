
export type LocationCodeParts = {
    zone: string;
    aisle: number;
    rack: number;
    level: number;
    position: number;
};

export const formatLocationCode = (
    location: LocationCodeParts
): string => {
    const { zone, aisle, rack, level, position } = location;

    return [
        `${zone.toUpperCase()}${String(aisle).padStart(2, '0')}`,
        `R${String(rack).padStart(2, '0')}`,
        `N${String(level).padStart(2, '0')}`,
        `P${String(position).padStart(2, '0')}`
    ].join('-');
};
