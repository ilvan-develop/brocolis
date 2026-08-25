import { CatalogService } from "./src/catalog/catalog.service.ts";

console.log("class:", typeof CatalogService);
const s = new CatalogService();
console.log("instance:", typeof s);
console.log("search:", typeof s.search);
