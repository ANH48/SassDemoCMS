import { PaginatedResponse } from "../interfaces/paginated-response.interface";
import { PaginationQueryDto, SortOrder } from "../dto/pagination-query.dto";

interface PaginateOptions {
  searchFields?: string[];
  where?:        Record<string, unknown>;
  include?:      Record<string, unknown>;
}

/**
 * Generic paginator for Prisma delegates.
 * Accepts any Prisma delegate that has `findMany` and `count`.
 */
export async function paginate<T>(
  delegate: { findMany: (args: any) => Promise<T[]>; count: (args?: any) => Promise<number> },
  query: PaginationQueryDto,
  options: PaginateOptions = {},
): Promise<PaginatedResponse<T>> {
  const { page, limit, search, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  let where: any = options.where ? { ...options.where } : {};

  if (search && options.searchFields?.length) {
    where = {
      ...where,
      OR: options.searchFields.map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      })),
    };
  }

  const orderBy: any = sortBy
    ? { [sortBy]: sortOrder === SortOrder.DESC ? "desc" : "asc" }
    : { createdAt: "desc" };

  const [data, total] = await Promise.all([
    delegate.findMany({ where, skip, take: limit, orderBy, include: options.include }),
    delegate.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
