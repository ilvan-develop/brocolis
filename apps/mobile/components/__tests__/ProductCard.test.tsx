import { fireEvent, render, screen } from "@testing-library/react-native";
import { ProductCard } from "@/components/ProductCard";
import type { MarketOffer } from "@/lib/api";

const push = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push }),
}));

const baseOffer: MarketOffer = {
  id: "offer_1",
  productId: "prod_1",
  pharmacyId: "pharm_1",
  priceMoney: { amount: 1500, currency: "AOA" },
  stock: 10,
  prescriptionRequired: false,
  status: "ACTIVE",
  product: {
    id: "prod_1",
    name: "Paracetamol 500mg",
    dosage: "500mg",
    form: "Comprimido",
  },
  pharmacy: { id: "pharm_1", name: "Farmácia Central", verified: true },
};

beforeEach(() => {
  push.mockClear();
});

describe("ProductCard", () => {
  it("renders the product name and formatted price", () => {
    render(<ProductCard offer={baseOffer} />);

    expect(screen.getByText("Paracetamol 500mg")).toBeTruthy();
    expect(screen.getByText(/1.500 ?Kz/)).toBeTruthy();
  });

  it("shows the pharmacy name and a verified mark when verified", () => {
    render(<ProductCard offer={baseOffer} />);
    expect(screen.getByText("Farmácia Central")).toBeTruthy();
    expect(screen.getByText("✓")).toBeTruthy();
  });

  it("shows an Rx badge when a prescription is required", () => {
    render(
      <ProductCard offer={{ ...baseOffer, prescriptionRequired: true }} />,
    );
    expect(screen.getByText("Rx")).toBeTruthy();
  });

  it("shows out-of-stock instead of the add affordance when stock is 0", () => {
    render(<ProductCard offer={{ ...baseOffer, stock: 0 }} />);
    expect(screen.getByText("Sem stock")).toBeTruthy();
  });

  it("navigates to the product detail screen on press", () => {
    render(<ProductCard offer={baseOffer} />);

    fireEvent.press(screen.getByRole("button"));

    expect(push).toHaveBeenCalledWith("/product/offer_1");
  });
});
