import { jest } from "@jest/globals";
import { render, fireEvent, screen } from "@testing-library/react";
import SearchBar from "../SearchBar";

describe("SearchBar", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should render an input and a submit button", () => {
    render(<SearchBar />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("should render the default placeholder when none is provided", () => {
    render(<SearchBar />);

    expect(
      screen.getByPlaceholderText("Search books by title, author, or genre..."),
    ).toBeInTheDocument();
  });

  it("should render a custom placeholder when provided", () => {
    render(<SearchBar placeholder="Search a book..." />);

    expect(screen.getByPlaceholderText("Search a book...")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(
        "Search books by title, author, or genre...",
      ),
    ).not.toBeInTheDocument();
  });

  it("should apply the className to the form element", () => {
    const { container } = render(<SearchBar className="pt-5" />);

    const form = container.querySelector("form");
    expect(form).toHaveClass("pt-5");
  });

  it("should render an empty input when no props are given", () => {
    render(<SearchBar />);

    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("should update the input value when typing in uncontrolled mode", () => {
    render(<SearchBar />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "clean architecture" } });

    expect(input).toHaveValue("clean architecture");
  });

  it("should call onValueChange with the change event on every keystroke", () => {
    const onValueChange = jest.fn();
    render(<SearchBar onValueChange={onValueChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "refactoring" } });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: input }),
    );
    expect(input).toHaveValue("refactoring");
  });

  it("should keep the controlled value even when the input changes", () => {
    const onValueChange = jest.fn();
    render(
      <SearchBar value="domain driven design" onValueChange={onValueChange} />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "something else" } });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("domain driven design");
  });

  it("should re-render with the new controlled value", () => {
    const onValueChange = jest.fn();
    const { rerender } = render(
      <SearchBar value="" onValueChange={onValueChange} />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "clean" } });

    rerender(<SearchBar value="clean" onValueChange={onValueChange} />);

    expect(input).toHaveValue("clean");
  });

  it("should call onSubmit and prevent the default form submission", () => {
    const onSubmit = jest.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const event = onSubmit.mock.calls[0][0] as unknown as {
      defaultPrevented: boolean;
    };
    expect(event.defaultPrevented).toBe(true);
  });

  it("should call onSubmit when the form is submitted directly", () => {
    const onSubmit = jest.fn();
    const { container } = render(<SearchBar onSubmit={onSubmit} />);

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("should not throw when no callbacks are provided", () => {
    render(<SearchBar />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "anything" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(screen.getByRole("textbox")).toHaveValue("anything");
  });
});
