import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PlatformSelect } from "./platform-select";

describe("PlatformSelect", () => {
  it("marks only the selected option checked", () => {
    render(<PlatformSelect value="linkedin" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "LinkedIn" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Generic" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("has exactly one tab stop, on the selected option (roving tabindex)", () => {
    render(<PlatformSelect value="instagram" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Instagram" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Generic" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("radio", { name: "LinkedIn" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("radio", { name: "X / Twitter" })).toHaveAttribute("tabindex", "-1");
  });

  it("moves selection and focus to the next option on ArrowRight", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlatformSelect value="generic" onChange={onChange} />);

    screen.getByRole("radio", { name: "Generic" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("linkedin");
  });

  it("wraps from the last option to the first on ArrowRight", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlatformSelect value="twitter" onChange={onChange} />);

    screen.getByRole("radio", { name: "X / Twitter" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("generic");
  });

  it("wraps from the first option to the last on ArrowLeft", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlatformSelect value="generic" onChange={onChange} />);

    screen.getByRole("radio", { name: "Generic" }).focus();
    await user.keyboard("{ArrowLeft}");

    expect(onChange).toHaveBeenCalledWith("twitter");
  });

  it("Home and End jump to the first and last option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlatformSelect value="linkedin" onChange={onChange} />);

    screen.getByRole("radio", { name: "LinkedIn" }).focus();
    await user.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith("twitter");

    await user.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith("generic");
  });
});
