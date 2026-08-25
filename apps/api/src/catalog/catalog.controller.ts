import { Controller, Get, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service.js";

type RawQuery = Record<string, string | undefined>;

function coerceSearchQuery(query: RawQuery): Record<string, unknown> {
  return {
    ...query,
    page: query.page !== undefined ? Number(query.page) : undefined,
    pageSize: query.pageSize !== undefined ? Number(query.pageSize) : undefined,
    minPrice: query.minPrice !== undefined ? Number(query.minPrice) : undefined,
    maxPrice: query.maxPrice !== undefined ? Number(query.maxPrice) : undefined,
  };
}

@Controller("catalog")
export class CatalogController {
  private readonly catalog: CatalogService;

  constructor() {
    this.catalog = new CatalogService();
  }

  @Get("search")
  search(@Query() query: RawQuery) {
    return this.catalog.search(coerceSearchQuery(query));
  }
}
