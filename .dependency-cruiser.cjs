/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Proibidas dependências circulares entre módulos.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-cross-app-imports",
      severity: "error",
      comment: "apps nunca importam de outro app (AP-03).",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/([^/]+)/", pathNot: "^apps/$1/" },
    },
    {
      name: "packages-must-not-import-apps",
      severity: "error",
      comment: "packages nunca importam de apps.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "ui-must-not-depend-on-db",
      severity: "error",
      comment: "packages/ui não pode depender de packages/db.",
      from: { path: "packages/ui" },
      to: { path: "packages/db" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: "(^|/)(dist|\\.next|generated|node_modules)(/|$)",
    },
    tsConfig: { fileName: "tsconfig.base.json" },
  },
};
