export default {
  "*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,css,md,mdx,yml,yaml}":
    "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true",
};
