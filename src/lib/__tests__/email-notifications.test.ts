/**
 * Tests for email notification recipient filtering and preference logic.
 *
 * These test the pure logic of which recipients should receive notifications
 * based on their preferences, without actually sending emails.
 */

import { describe, it, expect } from "vitest";
import {
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPES,
} from "../validators/notification-preferences";

describe("Notification defaults", () => {
  it("quotas enabled by default", () => {
    expect(NOTIFICATION_DEFAULTS.quotas).toBe(true);
  });

  it("announcements enabled by default", () => {
    expect(NOTIFICATION_DEFAULTS.announcements).toBe(true);
  });

  it("meetings enabled by default", () => {
    expect(NOTIFICATION_DEFAULTS.meetings).toBe(true);
  });

  it("maintenance disabled by default", () => {
    expect(NOTIFICATION_DEFAULTS.maintenance).toBe(false);
  });

  it("contracts disabled by default", () => {
    expect(NOTIFICATION_DEFAULTS.contracts).toBe(false);
  });
});

describe("Notification recipient filtering logic", () => {
  // Simulates the getNotificationRecipients logic without DB calls
  type NotificationType = "quotas" | "announcements" | "meetings" | "maintenance" | "contracts";

  interface MockMember {
    userId: string;
    email: string;
    name: string;
    pref: Partial<Record<NotificationType, boolean>> | null; // null = use defaults
  }

  function filterRecipients(
    members: MockMember[],
    type: NotificationType,
    excludeUserId?: string
  ): { email: string; name: string }[] {
    return members
      .filter((m) => {
        if (excludeUserId && m.userId === excludeUserId) return false;
        if (m.pref) return m.pref[type] ?? NOTIFICATION_DEFAULTS[type];
        return NOTIFICATION_DEFAULTS[type];
      })
      .map((m) => ({ email: m.email, name: m.name }));
  }

  const members: MockMember[] = [
    { userId: "u1", email: "admin@test.com", name: "Admin", pref: null },
    { userId: "u2", email: "owner1@test.com", name: "Owner 1", pref: null },
    { userId: "u3", email: "owner2@test.com", name: "Owner 2", pref: { announcements: false } },
    { userId: "u4", email: "tenant@test.com", name: "Tenant", pref: { quotas: false, announcements: false, meetings: false } },
  ];

  it("default users receive announcements", () => {
    const recipients = filterRecipients(members, "announcements");
    const emails = recipients.map((r) => r.email);
    expect(emails).toContain("admin@test.com");
    expect(emails).toContain("owner1@test.com");
    expect(emails).not.toContain("owner2@test.com"); // opted out
    expect(emails).not.toContain("tenant@test.com"); // opted out
  });

  it("excludes the author from announcement recipients", () => {
    const recipients = filterRecipients(members, "announcements", "u1");
    const emails = recipients.map((r) => r.email);
    expect(emails).not.toContain("admin@test.com");
    expect(emails).toContain("owner1@test.com");
  });

  it("default users receive quota reminders", () => {
    const recipients = filterRecipients(members, "quotas");
    expect(recipients).toHaveLength(3); // u1, u2, u3 (u4 opted out)
  });

  it("user who disabled quotas does not receive quota reminders", () => {
    const recipients = filterRecipients(members, "quotas");
    const emails = recipients.map((r) => r.email);
    expect(emails).not.toContain("tenant@test.com");
  });

  it("default users receive meeting notifications", () => {
    const recipients = filterRecipients(members, "meetings");
    expect(recipients).toHaveLength(3); // u1, u2, u3 (u4 opted out of meetings)
  });

  it("no one receives maintenance by default", () => {
    const recipients = filterRecipients(members, "maintenance");
    // All have null pref or partial pref without maintenance override → default false
    expect(recipients).toHaveLength(0);
  });

  it("user who enables maintenance receives it", () => {
    const membersWithMaint: MockMember[] = [
      ...members,
      { userId: "u5", email: "maint@test.com", name: "Maint Fan", pref: { maintenance: true } },
    ];
    const recipients = filterRecipients(membersWithMaint, "maintenance");
    expect(recipients).toHaveLength(1);
    expect(recipients[0].email).toBe("maint@test.com");
  });

  it("no one receives contracts by default", () => {
    const recipients = filterRecipients(members, "contracts");
    expect(recipients).toHaveLength(0);
  });

  it("all-disabled user receives nothing", () => {
    const allOff: MockMember = {
      userId: "u99",
      email: "silent@test.com",
      name: "Silent",
      pref: { quotas: false, announcements: false, meetings: false, maintenance: false, contracts: false },
    };
    for (const type of NOTIFICATION_TYPES) {
      const recipients = filterRecipients([allOff], type.key);
      expect(recipients).toHaveLength(0);
    }
  });

  it("all-enabled user receives everything", () => {
    const allOn: MockMember = {
      userId: "u99",
      email: "eager@test.com",
      name: "Eager",
      pref: { quotas: true, announcements: true, meetings: true, maintenance: true, contracts: true },
    };
    for (const type of NOTIFICATION_TYPES) {
      const recipients = filterRecipients([allOn], type.key);
      expect(recipients).toHaveLength(1);
    }
  });
});
