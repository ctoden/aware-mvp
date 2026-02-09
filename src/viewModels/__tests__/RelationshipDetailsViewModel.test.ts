import { RelationshipDetailsViewModel } from '../RelationshipDetailsViewModel';
import { relationshipDetails$ } from '@src/models/RelationshipDetailsModel';
import { withViewModel } from '../ViewModel';

describe('RelationshipDetailsViewModel', () => {
    let viewModel: RelationshipDetailsViewModel;

    beforeEach(async () => {
        // Reset the model state before each test
        relationshipDetails$.set([]);
        viewModel = await withViewModel(RelationshipDetailsViewModel);
    });

    it('should initialize with empty relationship details and default values', () => {
        expect(viewModel.relationshipDetails$.get()).toEqual([]);
        expect(viewModel.currentRelationshipType$.get()).toBe('Friend');
        expect(viewModel.currentName$.get()).toBe('');
        expect(viewModel.isValid$.get()).toBe(false);
    });

    it('should add relationship and reset form when addRelationship is called', () => {
        // Arrange
        const testName = 'John Doe';
        const testType = 'Family';
        viewModel.currentName$.set(testName);
        viewModel.currentRelationshipType$.set(testType);

        // Act
        viewModel.addRelationship();

        // Assert
        expect(viewModel.relationshipDetails$.get()).toEqual([
            { name: testName, relationshipType: testType }
        ]);
        expect(viewModel.currentName$.get()).toBe('');
        expect(viewModel.currentRelationshipType$.get()).toBe('Friend');
    });

    it('should remove relationship at specified index', () => {
        // Arrange
        viewModel.currentName$.set('John');
        viewModel.currentRelationshipType$.set('Family');
        viewModel.addRelationship();
        viewModel.currentName$.set('Jane');
        viewModel.currentRelationshipType$.set('Friend');
        viewModel.addRelationship();

        // Act
        viewModel.removeRelationship(0);

        // Assert
        expect(viewModel.relationshipDetails$.get()).toEqual([
            { name: 'Jane', relationshipType: 'Friend' }
        ]);
    });

    it('should be invalid when name is empty or only whitespace', () => {
        // Empty string
        viewModel.currentName$.set('');
        expect(viewModel.isValid$.get()).toBe(false);

        // Whitespace only
        viewModel.currentName$.set('   ');
        expect(viewModel.isValid$.get()).toBe(false);
    });

    it('should be valid when name has content', () => {
        viewModel.currentName$.set('John Doe');
        expect(viewModel.isValid$.get()).toBe(true);
    });
}); 