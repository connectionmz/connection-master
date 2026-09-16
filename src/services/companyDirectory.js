import { get, ref } from 'firebase/database';
import { createCompanyDirectory } from '../utils/companyDirectory';

export const loadPublicCompanyDirectory = async (database) => {
  const publicSnapshot = await get(ref(database, 'publicCompanies'));
  if (publicSnapshot.exists()) return createCompanyDirectory(publicSnapshot.val() || {}, { assumeBusiness: true });
  const legacySnapshot = await get(ref(database, 'company'));
  return createCompanyDirectory(legacySnapshot.val() || {});
};
