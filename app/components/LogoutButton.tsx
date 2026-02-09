import React from 'react';
import { Button } from 'react-native';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { showErrorToast } from '@src/utils/ToastUtils';

export const LogoutButton: React.FC = () => {
  const { viewModel } = useViewModel(NavigationViewModel);

  const handleLogout = async () => {
    if (viewModel) {
      try {
        const result = await viewModel.logout();
        if (result.isErr()) {
          throw new Error(result.error.message);
        }
      } catch (error) {
        console.error('Error during logout:', error);
        showErrorToast("Logout Failed", error instanceof Error ? error.message : "An unexpected error occurred");
      }
    }
  };

  return <Button title="Log Out" onPress={handleLogout} />;
};

export default LogoutButton;