"use client"

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query"

// ---------- Types ----------
export interface User {
  id: string
  username: string
  email?: string
  bio?: string | null
  avatarUrl?: string | null
  createdAt?: string
  photoCount?: number
  followerCount?: number
  followingCount?: number
  isFollowing?: boolean
  isMe?: boolean
}

export interface Photo {
  id: string
  title: string
  description?: string | null
  imageUrl: string
  createdAt: string
  author: Pick<User, "id" | "username" | "avatarUrl"> & {
    bio?: string | null
    isFollowing?: boolean
  }
  tags: string[]
  likeCount: number
  commentCount: number
  likedByMe: boolean
  comments?: Comment[]
}

export interface Comment {
  id: string
  body: string
  createdAt: string
  author: Pick<User, "id" | "username" | "avatarUrl">
}

export interface Tag {
  id: string
  name: string
  count?: number
}

// ---------- Helpers ----------
async function jsonFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data
        ? String((data as Record<string, unknown>).error)
        : null) ?? `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

// ---------- Photos ----------
export interface PhotoListParams {
  sort?: "newest" | "popular"
  authorId?: string
  tag?: string
  search?: string
  followedOnly?: boolean
  take?: number
}

function buildPhotoListUrl(params: PhotoListParams, cursor?: string) {
  const sp = new URLSearchParams()
  if (params.sort) sp.set("sort", params.sort)
  if (params.authorId) sp.set("authorId", params.authorId)
  if (params.tag) sp.set("tag", params.tag)
  if (params.search) sp.set("search", params.search)
  if (params.followedOnly) sp.set("followedOnly", "true")
  if (params.take) sp.set("take", String(params.take))
  if (cursor) sp.set("cursor", cursor)
  return `/api/photos?${sp.toString()}`
}

export function usePhotosInfinite(params: PhotoListParams, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["photos", "list", params],
    queryFn: ({ pageParam }) =>
      jsonFetch<{ items: Photo[]; nextCursor: string | null }>(
        buildPhotoListUrl(params, pageParam)
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function usePhoto(photoId: string | null) {
  return useQuery({
    queryKey: ["photos", "detail", photoId],
    queryFn: () =>
      jsonFetch<Photo>(`/api/photos/${photoId}`),
    enabled: !!photoId,
  })
}

export function useCreatePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      title: string
      description?: string | null
      imageUrl: string
      tags?: string[]
    }) =>
      jsonFetch<Photo>("/api/photos", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["photos", "list"] })
      qc.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

export function useDeletePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (photoId: string) =>
      jsonFetch<{ success: boolean }>(`/api/photos/${photoId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["photos", "list"] })
      qc.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

// ---------- Likes ----------
export function useToggleLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ photoId }: { photoId: string }) =>
      jsonFetch<{ liked: boolean; likeCount: number }>(
        `/api/photos/${photoId}/like`,
        { method: "POST" }
      ),
    onMutate: async ({ photoId }) => {
      // optimistic update across all photo caches
      const keysToInvalidate: [string, string, PhotoListParams][] = []
      qc.getQueriesData({ queryKey: ["photos", "list"] }).forEach(([key, value]) => {
        if (!value) return
        keysToInvalidate.push(key as [string, string, PhotoListParams])
      })
      keysToInvalidate.forEach((key) => {
        qc.setQueriesData({ queryKey: key }, (old: unknown) => {
          if (!old) return old
          return {
            ...(old as object),
            pages: (old as { pages: { items: Photo[]; nextCursor: string | null }[] }).pages.map((page) => ({
              ...page,
              items: page.items.map((p) =>
                p.id === photoId
                  ? {
                      ...p,
                      likedByMe: !p.likedByMe,
                      likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
                    }
                  : p
              ),
            })),
          }
        })
      })
      // also update detail cache
      const detail = qc.getQueryData<Photo>(["photos", "detail", photoId])
      if (detail) {
        qc.setQueryData<Photo>(["photos", "detail", photoId], {
          ...detail,
          likedByMe: !detail.likedByMe,
          likeCount: detail.likeCount + (detail.likedByMe ? -1 : 1),
        })
      }
      return { photoId }
    },
    onError: (_err, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: ["photos"] })
    },
    onSuccess: (data, vars) => {
      qc.setQueryData<Photo>(["photos", "detail", vars.photoId], (old) =>
        old
          ? {
              ...old,
              likedByMe: data.liked,
              likeCount: data.likeCount,
            }
          : old
      )
    },
  })
}

