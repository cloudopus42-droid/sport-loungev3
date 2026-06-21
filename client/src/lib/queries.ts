import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Keys ───
export const keys = {
  posts: (params?: any) => ['posts', params] as const,
  post: (id: string) => ['posts', id] as const,
  orders: (params?: any) => ['orders', params] as const,
  myOrders: (params?: any) => ['orders', 'my', params] as const,
  bookings: (params?: any) => ['bookings', params] as const,
  myBookings: (params?: any) => ['bookings', 'my', params] as const,
  mixes: (params?: any) => ['mixes', params] as const,
  promos: (params?: any) => ['promos', params] as const,
  invitations: (params?: any) => ['invitations', params] as const,
  showcases: () => ['showcases'] as const,
  tobacco: () => ['tobacco'] as const,
  restock: () => ['restock'] as const,
  memberships: () => ['memberships', 'me'] as const,
  reviews: (params?: any) => ['reviews', params] as const,
  smartFeatures: () => ['smart-features', 'status'] as const,
};

// ─── Posts ───
export function usePosts(params?: any) {
  return useQuery({
    queryKey: keys.posts(params),
    queryFn: ({ signal }) => api.get('/api/posts', { params, signal }),
    staleTime: 30_000,
  });
}

// ─── Orders ───
export function useOrders(params?: any) {
  return useQuery({
    queryKey: keys.orders(params),
    queryFn: ({ signal }) => api.get('/api/orders', { params, signal }),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useMyOrders(params?: any) {
  return useQuery({
    queryKey: keys.myOrders(params),
    queryFn: ({ signal }) => api.get('/api/orders/my', { params, signal }),
    staleTime: 10_000,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// ─── Bookings ───
export function useBookings(params?: any) {
  return useQuery({
    queryKey: keys.bookings(params),
    queryFn: ({ signal }) => api.get('/api/bookings/all', { params, signal }),
    staleTime: 15_000,
  });
}

export function useMyBookings(params?: any) {
  return useQuery({
    queryKey: keys.myBookings(params),
    queryFn: ({ signal }) => api.get('/api/bookings/my', { params, signal }),
    staleTime: 15_000,
  });
}

// ─── Mixes ───
export function useMixes(params?: any) {
  return useQuery({
    queryKey: keys.mixes(params),
    queryFn: ({ signal }) => api.get('/api/mixes', { params, signal }),
    staleTime: 60_000,
  });
}

// ─── Promos ───
export function usePromos(params?: any) {
  return useQuery({
    queryKey: keys.promos(params),
    queryFn: ({ signal }) => api.get('/api/promos', { params, signal }),
    staleTime: 30_000,
  });
}

// ─── Invitations ───
export function useInvitations(params?: any) {
  return useQuery({
    queryKey: keys.invitations(params),
    queryFn: ({ signal }) => api.get('/api/invitations', { params, signal }),
    staleTime: 30_000,
  });
}

// ─── Showcases ───
export function useShowcases() {
  return useQuery({
    queryKey: keys.showcases(),
    queryFn: ({ signal }) => api.get('/api/showcases', { signal }),
    staleTime: 60_000,
  });
}

// ─── Tobacco ───
export function useTobacco() {
  return useQuery({
    queryKey: keys.tobacco(),
    queryFn: ({ signal }) => api.get('/api/tobacco', { signal }),
    staleTime: 30_000,
  });
}

// ─── Memberships ───
export function useMembership() {
  return useQuery({
    queryKey: keys.memberships(),
    queryFn: ({ signal }) => api.get('/api/memberships/me', { signal }),
    staleTime: 60_000,
  });
}

export function useReviews(params?: any) {
  return useQuery({
    queryKey: keys.reviews(params),
    queryFn: ({ signal }) => api.get('/api/memberships/reviews', { params, signal }),
    staleTime: 30_000,
  });
}

// ─── Smart Features ───
export function useSmartFeaturesStatus() {
  return useQuery({
    queryKey: keys.smartFeatures(),
    queryFn: ({ signal }) => api.get('/api/smart-features/status', { signal }),
    staleTime: 10_000,
  });
}

export function useToggleSmartFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.put(`/api/smart-features/${id}`, { is_enabled: enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smart-features'] });
    },
  });
}

// ─── Like (optimistic) ───
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.post(`/api/posts/${postId}/like`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
