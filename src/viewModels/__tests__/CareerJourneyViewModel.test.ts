import { CareerJourneyViewModel } from '../CareerJourneyViewModel';
import { careerJourney$ } from '@src/models/CareerJourneyModel';
import { withViewModel } from '../ViewModel';

describe('CareerJourneyViewModel', () => {
    let viewModel: CareerJourneyViewModel;

    beforeEach(async () => {
        // Reset the model state before each test
        careerJourney$.journey.set('');
        viewModel = await withViewModel(CareerJourneyViewModel);
    });

    it('should initialize with empty journey', () => {
        expect(viewModel.journey$.get()).toBe('');
        expect(viewModel.isValid$.get()).toBe(false);
    });

    it('should update journey and validity when journey is updated', () => {
        viewModel.updateJourney('Started as a junior developer, now a senior developer');
        
        expect(viewModel.journey$.get()).toBe('Started as a junior developer, now a senior developer');
        expect(viewModel.isValid$.get()).toBe(true);
    });

    it('should be invalid when journey is empty or only whitespace', () => {
        viewModel.updateJourney('   ');
        
        expect(viewModel.journey$.get()).toBe('   ');
        expect(viewModel.isValid$.get()).toBe(false);
    });
}); 