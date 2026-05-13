import "dotenv/config";

const trackTotalHits = () => {
  const raw = process.env.ES_SEARCH_TRACK_TOTAL_HITS;
  if (raw === "false" || raw === "0") {
    return false;
  }
  const n = Number(raw || 10_000);
  return Number.isFinite(n) && n > 0 ? n : 10_000;
};

const searchTimeout = () => process.env.ES_SEARCH_TIMEOUT || "5s";

/** Fuzziness tốn CPU — chỉ bật với truy vấn ngắn để giảm latency trên text dài. */
function shortQueryFuzziness(trimmed, maxLen) {
  return trimmed.length > 0 && trimmed.length <= maxLen ? "AUTO" : 0;
}

export function buildJobSearchBody(q) {
  const trimmed = String(q ?? "").trim();
  const fuzz = shortQueryFuzziness(trimmed, 8);

  return {
    query: {
      bool: {
        should: [
          {
            match_phrase: {
              title: { query: trimmed, boost: 4 },
            },
          },
          {
            match_phrase: {
              companyName: { query: trimmed, boost: 2 },
            },
          },
          {
            multi_match: {
              query: trimmed,
              type: "best_fields",
              tie_breaker: 0.3,
              fields: [
                "title^4",
                "companyName^2",
                "description^1.2",
                "requirements",
                "location^1.1",
              ],
              fuzziness: fuzz,
              ...(fuzz ? { prefix_length: 1, max_expansions: 40 } : {}),
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
  };
}

export function buildCvSearchBody(q, { cvIds } = {}) {
  const trimmed = String(q ?? "").trim();
  const terms = trimmed.split(/\s+/).filter(Boolean);
  const multiTerm = terms.length > 1;
  const fileFuzz = shortQueryFuzziness(trimmed, 6);
  const isShortSingleTerm = !multiTerm && trimmed.length > 0 && trimmed.length <= 4;
  const rawFuzz = isShortSingleTerm ? 0 : trimmed.length > 0 && trimmed.length <= 8 ? "AUTO" : 0;
  const allowedCvIds = Array.isArray(cvIds) ? cvIds.filter(Boolean) : [];
  const filter =
    allowedCvIds.length > 0
      ? [
          {
            terms: {
              cvId: allowedCvIds,
            },
          },
        ]
      : [];

  if (!trimmed) {
    return {
      query: {
        bool: {
          filter,
          must: [{ match_all: {} }],
        },
      },
      sort: [{ createdAt: { order: "desc" } }],
    };
  }

  return {
    query: {
      bool: {
        ...(filter.length > 0 ? { filter } : {}),
        should: [
          {
            match_phrase: {
              fileName: { query: trimmed, boost: 5 },
            },
          },
          {
            match_phrase: {
              rawText: { query: trimmed, boost: 4 },
            },
          },
          {
            match: {
              fileName: {
                query: trimmed,
                boost: 3,
                fuzziness: fileFuzz,
                ...(fileFuzz ? { prefix_length: 1, max_expansions: 32 } : {}),
              },
            },
          },
          {
            match: {
              rawText: {
                query: trimmed,
                boost: 1,
                fuzziness: rawFuzz,
                operator: multiTerm ? "or" : "and",
                minimum_should_match: multiTerm ? "70%" : "100%",
                ...(rawFuzz ? { prefix_length: 1, max_expansions: 32 } : {}),
              },
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
    highlight: {
      fields: {
        rawText: { fragment_size: 150, number_of_fragments: 3 },
      },
    },
  };
}

export function jobSearchOptions() {
  return {
    _source: false,
    track_total_hits: trackTotalHits(),
    timeout: searchTimeout(),
  };
}

export function cvSearchOptions() {
  return {
    _source: ["cvId", "userId", "fileName", "createdAt"],
    track_total_hits: trackTotalHits(),
    timeout: searchTimeout(),
  };
}
