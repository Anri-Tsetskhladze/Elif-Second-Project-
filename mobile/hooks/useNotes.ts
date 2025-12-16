import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useApiClient, noteApi } from "../utils/api";
import { Note, NoteType } from "../types";

interface NoteFilters {
  subject?: string;
  course?: string;
  noteType?: NoteType;
  sortBy?: "newest" | "popular" | "mostDownloaded";
  search?: string;
}

export const useNotes = (filters?: NoteFilters) => {
  const api = useApiClient();

  const query = useInfiniteQuery({
    queryKey: ["notes", filters],
    queryFn: ({ pageParam = 1 }) =>
      noteApi.getAll(api, { ...filters, page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const notes = query.data?.pages.flatMap((page) => page.data.notes) || [];

  return {
    notes: notes as Note[],
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

export const useUniversityNotes = (
  universityId: string,
  filters?: NoteFilters
) => {
  const api = useApiClient();

  const query = useInfiniteQuery({
    queryKey: ["notes", "university", universityId, filters],
    queryFn: ({ pageParam = 1 }) =>
      noteApi.getByUniversity(api, universityId, {
        ...filters,
        page: pageParam,
        limit: 10,
      }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!universityId,
  });

  const notes = query.data?.pages.flatMap((page) => page.data.notes) || [];
  const stats = query.data?.pages[0]?.data.stats;

  return {
    notes: notes as Note[],
    stats,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

export const useSubjectNotes = (
  subject: string,
  universityId?: string
) => {
  const api = useApiClient();

  const query = useInfiniteQuery({
    queryKey: ["notes", "subject", subject, universityId],
    queryFn: ({ pageParam = 1 }) =>
      noteApi.getBySubject(api, subject, {
        universityId,
        page: pageParam,
        limit: 10,
      }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!subject,
  });

  const notes = query.data?.pages.flatMap((page) => page.data.notes) || [];

  return {
    notes: notes as Note[],
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
};

export const useUserNotes = (userId: string) => {
  const api = useApiClient();

  const query = useInfiniteQuery({
    queryKey: ["notes", "user", userId],
    queryFn: ({ pageParam = 1 }) =>
      noteApi.getByUser(api, userId, { page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!userId,
  });

  const notes = query.data?.pages.flatMap((page) => page.data.notes) || [];

  return {
    notes: notes as Note[],
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
};

export const useSavedNotes = () => {
  const api = useApiClient();

  const query = useInfiniteQuery({
    queryKey: ["notes", "saved"],
    queryFn: ({ pageParam = 1 }) =>
      noteApi.getSaved(api, { page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const notes = query.data?.pages.flatMap((page) => page.data.notes) || [];

  return {
    notes: notes as Note[],
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

export const useNote = (noteId: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["note", noteId],
    queryFn: () => noteApi.getById(api, noteId),
    select: (response) => response.data.note as Note,
    enabled: !!noteId,
  });
};

export const useNoteActions = (universityId?: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const createNote = useMutation({
    mutationFn: (formData: FormData) => noteApi.create(api, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      if (universityId) {
        queryClient.invalidateQueries({ queryKey: ["notes", "university", universityId] });
      }
    },
  });

  const updateNote = useMutation({
    mutationFn: ({ noteId, data }: {
      noteId: string;
      data: {
        title?: string;
        description?: string;
        subject?: string;
        course?: string;
        professor?: string;
        semester?: string;
        noteType?: string;
        tags?: string[];
        isPublic?: boolean;
      };
    }) => noteApi.update(api, noteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["note", variables.noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => noteApi.delete(api, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const toggleLike = useMutation({
    mutationFn: (noteId: string) => noteApi.toggleLike(api, noteId),
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const toggleSave = useMutation({
    mutationFn: (noteId: string) => noteApi.toggleSave(api, noteId),
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const getDownloadUrl = useMutation({
    mutationFn: (noteId: string) => noteApi.getDownloadUrl(api, noteId),
  });

  return {
    createNote: createNote.mutateAsync,
    updateNote: updateNote.mutateAsync,
    deleteNote: deleteNote.mutate,
    toggleLike: toggleLike.mutate,
    toggleSave: toggleSave.mutate,
    getDownloadUrl: getDownloadUrl.mutateAsync,
    isCreating: createNote.isPending,
    isUpdating: updateNote.isPending,
    isDeleting: deleteNote.isPending,
  };
};

export const useSubjectSuggestions = (query: string, universityId?: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["subjects", "suggestions", query, universityId],
    queryFn: () => noteApi.getSubjectSuggestions(api, query, universityId),
    select: (response) => response.data.suggestions as string[],
    enabled: query.length >= 2,
  });
};

export const useCourseSuggestions = (query: string, universityId?: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["courses", "suggestions", query, universityId],
    queryFn: () => noteApi.getCourseSuggestions(api, query, universityId),
    select: (response) => response.data.suggestions as string[],
    enabled: query.length >= 2,
  });
};

export const usePopularSubjects = (universityId?: string, limit = 10) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["subjects", "popular", universityId, limit],
    queryFn: () => noteApi.getPopularSubjects(api, universityId, limit),
    select: (response) => response.data.subjects as { subject: string; count: number }[],
  });
};
