import { EcosystemDataCard } from "./ecosystem-data-card";
import { HypeMarketCard } from "./hype-market-card";
import type { HyperEvmEcosystemMetrics } from "@/lib/defillama-ecosystem";
import type { HypeRange } from "@/lib/hype-market";
import type { HypeMarketData } from "@/lib/hype-market-service";

export function HomeMarketSection({
  ecosystemMetrics,
  initialHypeMarketData,
  selectedHypeRange,
}: {
  ecosystemMetrics: HyperEvmEcosystemMetrics | null;
  initialHypeMarketData: HypeMarketData | null;
  selectedHypeRange: HypeRange;
}) {
  return (
    <section className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <HypeMarketCard initialData={initialHypeMarketData} selectedRange={selectedHypeRange} />
      <EcosystemDataCard metrics={ecosystemMetrics} />
    </section>
  );
}
