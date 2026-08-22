export const meta = {
  name: "OrderTimeline",
  description:
    "Vertical timeline with connected dots showing order progression with timestamps",
  models: ["b2c"],
  pillars: {
    accessibility:
      "Each step has a visual dot, label text, and optional timestamp",
    composition: "OrderTimeline composes cn utility and statusOrder constants",
    responsiveness: "Vertical layout with flex-1 content area, fixed dot sizes",
    testability:
      "State-driven rendering based on currentStatus and steps array",
  },
} as const;
