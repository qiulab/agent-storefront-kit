import { get, list, put } from '@vercel/blob';
import type { BackgroundReport } from '../shared/backgroundReports.js';

export function reportStorageConfigured() {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
}

export async function saveBackgroundReport(report: BackgroundReport) {
  if (!reportStorageConfigured()) return false;
  await put(`audit-runs/${report.checkedAt.replace(/[:.]/g, '-')}-${report.id}.json`, JSON.stringify(report), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    abortSignal: AbortSignal.timeout(6000),
  });
  return true;
}

export async function recentBackgroundReports(): Promise<BackgroundReport[]> {
  if (!reportStorageConfigured()) return [];
  const result = await list({ prefix: 'audit-runs/', limit: 1000, abortSignal: AbortSignal.timeout(6000) });
  const newest = result.blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()).slice(0, 8);
  const reports = await Promise.all(newest.map(async blob => {
    const content = await get(blob.url, { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(6000) });
    if (!content?.stream) return null;
    return JSON.parse(await new Response(content.stream).text()) as BackgroundReport;
  }));
  return reports.filter((report): report is BackgroundReport => !!report);
}