// ---------- Comments ----------
export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      photoId,
      body,
    }: {
      photoId: string
      body: string
    }) =>
      jsonFetch<Comment>(`/api/photos/${photoId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: (comment, vars) => {
      qc.setQueryData<Photo>(["photos", "detail", vars.photoId], (old) => {
        if (!old) return old
        return {
          ...old,
          comments: [...(old.comments ?? []), comment],
          commentCount: (old.commentCount ?? 0) + 1,
        }
      })
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      commentId,
      photoId,
    }: {
      commentId: string
      photoId: string
    }) =>
      jsonFetch<{ success: boolean }>(`/api/comments/${commentId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, vars) => {
      qc.setQueryData<Photo>(["photos", "detail", vars.photoId], (old) => {
        if (!old) return old
        return {
          ...old,
          comments: (old.comments ?? []).filter((c) => c.id !== vars.commentId),
          commentCount: Math.max(0, (old.commentCount ?? 0) - 1),
        }
      })
    },
  })
}

// ---------- Follows ----------
export function useFollow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ followingId }: { followingId: string }) =>
      jsonFetch<{ following: boolean }>(`/api/follows`, {
        method: "POST",
        body: JSON.stringify({ followingId }),
      }),
    onMutate: async ({ followingId }) => {
      const userKey = ["users", "detail", followingId]
      const prev = qc.getQueryData<User>(userKey)
      qc.setQueryData<User>(userKey, (old) =>
        old
          ? {
              ...old,
              isFollowing: !old.isFollowing,
              followerCount: Math.max(
                0,
                (old.followerCount ?? 0) + (old.isFollowing ? -1 : 1)
              ),
            }
          : old
      )
      return { prev, userKey }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev && ctx.userKey) {
        qc.setQueryData(ctx.userKey, ctx.prev)
      }
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["users", "detail", vars.followingId] })
      qc.invalidateQueries({ queryKey: ["photos", "list"] })
    },
  })
}

// ---------- Users ----------
export function useUser(userId: string | null) {
  return useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => jsonFetch<User>(`/api/users/${userId}`),
    enabled: !!userId,
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: () =>
      jsonFetch<{ user: User | null }>(`/api/me`).then((d) => d.user),
    staleTime: 60_000,
  })
}

// ---------- Tags ----------
export function usePopularTags() {
  return useQuery({
    queryKey: ["tags", "popular"],
    queryFn: () =>
      jsonFetch<{ items: Tag[] }>(`/api/tags`).then((d) => d.items),
  })
}

export function useSearchTags(query: string) {
  return useQuery({
    queryKey: ["tags", "search", query],
    queryFn: () =>
      jsonFetch<{ items: Tag[] }>(
        `/api/tags/search?q=${encodeURIComponent(query)}`
      ).then((d) => d.items),
    enabled: query.trim().length > 0,
    placeholderData: keepPreviousData,
  })
}

// ---------- Auth ----------
export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      username: string
      email: string
      password: string
    }) =>
      jsonFetch<{ id: string; username: string; email: string }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify(input) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me"] })
      // User detail caches may have stale `isMe`/`isFollowing` flags from
      // before signup — invalidate so they refetch with the new session.
      qc.invalidateQueries({ queryKey: ["users", "detail"] })
    },
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      // get csrf token first
      const csrfRes = await fetch("/api/auth/csrf")
      const csrfJson = await csrfRes.json()
      const csrfToken = csrfJson.csrfToken as string

      const body = new URLSearchParams({
        csrfToken,
        email: input.email,
        password: input.password,
        redirect: "false",
        json: "true",
      })

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        redirect: "manual",
      })

      // NextAuth returns a 302 redirect on success (or error)
      // We'll then try to fetch the session to verify
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      if (!session?.user) {
        throw new Error("Invalid email or password")
      }
      return session
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me"] })
      qc.invalidateQueries({ queryKey: ["users", "detail"] })
      qc.invalidateQueries({ queryKey: ["photos"] })
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const csrfRes = await fetch("/api/auth/csrf")
      const csrfJson = await csrfRes.json()
      const csrfToken = csrfJson.csrfToken as string
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken,
          redirect: "false",
          json: "true",
        }),
      })
    },
    onSuccess: () => {
      qc.setQueryData(["users", "me"], null)
      qc.invalidateQueries({ queryKey: ["users", "me"] })
      // User detail caches contain `isMe` and `isFollowing` flags that depend
      // on the current session — invalidate so they refetch with the new
      // (logged-out) context.
      qc.invalidateQueries({ queryKey: ["users", "detail"] })
      qc.invalidateQueries({ queryKey: ["photos"] })
    },
  })
}

export function useSeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      jsonFetch<{ success: boolean; users: number; photos: number }>(
        "/api/seed",
        { method: "POST" }
      ),
    onSuccess: () => {
      qc.invalidateQueries()
    },
  })
}
