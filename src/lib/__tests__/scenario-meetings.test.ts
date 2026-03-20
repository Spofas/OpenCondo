/**
 * Scenario tests: Meeting quorum and vote tallying.
 *
 * These test the pure logic behind quorum calculation and permilagem-weighted
 * vote tallying, extracted from the meeting module's concepts.
 * The server action itself can't be tested without Next.js/DB, but we can
 * verify the maths that drives assembly decisions.
 */

import { describe, it, expect } from "vitest";

// ─── Fixtures ───────────────────────────────────────────────────────────────

/** Edifício Aurora — 6 units, total permilagem = 1000 */
const AURORA_UNITS = [
  { id: "u1", identifier: "R/C Esq", permilagem: 150, ownerId: "owner1" },
  { id: "u2", identifier: "R/C Dto", permilagem: 150, ownerId: "owner2" },
  { id: "u3", identifier: "1.º Esq", permilagem: 200, ownerId: "owner3" },
  { id: "u4", identifier: "1.º Dto", permilagem: 200, ownerId: "owner4" },
  { id: "u5", identifier: "2.º Esq", permilagem: 150, ownerId: "owner5" },
  { id: "u6", identifier: "2.º Dto", permilagem: 150, ownerId: "owner6" },
] as const;

const TOTAL_PERMILAGEM = AURORA_UNITS.reduce((s, u) => s + u.permilagem, 0);

// ─── Pure logic (mirrors the concepts in the server action) ─────────────────

interface Attendee {
  userId: string;
  status: "PRESENTE" | "REPRESENTADO" | "AUSENTE";
}

interface Vote {
  unitId: string;
  vote: "A_FAVOR" | "CONTRA" | "ABSTENCAO";
}

/**
 * Build a permilagem lookup by owner, aggregating across all units owned.
 * Matches the logic in saveAttendance action.
 */
function buildPermilagemByOwner(
  units: readonly { ownerId: string; permilagem: number }[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const unit of units) {
    map.set(unit.ownerId, (map.get(unit.ownerId) || 0) + unit.permilagem);
  }
  return map;
}

/**
 * Calculate quorum: sum of permilagem for PRESENTE + REPRESENTADO attendees
 * as a fraction of total permilagem.
 */
function calculateQuorum(
  attendees: Attendee[],
  permilagemByOwner: Map<string, number>,
  totalPermilagem: number
): { presentPermilagem: number; quorumPercentage: number; hasQuorum: boolean } {
  let presentPermilagem = 0;

  for (const a of attendees) {
    if (a.status === "PRESENTE" || a.status === "REPRESENTADO") {
      presentPermilagem += permilagemByOwner.get(a.userId) || 0;
    }
  }

  const quorumPercentage =
    totalPermilagem > 0
      ? Math.round((presentPermilagem / totalPermilagem) * 10000) / 100
      : 0;

  // Portuguese condo law: first convocation requires >50% permilagem
  return {
    presentPermilagem,
    quorumPercentage,
    hasQuorum: presentPermilagem > totalPermilagem / 2,
  };
}

/**
 * Tally votes weighted by permilagem.
 * Returns counts and whether the motion passes (simple majority: A_FAVOR > 50%).
 */
