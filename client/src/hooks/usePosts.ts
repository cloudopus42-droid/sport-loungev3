import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import type { Post } from '@/types';

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  fetchMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePosts(): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);

  const fetchMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const { data } = await api.get<{ posts: Post[]; total: number; page: number; limit: number; hasMore: boolean }>('/api/posts', {
        params: { page, limit: 10 },
      });

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id));
        const newPosts = data.posts.filter((p) => !existingIds.has(p._id));
        return [...prev, ...newPosts];
      });
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [page, hasMore]);

  const refresh = useCallback(async () => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchingRef.current = false;

    setLoading(true);
    try {
      const { data } = await api.get<{ posts: Post[]; total: number; page: number; limit: number; hasMore: boolean }>('/api/posts', {
        params: { page: 1, limit: 10 },
      });
      setPosts(data.posts);
      setHasMore(data.hasMore);
      setPage(2);
    } catch (error) {
      console.error('Failed to refresh posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { posts, loading, hasMore, fetchMore, refresh };
}
