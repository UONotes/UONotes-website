// SERVER-ONLY: uses the service-role client. Callers must check the
// viewer is a super admin first (see isSuperAdmin below).
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RangeKey } from "@/lib/analytics";
import { DECISION_ACTIONS } from "@/lib/review";
import { computeAnalytics, type AnalyticsData, type NoteRow } from "@/lib/analytics-data";
import {
  WORKFLOW_ACTIONS,
  computeWorkflow,
  type ReportRow,
  type SaveRow,
  type WorkflowData,
  type WorkProfile,
  type WorkRow,
} from "@/lib/analytics-workflow";

export type FullAnalytics = AnalyticsData & { workflow: WorkflowData };

const CACHE_TTL_MS = 10_000;

/**
 * Supabase caps each response at 1000 rows, so page through until a
 * short page comes back.
 */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const PAGE = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(`Analytics fetch failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** For side tables: a missing table or column leaves that stat empty instead of failing the page. */
async function optional<T>(rows: Promise<T[]>): Promise<T[]> {
  try {
    return await rows;
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function load(range: RangeKey): Promise<FullAnalytics> {
  const db = createAdminClient();
  const [notes, profiles, audit, saves, reports] = await Promise.all([
    fetchAll<NoteRow>((from, to) =>
      db
        .from("notes")
        .select("id, title, course_code, status, created_at, reviewed_at, hours_awarded, uploader_id, author_name, language, note_types")
        .order("created_at", { ascending: true })
        .range(from, to)
    ),
    fetchAll<WorkProfile>((from, to) =>
      db
        .from("profiles")
        .select("id, created_at, full_name, email, is_admin, is_vp_notes, is_super_admin, status, last_admin_active_at")
        .order("created_at", { ascending: true })
        .range(from, to)
    ),
    fetchAll<WorkRow>((from, to) =>
      db
        .from("admin_audit_log")
        .select("admin_id, action_type, target_type, target_id, created_at, checked_by:details->>checked_by")
        .in("action_type", [...DECISION_ACTIONS, ...WORKFLOW_ACTIONS])
        .order("created_at", { ascending: true })
        .range(from, to)
    ),
    optional(
      fetchAll<SaveRow>((from, to) =>
        db.from("saved_notes").select("note_id, created_at").order("created_at", { ascending: true }).range(from, to)
      )
    ),
    optional(
      fetchAll<ReportRow>((from, to) =>
        db.from("note_reports").select("reason, created_at").order("created_at", { ascending: true }).range(from, to)
      )
    ),
  ]);
  const now = new Date();
  const isDecision = (type: string) => (DECISION_ACTIONS as readonly string[]).includes(type);
  return {
    ...computeAnalytics({ notes, profiles, audit: audit.filter((r) => isDecision(r.action_type)) }, range, now),
    workflow: computeWorkflow({ notes, profiles, audit, saves, reports }, range, now),
  };
}

// The numbers are the same for every super admin, so all open analytics
// tabs share one computation per range instead of each re-reading every
// table on every live refresh. Concurrent requests share the in-flight load.
const cache = new Map<RangeKey, { at: number; promise: Promise<FullAnalytics> }>();

export function getAnalytics(range: RangeKey, { fresh = false } = {}): Promise<FullAnalytics> {
  const hit = cache.get(range);
  if (hit && !fresh && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise;
  const promise = load(range);
  cache.set(range, { at: Date.now(), promise });
  promise.catch(() => cache.delete(range)); // never cache a failure
  return promise;
}

export async function isSuperAdmin(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from("profiles").select("is_super_admin").eq("id", userId).single();
  return !!data?.is_super_admin;
}
