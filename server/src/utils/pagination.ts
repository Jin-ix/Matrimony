export interface PaginationParams {
    cursor?: string;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
}

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
    return {
        cursor: typeof query.cursor === 'string' ? query.cursor : undefined,
        limit: typeof query.limit === 'string' ? Math.min(parseInt(query.limit, 10) || 20, 50) : 20,
    };
}
