import { formatLocationCode } from '../src/utils/location-code';
import { describe, it, expect } from '@jest/globals';

describe('Location Code', () => {
    it('should format location components correctly', () => {
        const code = formatLocationCode({
            zone: 'A',
            aisle: 1,
            rack: 2,
            level: 3,
            position: 4
        });

        expect(code).toBe('A01-R02-N03-P04');
    });
});