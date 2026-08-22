import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button label="Confirmar" />);
    expect(screen.getByText("Confirmar")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Button label="Confirmar" onPress={onPress} />);

    fireEvent.press(screen.getByText("Confirmar"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    render(<Button label="Confirmar" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText("Confirmar"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("exposes accessibilityState.disabled when disabled", () => {
    render(<Button label="Confirmar" disabled />);
    const button = screen.getByRole("button");
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
  });
});