function tallyVotes(
  votes: Vote[],
  permilagemByUnit: Map<string, number>
): {
  aFavor: number;
  contra: number;
  abstencao: number;
  totalVoted: number;
  approvalPercentage: number;
  passed: boolean;
} {
  let aFavor = 0;
  let contra = 0;
  let abstencao = 0;

  for (const v of votes) {
    const perm = permilagemByUnit.get(v.unitId) || 0;
    if (v.vote === "A_FAVOR") aFavor += perm;
    else if (v.vote === "CONTRA") contra += perm;
    else abstencao += perm;
  }

  const totalVoted = aFavor + contra + abstencao;
  const approvalPercentage =
    totalVoted > 0 ? Math.round((aFavor / totalVoted) * 10000) / 100 : 0;

  return {
    aFavor,
    contra,
    abstencao,
    totalVoted,
    approvalPercentage,
    passed: aFavor > totalVoted / 2,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Meeting quorum calculation", () => {
  const permilagemByOwner = buildPermilagemByOwner(AURORA_UNITS);

  it("total permilagem of Aurora is 1000", () => {
    expect(TOTAL_PERMILAGEM).toBe(1000);
  });

  it("all owners present → 100% quorum", () => {
    const attendees: Attendee[] = AURORA_UNITS.map((u) => ({
      userId: u.ownerId,
      status: "PRESENTE",
    }));

    const q = calculateQuorum(attendees, permilagemByOwner, TOTAL_PERMILAGEM);
    expect(q.presentPermilagem).toBe(1000);
    expect(q.quorumPercentage).toBe(100);
    expect(q.hasQuorum).toBe(true);
  });

  it("no owners present → 0% quorum", () => {
    const attendees: Attendee[] = AURORA_UNITS.map((u) => ({
      userId: u.ownerId,
      status: "AUSENTE",
    }));

    const q = calculateQuorum(attendees, permilagemByOwner, TOTAL_PERMILAGEM);
    expect(q.presentPermilagem).toBe(0);
    expect(q.quorumPercentage).toBe(0);
    expect(q.hasQuorum).toBe(false);
  });

  it("represented counts towards quorum", () => {
    // owner1 (150) present, owner3 (200) represented, rest absent
    const attendees: Attendee[] = [
      { userId: "owner1", status: "PRESENTE" },
      { userId: "owner2", status: "AUSENTE" },
      { userId: "owner3", status: "REPRESENTADO" },
      { userId: "owner4", status: "AUSENTE" },
      { userId: "owner5", status: "AUSENTE" },
      { userId: "owner6", status: "AUSENTE" },
    ];

    const q = calculateQuorum(attendees, permilagemByOwner, TOTAL_PERMILAGEM);
    expect(q.presentPermilagem).toBe(350); // 150 + 200
    expect(q.quorumPercentage).toBe(35);
    expect(q.hasQuorum).toBe(false); // 350/1000 = 35%, need >50%
  });

  it("exact boundary: 500/1000 does NOT have quorum (need >50%, not >=)", () => {
    // owner3 (200) + owner4 (200) + owner1 (150) = 550 → absent:
    // owner1 (150) + owner3 (200) + owner6 (150) = 500
    const attendees: Attendee[] = [
      { userId: "owner1", status: "PRESENTE" },  // 150
      { userId: "owner3", status: "PRESENTE" },  // 200
      { userId: "owner6", status: "PRESENTE" },  // 150
      { userId: "owner2", status: "AUSENTE" },
      { userId: "owner4", status: "AUSENTE" },
      { userId: "owner5", status: "AUSENTE" },
    ];

    const q = calculateQuorum(attendees, permilagemByOwner, TOTAL_PERMILAGEM);
    expect(q.presentPermilagem).toBe(500);
    expect(q.hasQuorum).toBe(false); // strictly greater than 50%
  });

  it("501/1000 has quorum", () => {
    // This can't happen with Aurora's units (all multiples of 50),
    // so we test the function directly
    const custom = new Map([["ownerA", 501]]);
    const q = calculateQuorum(
      [{ userId: "ownerA", status: "PRESENTE" }],
      custom,
      1000
    );
    expect(q.hasQuorum).toBe(true);
  });

  it("unknown attendee (not in units) has 0 permilagem", () => {
    const attendees: Attendee[] = [
      { userId: "unknown_user", status: "PRESENTE" },
    ];

    const q = calculateQuorum(attendees, permilagemByOwner, TOTAL_PERMILAGEM);
    expect(q.presentPermilagem).toBe(0);
    expect(q.hasQuorum).toBe(false);
  });
});

