import { QueueView } from "./QueueView";
import { QUEUE_FILTERS, type QueueFilter } from "./filters";

// Reads ?filter= so other pages (e.g. the analytics banner) can link
// straight to a filtered queue: /admin/queue?filter=flagged
export default async function AdminQueuePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const initialFilter: QueueFilter = QUEUE_FILTERS.includes(filter as QueueFilter) ? (filter as QueueFilter) : "all";
  return <QueueView initialFilter={initialFilter} />;
}