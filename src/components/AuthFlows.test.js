import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { sendEmailVerification, updatePassword } from 'firebase/auth';
import EmailVerification from './EmailVerification';
import ChangePassword from './password/ChangePassword';
import { useLanguage } from '../context/LanguageContext';

jest.mock('../fb', () => ({
  auth: { currentUser: { email: 'person@example.com' } },
}));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(() => Promise.resolve()),
  sendEmailVerification: jest.fn(() => Promise.resolve()),
  updatePassword: jest.fn(() => Promise.resolve()),
  reauthenticateWithCredential: jest.fn(() => Promise.resolve()),
  EmailAuthProvider: { credential: jest.fn(() => 'credential') },
}));
jest.mock('../context/LanguageContext', () => ({ useLanguage: jest.fn() }));

const translations = {
  'auth.email': 'Email',
  'auth.currentPassword': 'Current password',
  'auth.newPassword': 'New password',
  'auth.confirmPassword': 'Confirm new password',
  'password.changeTitle': 'Change password',
  'password.update': 'Update password',
  'password.error.mismatch': 'The passwords do not match.',
  'password.error.unauthenticated': 'User is not authenticated.',
  'password.error.generic': 'Could not update password.',
  'password.success': 'Password updated successfully.',
  'emailVerification.title': 'Verify your email',
  'emailVerification.description': 'We sent a message to {email}.',
  'emailVerification.support': 'Contact',
  'emailVerification.resend': 'Resend verification email',
  'emailVerification.signOut': 'Sign out and return to login',
  'emailVerification.sent': 'Verification email resent.',
  'emailVerification.error': 'Could not resend.',
  'emailVerification.noUser': 'Session ended.',
};

describe('authentication support flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLanguage.mockReturnValue({
      t: (key, values = {}) => {
        const message = translations[key] || key;
        return Object.entries(values).reduce(
          (result, [name, value]) => result.replace(`{${name}}`, value),
          message,
        );
      },
    });
  });

  it('uses the authenticated email and provides inline resend feedback', async () => {
    render(<MemoryRouter><EmailVerification /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Verify your email' })).toBeInTheDocument();
    expect(screen.getByText(/person@example.com/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resend verification email' }));

    await waitFor(() => expect(sendEmailVerification).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Verification email resent.')).toBeInTheDocument();
  });

  it('rejects mismatched new passwords before calling Firebase', () => {
    render(<ChangePassword />);

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'Current1!' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPassword1!' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Different1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('The passwords do not match.')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });
});
