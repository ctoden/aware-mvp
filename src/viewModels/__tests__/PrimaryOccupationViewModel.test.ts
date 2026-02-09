import { PrimaryOccupationViewModel } from '../PrimaryOccupationViewModel';
import { primaryOccupation$ } from '@src/models/PrimaryOccupationModel';
import { withViewModel } from '../ViewModel';

describe('PrimaryOccupationViewModel', () => {
    let viewModel: PrimaryOccupationViewModel;

    beforeEach(async () => {
        // Reset the model state before each test
        primaryOccupation$.occupation.set('');
        viewModel = await withViewModel(PrimaryOccupationViewModel);
    });

    it('should initialize with empty occupation', () => {
        expect(viewModel.occupation$.get()).toBe('');
        expect(viewModel.isValid$.get()).toBe(false);
    });

    it('should update occupation and validity when occupation is updated', () => {
        viewModel.updateOccupation('Software Developer');
        
        expect(viewModel.occupation$.get()).toBe('Software Developer');
        expect(viewModel.isValid$.get()).toBe(true);
    });

    it('should be invalid when occupation is empty or only whitespace', () => {
        viewModel.updateOccupation('   ');
        
        expect(viewModel.occupation$.get()).toBe('   ');
        expect(viewModel.isValid$.get()).toBe(false);
    });
}); 