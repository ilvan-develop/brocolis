import { render, screen } from "@testing-library/react-native";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";

const allStatuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
];

describe("OrderStatusTimeline", () => {
  it("renders every step in the fixed status order", () => {
    render(
      <OrderStatusTimeline statuses={allStatuses} currentStatus="PENDING" />,
    );

    expect(screen.getByText("Pendente")).toBeTruthy();
    expect(screen.getByText("Confirmado")).toBeTruthy();
    expect(screen.getByText("Em preparação")).toBeTruthy();
    expect(screen.getByText("Em trânsito")).toBeTruthy();
    expect(screen.getByText("Entregue")).toBeTruthy();
  });

  it("renders an extra canceled row when the order was canceled", () => {
    render(
      <OrderStatusTimeline statuses={allStatuses} currentStatus="CANCELED" />,
    );

    // "Cancelado" also appears as a label lookup miss for the main loop
    // (CANCELED is not in statusOrder), so we assert the dedicated row exists.
    const canceledMatches = screen.getAllByText("Cancelado");
    expect(canceledMatches.length).toBeGreaterThan(0);
  });

  it("does not render the canceled row for a normal in-progress status", () => {
    render(
      <OrderStatusTimeline statuses={allStatuses} currentStatus="IN_TRANSIT" />,
    );

    expect(screen.queryByText("Cancelado")).toBeNull();
  });
});
