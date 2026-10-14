import { CheckCircle2, RefreshCw, Radio, ArrowRight, AlertCircle } from 'lucide-react';
import type { BackgroundReport } from '@shared/backgroundReports';

type Monitor = {
  configured: boolean;
  persistentHistory: boolean;
  storeUrl?: string;
  reports?: BackgroundReport[];
  historyError?: boolean;
};

export default function BackgroundChecks({ monitor, refresh, review }: {
  monitor: Monitor | null;
  refresh: () => void;
  review: () => void;
}) {
  const reports = monitor?.reports || [];
  return <section className="background-checks">
    <div className="section-heading"><h2>Background checks</h2><button className="text-button" onClick={refresh}><RefreshCw size={14}/>Refresh status</button></div>
    <div className="background-schedule"><Radio size={20}/><div><strong>{monitor?.configured ? 'Checks daily at 09:00 UTC' : 'Daily checks are not configured'}</strong><p>{monitor?.storeUrl ? new URL(monitor.storeUrl).hostname : 'Choose a storefront to monitor.'}</p></div><span className="pill neutral">{monitor?.configured ? 'Scheduled' : 'Not scheduled'}</span></div>
    {monitor?.historyError && <p className="helper">Completed-check history could not be loaded. Refresh status to try again.</p>}
    {!reports.length ? <div className="empty-background"><p>{monitor?.persistentHistory ? 'The next completed background check will appear here.' : 'Background report storage is not configured yet.'}</p></div> : reports.map(report => <article className="background-report" key={report.id}>
      <div className="background-report-heading">{report.status === 'completed' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<div><strong>{report.store}</strong><p>{new Date(report.checkedAt).toLocaleString()}</p></div><span className="pill neutral">{report.status === 'completed' ? 'Completed' : report.status === 'partial' ? 'Completed with website fallback' : 'Could not finish'}</span></div>
      <div className="background-report-metrics"><strong>{report.score === null ? 'No score' : `${report.score}/100`}</strong><span>{report.productCount} products checked</span><span>{report.checks.filter(check => check.complete).length}/8 checks passed</span></div>
      {report.nextActions.length > 0 && <div className="background-next-actions"><strong>Suggested website fixes</strong><ul>{report.nextActions.map(action => <li key={action}>{action}</li>)}</ul></div>}
      <button className="text-button" onClick={review}>Review suggested fixes <ArrowRight size={14}/></button>
    </article>)}
  </section>;
}
