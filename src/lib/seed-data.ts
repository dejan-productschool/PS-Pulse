import {
  EMPTY_MILESTONES,
  type Connector,
  type Initiative,
  type Milestones,
  type Squad,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const id = () => crypto.randomUUID();
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();
const iso = (d: string | undefined | null) =>
  d ? new Date(d).toISOString() : null;
const mil = (m: Partial<Record<keyof Milestones, string>>): Milestones => ({
  discoveryEnd: iso(m.discoveryEnd),
  devStart: iso(m.devStart),
  qaStart: iso(m.qaStart),
  launch: iso(m.launch),
});

const demoMapping = {
  recordsPath: "issues",
  fields: {
    externalId: "id",
    name: "fields.summary",
    summary: "fields.description",
    driName: "fields.assignee.displayName",
    driEmail: "fields.assignee.emailAddress",
    team: "fields.project.name",
    status: "fields.status.name",
    targetDate: "fields.duedate",
  },
  statusMap: {
    "To Do": "NOT_STARTED",
    "In Progress": "ON_TRACK",
    Blocked: "OFF_TRACK",
    "At Risk": "AT_RISK",
    Done: "DONE",
  },
};

type SeedSpec = {
  name: string;
  summary: string;
  driName: string;
  driEmail: string;
  team: string;
  status: string;
  startDate: string;
  targetDate: string;
  milestones: Milestones;
  updates: { status: string; body: string; daysAgo: number }[];
};

const specs: SeedSpec[] = [
  {
    name: "Revamp onboarding flow",
    summary:
      "Reduce time-to-first-value for new signups with a guided setup and templates.",
    driName: "Alex Rivera",
    driEmail: "alex@example.com",
    team: "Growth",
    status: "ON_TRACK",
    startDate: "2026-05-01",
    targetDate: "2026-07-20",
    milestones: mil({
      discoveryEnd: "2026-05-20",
      devStart: "2026-05-25",
      qaStart: "2026-07-01",
      launch: "2026-07-18",
    }),
    updates: [
      { status: "NOT_STARTED", body: "Kicked off discovery with design.", daysAgo: 21 },
      { status: "AT_RISK", body: "Eng capacity slipped; tracking a week behind.", daysAgo: 10 },
      {
        status: "ON_TRACK",
        body: "Backfilled a contractor, prototype is in usability testing.",
        daysAgo: 2,
      },
    ],
  },
  {
    name: "Self-serve analytics export",
    summary: "Let customers export their dashboards to CSV and schedule email digests.",
    driName: "Jordan Smith",
    driEmail: "jordan@example.com",
    team: "Platform",
    status: "AT_RISK",
    startDate: "2026-05-15",
    targetDate: "2026-06-30",
    milestones: mil({
      discoveryEnd: "2026-05-28",
      devStart: "2026-06-01",
      qaStart: "2026-06-22",
      launch: "2026-06-28",
    }),
    updates: [
      { status: "ON_TRACK", body: "Spec approved, schema work underway.", daysAgo: 14 },
      {
        status: "AT_RISK",
        body: "Scheduling infra is more complex than scoped; need a decision on queueing.",
        daysAgo: 1,
      },
    ],
  },
  {
    name: "Mobile app accessibility pass",
    summary: "Bring the mobile app to WCAG 2.1 AA across all primary flows.",
    driName: "Taylor Brooks",
    driEmail: "taylor@example.com",
    team: "Mobile",
    status: "OFF_TRACK",
    startDate: "2026-05-10",
    targetDate: "2026-06-20",
    milestones: mil({
      devStart: "2026-05-15",
      qaStart: "2026-06-10",
      launch: "2026-06-18",
    }),
    updates: [
      { status: "ON_TRACK", body: "Audit complete, 38 issues logged.", daysAgo: 25 },
      {
        status: "OFF_TRACK",
        body: "Two engineers reassigned to incident; no progress this sprint.",
        daysAgo: 4,
      },
    ],
  },
  {
    name: "Quarterly pricing experiment",
    summary: "A/B test annual plan framing on the pricing page.",
    driName: "Morgan Diaz",
    driEmail: "morgan@example.com",
    team: "Growth",
    status: "DONE",
    startDate: "2026-04-01",
    targetDate: "2026-05-15",
    milestones: mil({
      devStart: "2026-04-05",
      launch: "2026-05-12",
    }),
    updates: [
      { status: "ON_TRACK", body: "Variants live to 50% of traffic.", daysAgo: 40 },
      {
        status: "DONE",
        body: "Annual framing won (+8% conversion). Shipping to 100%.",
        daysAgo: 30,
      },
    ],
  },
  {
    name: "Data warehouse cost review",
    summary: "Audit and right-size warehouse spend after Q2 growth.",
    driName: "Sam Okafor",
    driEmail: "sam@example.com",
    team: "Data",
    status: "NOT_STARTED",
    startDate: "2026-07-01",
    targetDate: "2026-08-01",
    milestones: mil({ discoveryEnd: "2026-07-10" }),
    updates: [],
  },
];

type SquadSpec = {
  name: string;
  cycleName: string;
  weeks: number;
  members: string[];
  // allocations reference initiatives by name, or use a free-text label.
  allocations: { initiative?: string; label?: string; personWeeks: number }[];
};

const squadSpecs: SquadSpec[] = [
  {
    name: "Growth",
    cycleName: "Q3 2026",
    weeks: 13,
    members: ["Alex Rivera", "Morgan Diaz", "Priya Nair", "Tom Lund"],
    allocations: [
      { initiative: "Revamp onboarding flow", personWeeks: 30 },
      { initiative: "Quarterly pricing experiment", personWeeks: 10 },
      { label: "Discovery & spikes", personWeeks: 18 },
    ],
  },
  {
    name: "Platform",
    cycleName: "Q3 2026",
    weeks: 13,
    members: ["Jordan Smith", "Sam Okafor", "Wei Chen"],
    allocations: [
      { initiative: "Self-serve analytics export", personWeeks: 20 },
      { initiative: "Data warehouse cost review", personWeeks: 8 },
      { label: "On-call", personWeeks: 6 },
    ],
  },
  {
    name: "Mobile",
    cycleName: "Q3 2026",
    weeks: 13,
    members: ["Taylor Brooks", "Ravi Patel"],
    allocations: [
      { initiative: "Mobile app accessibility pass", personWeeks: 16 },
    ],
  },
];

/**
 * Build the demo dataset. `origin` is the deployment's base URL so the bundled
 * demo connector can reach its own /api/mock-source endpoint.
 */
export function buildSeed(origin: string): {
  initiatives: Initiative[];
  connector: Connector;
  squads: Squad[];
} {
  const initiatives: Initiative[] = specs.map((spec) => {
    const createdAt =
      spec.updates.length > 0
        ? daysAgo(Math.max(...spec.updates.map((u) => u.daysAgo)))
        : daysAgo(7);
    const updates = spec.updates
      .map((u) => ({
        id: id(),
        status: u.status,
        body: u.body,
        author: spec.driName,
        createdAt: daysAgo(u.daysAgo),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const updatedAt = updates[0]?.createdAt ?? createdAt;

    return {
      id: id(),
      name: spec.name,
      summary: spec.summary,
      driName: spec.driName,
      driEmail: spec.driEmail,
      team: spec.team,
      status: spec.status,
      startDate: new Date(spec.startDate).toISOString(),
      targetDate: new Date(spec.targetDate).toISOString(),
      milestones: { ...EMPTY_MILESTONES, ...spec.milestones },
      source: "MANUAL",
      externalId: null,
      connectorId: null,
      createdAt,
      updatedAt,
      updates,
    };
  });

  const byName = new Map(initiatives.map((i) => [i.name, i.id]));

  const ts = new Date().toISOString();
  const squads: Squad[] = squadSpecs.map((spec) => ({
    id: id(),
    name: spec.name,
    cycleName: spec.cycleName,
    weeks: spec.weeks,
    members: spec.members.map((name) => ({ id: id(), name })),
    allocations: spec.allocations.map((a) => ({
      id: id(),
      initiativeId: a.initiative ? byName.get(a.initiative) ?? null : null,
      label: a.label ?? a.initiative ?? "Allocation",
      personWeeks: a.personWeeks,
    })),
    createdAt: ts,
    updatedAt: ts,
  }));

  const connector: Connector = {
    id: id(),
    name: "Demo source (mock API)",
    baseUrl: origin,
    endpoint: "api/mock-source",
    authHeader: "",
    fieldMapping: JSON.stringify(demoMapping, null, 2),
    lastSyncedAt: null,
    createdAt: ts,
    updatedAt: ts,
  };

  return { initiatives, connector, squads };
}
