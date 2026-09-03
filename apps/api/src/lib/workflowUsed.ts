/**
 * Post-query aggregation of workflow usage by workflowId.
 * No usage table exists yet, so every id maps to 0.
 * Replace the body with groupBy on usage rows when they are persisted.
 */
export async function aggregateWorkflowUsed(
  workflowIds: string[],
): Promise<Map<string, number>> {
  const used = new Map<string, number>();
  for (const id of workflowIds) {
    used.set(id, 0);
  }
  if (workflowIds.length === 0) {
    return used;
  }
  await Promise.resolve();
  return used;
}
