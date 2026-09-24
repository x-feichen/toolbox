import { describe, expect, it } from "vitest";
import { isValidPasswordForm, validatePasswordForm } from "./password-validation";

const valid = { currentPassword: "old-pass-1", newPassword: "new-pass-123", confirmPassword: "new-pass-123" };

describe("validatePasswordForm", () => {
  it("accepts a valid form", () => {
    const errors = validatePasswordForm(valid);
    expect(errors).toEqual({});
    expect(isValidPasswordForm(errors)).toBe(true);
  });

  it("requires the current password", () => {
    const errors = validatePasswordForm({ ...valid, currentPassword: "" });
    expect(errors.currentPassword).toBeTruthy();
  });

  it("enforces the minimum length", () => {
    const errors = validatePasswordForm({ ...valid, newPassword: "short", confirmPassword: "short" });
    expect(errors.newPassword).toContain("8");
  });

  it("requires the confirmation to match", () => {
    const errors = validatePasswordForm({ ...valid, confirmPassword: "other-pass" });
    expect(errors.confirmPassword).toBeTruthy();
  });

  it("reports multiple problems at once", () => {
    const errors = validatePasswordForm({ currentPassword: "", newPassword: "1", confirmPassword: "2" });
    expect(Object.keys(errors)).toHaveLength(3);
    expect(isValidPasswordForm(errors)).toBe(false);
  });
});
