import { Navigate } from 'react-router-dom';
import ProfileDesk from '../desktop/ProfileDesk';
import ProfileDeskSingular from '../desktop/ProfileDeskSingular';
import EditProfileDesk from '../desktop/EditProfileDesk';
import EditProfileDeskSingular from '../desktop/EditProfileDeskSingular';
import { getAccountKind } from '../../utils/accountType';

export const AccountProfileRoute = ({ user }) => {
  const accountKind = getAccountKind(user);
  if (accountKind === 'personal') return <ProfileDeskSingular user={user} />;
  if (accountKind === 'business') return <ProfileDesk user={user} />;
  return <Navigate to="/select-account-type" replace />;
};

export const AccountEditProfileRoute = ({ user }) => {
  const accountKind = getAccountKind(user);
  if (accountKind === 'personal') return <EditProfileDeskSingular user={user} />;
  if (accountKind === 'business') return <EditProfileDesk user={user} />;
  return <Navigate to="/select-account-type" replace />;
};