describe("Vote tallying (permilagem-weighted)", () => {
  const permilagemByUnit = new Map(
    AURORA_UNITS.map((u) => [u.id, u.permilagem])
  );

  it("unanimous A_FAVOR → 100% approval, passes", () => {
    const votes: Vote[] = AURORA_UNITS.map((u) => ({
      unitId: u.id,
      vote: "A_FAVOR",
    }));

    const result = tallyVotes(votes, permilagemByUnit);
    expect(result.aFavor).toBe(1000);
    expect(result.contra).toBe(0);
    expect(result.abstencao).toBe(0);
    expect(result.approvalPercentage).toBe(100);
    expect(result.passed).toBe(true);
  });

  it("unanimous CONTRA → 0% approval, fails", () => {
    const votes: Vote[] = AURORA_UNITS.map((u) => ({
      unitId: u.id,
      vote: "CONTRA",
    }));

    const result = tallyVotes(votes, permilagemByUnit);
    expect(result.aFavor).toBe(0);
    expect(result.contra).toBe(1000);
    expect(result.approvalPercentage).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("all abstentions → 0% approval, fails", () => {
    const votes: Vote[] = AURORA_UNITS.map((u) => ({
      unitId: u.id,
      vote: "ABSTENCAO",
    }));

    const result = tallyVotes(votes, permilagemByUnit);
    expect(result.abstencao).toBe(1000);
    expect(result.approvalPercentage).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("mixed vote: larger units A_FAVOR, smaller units CONTRA → passes", () => {
    // u3 (200) + u4 (200) = 400 A_FAVOR
    // u1 (150) + u2 (150) = 300 CONTRA
    // u5 (150) + u6 (150) = 300 ABSTENCAO
    const votes: Vote[] = [
      { unitId: "u3", vote: "A_FAVOR" },
      { unitId: "u4", vote: "A_FAVOR" },
      { unitId: "u1", vote: "CONTRA" },
      { unitId: "u2", vote: "CONTRA" },
      { unitId: "u5", vote: "ABSTENCAO" },
      { unitId: "u6", vote: "ABSTENCAO" },
    ];

    const result = tallyVotes(votes, permilagemByUnit);
    expect(result.aFavor).toBe(400);
    expect(result.contra).toBe(300);
    expect(result.abstencao).toBe(300);
    expect(result.totalVoted).toBe(1000);
    expect(result.approvalPercentage).toBe(40); // 400/1000 = 40%
    expect(result.passed).toBe(false); // 40% < 50%
  });

  it("majority vote with abstentions (A_FAVOR > 50% of voted)", () => {
    // u3 (200) + u4 (200) + u1 (150) = 550 A_FAVOR
    // u2 (150) CONTRA
    // u5 + u6 ABSTENCAO (300)
    const votes: Vote[] = [
      { unitId: "u3", vote: "A_FAVOR" },
      { unitId: "u4", vote: "A_FAVOR" },
      { unitId: "u1", vote: "A_FAVOR" },
      { unitId: "u2", vote: "CONTRA" },
      { unitId: "u5", vote: "ABSTENCAO" },
      { unitId: "u6", vote: "ABSTENCAO" },
    ];

    const result = tallyVotes(votes, permilagemByUnit);
    expect(result.aFavor).toBe(550);
    expect(result.contra).toBe(150);
    expect(result.abstencao).toBe(300);
    expect(result.passed).toBe(true); // 550/1000 = 55% > 50%
  });

  it("exact 50/50 split does not pass (need >50%)", () => {
    // u1 (150) + u3 (200) + u6 (150) = 500 A_FAVOR
    // u2 (150) + u4 (200) + u5 (150) = 500 CONTRA
    const votes: Vote[] = [
      { unitId: "u1", vote: "A_FAVOR" },
      { unitId: "u3", vote: "A_FAVOR" },
      { unitId: "u6", vote: "A_FAVOR" },
      { unitId: "u2", vote: "CONTRA" },
      { unitId: "u4", vote: "CONTRA" },
      { unitId: "u5", vote: "CONTRA" },
    ];

    const result = tallyVotes(votes, permilagemByUnit);
    expect(result.aFavor).toBe(500);
    expect(result.contra).toBe(500);
    expect(result.totalVoted).toBe(1000);
    expect(result.approvalPercentage).toBe(50);
    expect(result.passed).toBe(false); // exactly 50% is not >50%
  });

  it("partial voting: only some units vote", () => {
    // Only 3 units vote, rest didn't cast
    const votes: Vote[] = [
      { unitId: "u3", vote: "A_FAVOR" },  // 200
      { unitId: "u4", vote: "A_FAVOR" },  // 200
      { unitId: "u1", vote: "CONTRA" },   // 150
    ];

    const result = tallyVotes(votes, permilagemByUnit);
    expect(result.aFavor).toBe(400);
    expect(result.contra).toBe(150);
    expect(result.totalVoted).toBe(550);
    // 400/550 ≈ 72.73%
    expect(result.approvalPercentage).toBe(72.73);
    expect(result.passed).toBe(true);
  });

  it("unknown unit (not in map) contributes 0 permilagem", () => {
    const votes: Vote[] = [
      { unitId: "unknown", vote: "A_FAVOR" },
    ];

    const result = tallyVotes(votes, permilagemByUnit);
    expect(result.aFavor).toBe(0);
    expect(result.totalVoted).toBe(0);
    expect(result.approvalPercentage).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("no votes → 0% approval, fails", () => {
    const result = tallyVotes([], permilagemByUnit);
    expect(result.totalVoted).toBe(0);
    expect(result.approvalPercentage).toBe(0);
    expect(result.passed).toBe(false);
  });
});

describe("Permilagem aggregation for multi-unit owners", () => {
  it("owner with two units gets combined permilagem", () => {
    // owner1 owns both u1 (150) and u3 (200)
    const customUnits = [
      { ownerId: "owner1", permilagem: 150 },
      { ownerId: "owner1", permilagem: 200 },
      { ownerId: "owner2", permilagem: 300 },
    ];

    const map = buildPermilagemByOwner(customUnits);
    expect(map.get("owner1")).toBe(350); // 150 + 200
    expect(map.get("owner2")).toBe(300);
  });

  it("single unit owner has exact permilagem", () => {
    const map = buildPermilagemByOwner(AURORA_UNITS);
    expect(map.get("owner1")).toBe(150);
    expect(map.get("owner3")).toBe(200);
  });

  it("multi-unit owner counts once in quorum with combined weight", () => {
    const multiUnits = [
      { ownerId: "bigOwner", permilagem: 300 },
      { ownerId: "bigOwner", permilagem: 250 },
      { ownerId: "smallOwner", permilagem: 200 },
      { ownerId: "tinyOwner", permilagem: 250 },
    ];

    const map = buildPermilagemByOwner(multiUnits);
    const total = 1000;

    // bigOwner alone present: 550/1000 = 55% → has quorum
    const q = calculateQuorum(
      [{ userId: "bigOwner", status: "PRESENTE" }],
      map,
      total
    );
    expect(q.presentPermilagem).toBe(550);
    expect(q.hasQuorum).toBe(true);
  });
});
