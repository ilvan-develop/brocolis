import { aoMarket } from "./ao/config.js";
import { keMarket } from "./ke/config.js";
import { mzMarket } from "./mz/config.js";
import { ngMarket } from "./ng/config.js";
import type { Market } from "./types.js";

const markets = new Map<string, Market>([
  ["AO", aoMarket],
  ["MZ", mzMarket],
  ["KE", keMarket],
  ["NG", ngMarket],
]);

export function getMarket(marketCode: string): Market {
  const market = markets.get(marketCode.toUpperCase());
  if (!market) {
    throw new Error(`Market não suportado: ${marketCode}`);
  }
  return market;
}

export function listMarkets(): Market[] {
  return [...markets.values()];
}

export { aoMarket } from "./ao/config.js";
export { keMarket } from "./ke/config.js";
export { mzMarket } from "./mz/config.js";
export { ngMarket } from "./ng/config.js";
export type { Market } from "./types.js";
