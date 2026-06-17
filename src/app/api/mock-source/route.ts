import { NextResponse } from "next/server";

/**
 * A stand-in external REST API (shaped loosely like a Jira search response) so
 * the bundled demo connector has something real to sync against. Point any
 * connector at this endpoint to see ingestion end-to-end.
 */
export async function GET() {
  return NextResponse.json({
    total: 4,
    issues: [
      {
        id: "OPS-101",
        fields: {
          summary: "Migrate billing service to new payments provider",
          description:
            "Cut over from legacy provider with zero downtime and reconciliation in place.",
          assignee: { displayName: "Priya Nair", emailAddress: "priya@example.com" },
          project: { name: "Payments" },
          status: { name: "In Progress" },
          duedate: "2026-08-15",
        },
      },
      {
        id: "OPS-102",
        fields: {
          summary: "Launch customer health dashboard",
          description: "Surface adoption and risk signals for the CS team.",
          assignee: { displayName: "Marcus Lee", emailAddress: "marcus@example.com" },
          project: { name: "Customer Success" },
          status: { name: "Blocked" },
          duedate: "2026-07-01",
        },
      },
      {
        id: "OPS-103",
        fields: {
          summary: "SOC 2 Type II readiness",
          description: "Close remaining control gaps ahead of the audit window.",
          assignee: { displayName: "Dana Cohen", emailAddress: "dana@example.com" },
          project: { name: "Security" },
          status: { name: "At Risk" },
          duedate: "2026-09-30",
        },
      },
      {
        id: "OPS-104",
        fields: {
          summary: "Roll out SSO across internal tools",
          description: "Standardize on a single identity provider for all staff apps.",
          assignee: { displayName: "Sam Okafor", emailAddress: "sam@example.com" },
          project: { name: "Platform" },
          status: { name: "Done" },
          duedate: "2026-06-01",
        },
      },
    ],
  });
}
