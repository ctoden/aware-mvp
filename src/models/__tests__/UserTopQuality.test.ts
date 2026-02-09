import { Colors } from 'react-native-ui-lib';
import { userTopQualities$, UserTopQuality, getUserTopQualitiesArray, getTopQualitiesCount, findQualityByTitle, upsertQuality, removeQuality, clearQualities, getQualityColor, setQualityColor, setQualityLevel } from '../UserTopQuality';
import { customColors } from '@app/constants/theme';

describe('UserTopQuality Model', () => {
    const mockQuality1: UserTopQuality = {
        id: 'test-id-1',
        user_id: 'user-1',
        title: 'Rationality',
        level: 'Very high',
        description: 'Test description 1',
        color: '#7B40C6',
        score: 95,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    const mockQuality2: UserTopQuality = {
        id: 'test-id-2',
        user_id: 'user-1',
        title: 'Openness',
        level: 'High',
        description: 'Test description 2',
        color: '#255FA9',
        score: 85,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    beforeEach(() => {
        // Clear the observable state before each test
        clearQualities();
    });

    describe('Observable State Management', () => {
        it('should initialize with null state', () => {
            expect(userTopQualities$.peek()).toBeNull();
        });

        it('should update state when qualities are upserted', () => {
            upsertQuality(mockQuality1);
            expect(userTopQualities$.peek()).toHaveProperty(mockQuality1.id);
            expect(userTopQualities$.peek()?.[mockQuality1.id]).toEqual(mockQuality1);
        });

        it('should clear state when clearQualities is called', () => {
            upsertQuality(mockQuality1);
            clearQualities();
            expect(userTopQualities$.peek()).toBeNull();
        });
    });

    describe('getUserTopQualitiesArray', () => {
        it('should return empty array when no qualities exist', () => {
            expect(getUserTopQualitiesArray()).toEqual([]);
        });

        it('should return array of all qualities', () => {
            upsertQuality(mockQuality1);
            upsertQuality(mockQuality2);
            const qualities = getUserTopQualitiesArray();
            expect(qualities).toHaveLength(2);
            expect(qualities).toContainEqual(mockQuality1);
            expect(qualities).toContainEqual(mockQuality2);
        });
    });

    describe('getTopQualitiesCount', () => {
        it('should return 0 when no qualities exist', () => {
            expect(getTopQualitiesCount()).toBe(0);
        });

        it('should return correct count of qualities', () => {
            upsertQuality(mockQuality1);
            expect(getTopQualitiesCount()).toBe(1);
            upsertQuality(mockQuality2);
            expect(getTopQualitiesCount()).toBe(2);
        });
    });

    describe('findQualityByTitle', () => {
        it('should return undefined when quality not found', () => {
            expect(findQualityByTitle('NonExistent')).toBeUndefined();
        });

        it('should find quality by title', () => {
            upsertQuality(mockQuality1);
            upsertQuality(mockQuality2);
            const found = findQualityByTitle('Rationality');
            expect(found).toEqual(mockQuality1);
        });

        it('should return undefined when qualities list is empty', () => {
            expect(findQualityByTitle('Rationality')).toBeUndefined();
        });
    });

    describe('upsertQuality', () => {
        it('should add new quality', () => {
            upsertQuality(mockQuality1);
            expect(userTopQualities$.peek()?.[mockQuality1.id]).toEqual(mockQuality1);
        });

        it('should update existing quality', () => {
            upsertQuality(mockQuality1);
            const updatedQuality = { ...mockQuality1, level: 'Medium' };
            upsertQuality(updatedQuality);
            expect(userTopQualities$.peek()?.[mockQuality1.id]).toEqual(updatedQuality);
        });
    });

    describe('removeQuality', () => {
        it('should remove quality by id', () => {
            upsertQuality(mockQuality1);
            upsertQuality(mockQuality2);
            removeQuality(mockQuality1.id);
            expect(userTopQualities$.peek()?.[mockQuality1.id]).toBeUndefined();
            expect(userTopQualities$.peek()?.[mockQuality2.id]).toEqual(mockQuality2);
        });

        it('should handle removing non-existent quality', () => {
            upsertQuality(mockQuality1);
            removeQuality('non-existent-id');
            expect(userTopQualities$.peek()?.[mockQuality1.id]).toEqual(mockQuality1);
        });

        it('should handle removing from empty state', () => {
            removeQuality('test-id');
            expect(userTopQualities$.peek()).toBeNull();
        });
    });

    describe('setQualityLevel', () => {
        it('should set level to Highest for score >= 95', () => {
            const quality = { ...mockQuality1, score: 95 };
            setQualityLevel(quality);
            expect(quality.level).toBe('Highest');
        });

        it('should set level to Very High for score >= 85', () => {
            const quality = { ...mockQuality1, score: 85 };
            setQualityLevel(quality);
            expect(quality.level).toBe('Very High');
        });

        it('should set level to High for score >= 70', () => {
            const quality = { ...mockQuality1, score: 70 };
            setQualityLevel(quality);
            expect(quality.level).toBe('High');
        });

        it('should set level to Medium for score >= 55', () => {
            const quality = { ...mockQuality1, score: 55 };
            setQualityLevel(quality);
            expect(quality.level).toBe('Medium');
        });

        it('should set level to Low for score >= 40', () => {
            const quality = { ...mockQuality1, score: 40 };
            setQualityLevel(quality);
            expect(quality.level).toBe('Low');
        });

        it('should set level to Very Low for score >= 25', () => {
            const quality = { ...mockQuality1, score: 25 };
            setQualityLevel(quality);
            expect(quality.level).toBe('Very Low');
        });

        it('should set level to Lowest for score < 25', () => {
            const quality = { ...mockQuality1, score: 24 };
            setQualityLevel(quality);
            expect(quality.level).toBe('Lowest');
        });
    });

    describe('getQualityColor', () => {
        it('should return correct color for known quality titles', () => {
            const quality = { ...mockQuality1, title: 'extraverted' };
            expect(getQualityColor(quality)).toBe(customColors.lime);

            quality.title = 'emotionalStability';
            expect(getQualityColor(quality)).toBe(customColors.salmon);

            quality.title = 'agreeableness';
            expect(getQualityColor(quality)).toBe(customColors.marigold);

            quality.title = 'spirituality';
            expect(getQualityColor(quality)).toBe(customColors.orchid);

            quality.title = 'honestyHumility';
            expect(getQualityColor(quality)).toBe(customColors.seafoam);

            quality.title = 'conscientiousness';
            expect(getQualityColor(quality)).toBe(customColors.red);

            quality.title = 'rationality';
            expect(getQualityColor(quality)).toBe(customColors.blue);

            quality.title = 'openness';
            expect(getQualityColor(quality)).toBe(customColors.lavender);
        });

        it('should return default text color for unknown quality title', () => {
            const quality = { ...mockQuality1, title: 'unknown' };
            expect(getQualityColor(quality)).toBe(Colors.$textDefault);
        });
    });

    describe('setQualityColor', () => {
        it('should set correct color based on quality title', () => {
            const quality = { ...mockQuality1, title: 'extraverted' };
            setQualityColor(quality);
            expect(quality.color).toBe(customColors.lime);
        });

        it('should set default text color for unknown quality title', () => {
            const quality = { ...mockQuality1, title: 'unknown' };
            setQualityColor(quality);
            expect(quality.color).toBe(Colors.$textDefault);
        });
    });
}); 