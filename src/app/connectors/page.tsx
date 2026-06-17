import { listConnectors, listInitiatives } from "@/lib/store";
import { ConnectorManager, type ConnectorView } from "@/components/ConnectorManager";

export const dynamic = "force-dynamic";

export default async function ConnectorsPage() {
  const [connectors, initiatives] = await Promise.all([
    listConnectors(),
    listInitiatives(),
  ]);

  const views: ConnectorView[] = connectors.map((c) => ({
    id: c.id,
    name: c.name,
    baseUrl: c.baseUrl,
    endpoint: c.endpoint,
    authHeader: c.authHeader,
    fieldMapping: c.fieldMapping,
    lastSyncedAt: c.lastSyncedAt,
    initiativeCount: initiatives.filter((i) => i.connectorId === c.id).length,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Connectors</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Ingest initiatives from any external REST API. A connector fetches the
          source, maps its fields onto Pulse, and upserts so re-syncs update in
          place. The bundled demo source works out of the box — just hit{" "}
          <strong>Sync now</strong>.
        </p>
      </div>
      <ConnectorManager connectors={views} />
    </div>
  );
}
