import { equalTo, get, onValue, orderByChild, query, ref } from 'firebase/database';
import { db } from '../fb';
import { normalizeCompanyPosts } from '../utils/postData';

const createCompanyPostsQuery = (companyId) => query(
  ref(db, 'posts'),
  orderByChild('company/id'),
  equalTo(companyId),
);

const getCompanyPosts = async (companyId) => {
  if (!companyId) return [];
  const snapshot = await get(createCompanyPostsQuery(companyId));
  return normalizeCompanyPosts(snapshot.val(), companyId);
};

const subscribeToCompanyPosts = (companyId, onPosts, onError) => {
  if (!companyId) {
    onPosts([]);
    return () => {};
  }

  return onValue(
    createCompanyPostsQuery(companyId),
    snapshot => onPosts(normalizeCompanyPosts(snapshot.val(), companyId)),
    onError,
  );
};

export { createCompanyPostsQuery, getCompanyPosts, subscribeToCompanyPosts };
