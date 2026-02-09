import { AvatarViewModel } from '../AvatarViewModel';
import { avatar$ } from '@src/models/AvatarModel';

describe('AvatarViewModel', () => {
    let viewModel: AvatarViewModel;

    beforeEach(() => {
        // Reset the avatar state before each test
        avatar$.set({ emoji: '' });
        viewModel = new AvatarViewModel();
    });

    it('should initialize with empty avatar', () => {
        expect(viewModel.avatar$.get().emoji).toBe('');
        expect(viewModel.isValid$.get()).toBe(false);
    });

    it('should update avatar emoji', () => {
        // Act
        viewModel.updateAvatar('🙂');

        // Assert
        expect(viewModel.avatar$.get().emoji).toBe('🙂');
        expect(viewModel.isValid$.get()).toBe(true);
    });

    it('should clear avatar', () => {
        // Arrange
        viewModel.updateAvatar('🙂');
        expect(viewModel.avatar$.get().emoji).toBe('🙂');

        // Act
        viewModel.clearAvatar();

        // Assert
        expect(viewModel.avatar$.get().emoji).toBe('');
        expect(viewModel.isValid$.get()).toBe(false);
    });

    it('should validate avatar correctly', () => {
        // Empty avatar
        expect(viewModel.isValid$.get()).toBe(false);

        // Valid avatar
        viewModel.updateAvatar('🙂');
        expect(viewModel.isValid$.get()).toBe(true);

        // Whitespace only
        viewModel.updateAvatar('   ');
        expect(viewModel.isValid$.get()).toBe(false);
    });
}); 