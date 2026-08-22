// k6 smoke load test (F7 — blueprint 09 §Fase 7: staging + load test).
// Uso: k6 run -e SMOKE_API_URL=https://staging-api.brocolis.ao -e SMOKE_WEB_URL=https://staging.brocolis.ao infra/load/k6-smoke.js
// Thresholds alinhados com blueprint 16 §9 (latência P95 < 500ms, erros < 5%).

import { check, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const failureRate = new Rate("smoke_failures");

const API_URL = __ENV.SMOKE_API_URL || "https://staging-api.brocolis.ao";
const WEB_URL = __ENV.SMOKE_WEB_URL || "https://staging.brocolis.ao";

export const options = {
  scenarios: {
    smoke: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "20s", target: 5 },
        { duration: "40s", target: 5 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<500"],
    smoke_failures: ["rate<0.05"],
  },
};

export default function () {
  const health = http.get(`${API_URL}/health`, {
    tags: { name: "GET /health" },
  });
  const healthOk = check(health, {
    "api /health status 200": (r) => r.status === 200,
    "api /health body ok": (r) => r.json("status") === "ok",
  });

  const home = http.get(WEB_URL, { tags: { name: "GET /" } });
  const homeOk = check(home, {
    "web / status 200": (r) => r.status === 200,
    "web / é HTML": (r) => r.body.includes("<html"),
  });

  failureRate.add(!healthOk || !homeOk);
  sleep(1);
}
