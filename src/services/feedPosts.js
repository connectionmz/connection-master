import { endBefore, get, limitToLast, orderByChild, query, ref } from 'firebase/database';
import { isPostPublic } from '../utils/postData';
import { normalizeFeedPost, normalizePublicFeedPosts } from '../utils/feedPosts';

const RAW_BATCH_SIZE = 18;
const MAX_BATCHES_PER_PAGE = 5;

// Lê só uma fatia das publicações (as mais recentes antes do cursor), ordenada no servidor.
const fetchRawBatch = async (database, before) => {
  const constraints = [orderByChild('timestamp')];
  if (before) constraints.push(endBefore(before.timestamp, before.id));
  constraints.push(limitToLast(RAW_BATCH_SIZE));

  const snapshot = await get(query(ref(database, 'posts'), ...constraints));
  const entries = [];
  snapshot.forEach((child) => { entries.push([child.key, child.val()]); });
  return entries.reverse();
};

// Devolve pelo menos `minPublic` publicações públicas (quando existirem), do mais recente para o mais antigo.
export const loadPublicPostsPage = async (database, { minPublic, before = null }) => {
  const posts = [];
  let cursor = before;
  let exhausted = false;

  for (let batch = 0; batch < MAX_BATCHES_PER_PAGE && posts.length < minPublic && !exhausted; batch += 1) {
    const entries = await fetchRawBatch(database, cursor);
    exhausted = entries.length < RAW_BATCH_SIZE;
    if (entries.length) {
      const [lastId, lastPost] = entries[entries.length - 1];
      cursor = { id: lastId, timestamp: lastPost?.timestamp ?? null };
    }
    entries
      .filter(([, post]) => isPostPublic(post))
      .forEach(([postId, post]) => posts.push(normalizeFeedPost(postId, post)));
  }

  return { posts, cursor, hasMore: !exhausted };
};

// Só usado ao pesquisar/filtrar: o texto das publicações é leve; as imagens só carregam para os cartões visíveis.
export const loadAllPublicPosts = async (database) => {
  const snapshot = await get(ref(database, 'posts'));
  return normalizePublicFeedPosts(snapshot.val());
};
