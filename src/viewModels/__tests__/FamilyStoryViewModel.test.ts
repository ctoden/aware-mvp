import { FamilyStoryViewModel } from '../FamilyStoryViewModel';
import { familyStory$ } from '@src/models/FamilyStoryModel';
import { withViewModel } from '../ViewModel';

describe('FamilyStoryViewModel', () => {
    let viewModel: FamilyStoryViewModel;

    beforeEach(async () => {
        // Reset the model state before each test
        familyStory$.story.set('');
        viewModel = await withViewModel(FamilyStoryViewModel);
    });

    it('should initialize with empty story', () => {
        expect(viewModel.story$.get()).toBe('');
        expect(viewModel.isValid$.get()).toBe(false);
    });

    it('should update story and validity when story is updated', () => {
        viewModel.updateStory('Test story');
        
        expect(viewModel.story$.get()).toBe('Test story');
        expect(viewModel.isValid$.get()).toBe(true);
    });

    it('should be invalid when story is empty or only whitespace', () => {
        viewModel.updateStory('   ');
        
        expect(viewModel.story$.get()).toBe('   ');
        expect(viewModel.isValid$.get()).toBe(false);
    });
}); 