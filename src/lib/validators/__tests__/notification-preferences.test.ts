import { describe, it, expect } from "vitest";
import {
  notificationPreferencesSchema,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPES,
} from "../notification-preferences";

describe("notificationPreferencesSchema", () => {
  it("accepts all booleans", () => {
    const result = notificationPreferencesSchema.safeParse({
      quotas: true,
      announcements: false,
      meetings: true,
      maintenance: false,
      contracts: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = notificationPreferencesSchema.safeParse({
      quotas: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean values", () => {
    const result = notificationPreferencesSchema.safeParse({
      quotas: "yes",
      announcements: true,
      meetings: true,
      maintenance: false,
      contracts: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all-false preferences", () => {
    const result = notificationPreferencesSchema.safeParse({
      quotas: false,
      announcements: false,
      meetings: false,
      maintenance: false,
      contracts: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all-true preferences", () => {
    const result = notificationPreferencesSchema.safeParse({
      quotas: true,
      announcements: true,
      meetings: true,
      maintenance: true,
      contracts: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("NOTIFICATION_DEFAULTS", () => {
  it("enables quotas, announcements, and meetings by default", () => {
    expect(NOTIFICATION_DEFAULTS.quotas).toBe(true);
    expect(NOTIFICATION_DEFAULTS.announcements).toBe(true);
    expect(NOTIFICATION_DEFAULTS.meetings).toBe(true);
  });

  it("disables maintenance and contracts by default", () => {
    expect(NOTIFICATION_DEFAULTS.maintenance).toBe(false);
    expect(NOTIFICATION_DEFAULTS.contracts).toBe(false);
  });
});

describe("NOTIFICATION_TYPES", () => {
  it("has 5 notification types", () => {
    expect(NOTIFICATION_TYPES).toHaveLength(5);
  });

  it("each type has key, label, and description", () => {
    for (const t of NOTIFICATION_TYPES) {
      expect(t.key).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.description).toBeTruthy();
    }
  });

  it("type keys match defaults", () => {
    const keys = NOTIFICATION_TYPES.map((t) => t.key);
    expect(keys).toEqual(Object.keys(NOTIFICATION_DEFAULTS));
  });
});
