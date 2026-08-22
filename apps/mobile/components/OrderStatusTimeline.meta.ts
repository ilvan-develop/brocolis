export const meta = {
  name: "OrderStatusTimeline",
  description:
    "Vertical timeline showing order progress through PENDING→DELIVERED states",
  models: ["b2c"],
  pillars: {
    accessibility: "Each step has a visual dot indicator and text label",
    composition:
      "OrderStatusTimeline composes cn utility and statusOrder constants",
    responsiveness:
      "Vertical layout, fixed dot sizes, text adapts to container",
    testability: "State-driven rendering based on currentStatus string",
  },
} as const;
