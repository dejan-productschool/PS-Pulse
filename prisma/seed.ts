import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function main() {
  console.log("Seeding Pulse Lite...");

  await prisma.statusUpdate.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.connector.deleteMany();

  await prisma.connector.create({
    data: {
      name: "Demo source (mock API)",
      baseUrl: "http://localhost:3000",
      endpoint: "api/mock-source",
      authHeader: "",
      fieldMapping: JSON.stringify(demoMapping, null, 2),
    },
  });

  const seeds = [
    {
      name: "Revamp onboarding flow",
      summary:
        "Reduce time-to-first-value for new signups with a guided setup and templates.",
      driName: "Alex Rivera",
      driEmail: "alex@example.com",
      team: "Growth",
      status: "ON_TRACK",
      targetDate: new Date("2026-07-20"),
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
      targetDate: new Date("2026-06-30"),
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
      targetDate: new Date("2026-06-20"),
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
      targetDate: new Date("2026-05-15"),
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
      targetDate: new Date("2026-08-01"),
      updates: [],
    },
  ];

  const dayMs = 24 * 60 * 60 * 1000;

  for (const seed of seeds) {
    const { updates, ...data } = seed;
    await prisma.initiative.create({
      data: {
        ...data,
        source: "MANUAL",
        updates: {
          create: updates.map((u) => ({
            status: u.status,
            body: u.body,
            author: seed.driName,
            createdAt: new Date(Date.now() - u.daysAgo * dayMs),
          })),
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
