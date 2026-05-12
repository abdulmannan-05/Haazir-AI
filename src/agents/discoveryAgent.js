// ============================================================
// discoveryAgent.js — Step 3: Find matching service providers
// ============================================================

import { mockProviders } from "@/utils/mockProviders";

/**
 * Queries the mock provider database for matching providers.
 *
 * @param {Object} intent - Structured intent from IntentAgent
 * @returns {{ providers: Object[], trace: Object }}
 */
export function runDiscoveryAgent(intent) {
  const startTime = Date.now();

  if (!intent.service_type) {
    const trace = {
      step: "PROVIDER_DISCOVERY",
      agent: "DiscoveryAgent",
      input_summary: "No service type detected",
      output_summary: "Skipped — no service type to search for",
      tools_used: [],
      duration_ms: Date.now() - startTime,
      reasoning: "Intent agent did not identify a service type. Cannot run discovery.",
      confidence: 0,
    };
    return { providers: [], trace };
  }

  // Filter by category match
  const matched = mockProviders.filter(
    (p) => p.category === intent.service_type
  );

  // If no exact match, return all as fallback
  const candidates = matched.length > 0 ? matched : mockProviders.slice(0, 6);

  // Add a simulated distance from user's location (mock — no real GPS)
  const withDistance = candidates.map((p) => ({
    ...p,
    distance_km: parseFloat((Math.random() * 8 + 0.5).toFixed(1)), // 0.5–8.5 km mock
  }));

  const duration = Date.now() - startTime;

  const trace = {
    step: "PROVIDER_DISCOVERY",
    agent: "DiscoveryAgent",
    input_summary: `service_type="${intent.service_type}" | location="${intent.location}"`,
    output_summary: `Found ${withDistance.length} providers for ${intent.service_type}`,
    tools_used: ["mock_provider_db", "distance_calculator"],
    duration_ms: duration,
    reasoning: `Queried mockProviders DB for category "${intent.service_type}". Returned ${withDistance.length} candidates with simulated distance.`,
    confidence: 0.9,
    candidates: withDistance,
  };

  return { providers: withDistance, trace };
}
