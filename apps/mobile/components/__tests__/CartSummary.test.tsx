import { render, screen } from "@testing-library/react-native";
import { CartSummary } from "@/components/CartSummary";

describe("CartSummary", () => {
  it("formats amounts using @brocolis/formatters (AOA -> Kz)", () => {
    render(
      <CartSummary subtotal={1500} currency="AOA" itemCount={1} />,
    );

    // formatCurrency(1500, "AOA") groups thousands and appends the Kz symbol.
    expect(screen.getByText(/1.500 ?Kz/)).toBeTruthy();
  });

  it("shows subtotal as the total when no explicit total is given", () => {
    render(<CartSummary subtotal={2000} currency="AOA" itemCount={2} />);

    const matches = screen.getAllByText(/2.000 ?Kz/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders delivery fee and VAT rows only when provided", () => {
    const { rerender } = render(
      <CartSummary subtotal={1000} currency="AOA" itemCount={1} />,
    );
    expect(screen.queryByText("Entrega")).toBeNull();

    rerender(
      <CartSummary
        subtotal={1000}
        currency="AOA"
        itemCount={1}
        deliveryFee={500}
        vat={140}
        total={1640}
      />,
    );
    expect(screen.getByText("Entrega")).toBeTruthy();
    expect(screen.getByText(/1.640 ?Kz/)).toBeTruthy();
  });
});
