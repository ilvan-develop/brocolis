import { fireEvent, render, screen } from "@testing-library/react-native";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="O seu carrinho está vazio" />);
    expect(screen.getByText("O seu carrinho está vazio")).toBeTruthy();
  });

  it("renders the description when provided", () => {
    render(
      <EmptyState title="Vazio" description="Adicione produtos ao carrinho" />,
    );
    expect(screen.getByText("Adicione produtos ao carrinho")).toBeTruthy();
  });

  it("does not render an action button when actionLabel/onAction are missing", () => {
    render(<EmptyState title="Vazio" />);
    expect(screen.queryByText(/./)).toBeTruthy(); // title still renders
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders and triggers the action when both actionLabel and onAction are given", () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="Vazio"
        actionLabel="Continuar a comprar"
        onAction={onAction}
      />,
    );

    fireEvent.press(screen.getByText("Continuar a comprar"));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
