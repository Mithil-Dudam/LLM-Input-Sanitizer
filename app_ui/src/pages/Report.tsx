import { useEffect, useState } from "react";

function Report() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("http://localhost:8000/report")
            .then(res => res.json())
            .then(data => {
                setReport(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Could not fetch report from backend.");
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800 flex flex-col items-center justify-center font-sans">
            <div className="bg-zinc-800 shadow-xl rounded-2xl p-9 max-w-lg w-full my-8 border border-zinc-700">
                <div className="mb-6 flex justify-end">
                    <a href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 text-sm shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-800">Back to Home</a>
                </div>
                <h1 className="text-center text-slate-100 font-extrabold text-3xl mb-6 tracking-tight">Sanitizer Report</h1>
                {loading && <div className="text-zinc-400 text-center">Loading...</div>}
                {error && <div className="text-red-400 text-center">{error}</div>}
                {report && !report.error && (
                    <div className="text-slate-100 mt-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-7 px-2 max-w-2xl mx-auto">
                            <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-700 text-center shadow-sm hover:shadow-lg transition flex flex-col items-center" style={{minHeight: '130px'}}>
                                <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1 flex items-end justify-center" style={{minHeight: '48px'}}>
                                    Blocked (Anomaly)
                                </div>
                                <div className="text-2xl font-bold text-amber-400 mt-auto">{report.blocked_anomaly}</div>
                            </div>
                            <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-700 text-center shadow-sm hover:shadow-lg transition flex flex-col items-center" style={{minHeight: '130px'}}>
                                <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1 flex items-end justify-center" style={{minHeight: '48px'}}>
                                    Blocked (Prompt Injection)
                                </div>
                                <div className="text-2xl font-bold text-rose-400 mt-auto">{report.blocked_prompt_injection}</div>
                            </div>
                            <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-700 text-center shadow-sm hover:shadow-lg transition flex flex-col items-center" style={{minHeight: '130px'}}>
                                <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1 flex items-end justify-center" style={{minHeight: '48px'}}>
                                    Sanitized (PII Redacted)
                                </div>
                                <div className="text-2xl font-bold text-cyan-300 mt-auto">{report.sanitized}</div>
                            </div>
                            <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-700 text-center shadow-sm hover:shadow-lg transition flex flex-col items-center" style={{minHeight: '130px'}}>
                                <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1 flex items-end justify-center" style={{minHeight: '48px'}}>
                                    Clean (No Action Needed)
                                </div>
                                <div className="text-2xl font-bold text-green-400 mt-auto">{report.clean}</div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <div className="font-semibold text-lg text-slate-200 mb-2 flex items-center gap-2">
                                <span className="inline-block w-1.5 h-5 bg-indigo-500 rounded-sm"></span>
                                Anomaly Reasons
                            </div>
                            <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
                                {Object.keys(report.anomaly_reasons).length === 0 ? (
                                    <div className="text-zinc-400 mt-1">None</div>
                                ) : (
                                    <ul className="mt-1 pl-4 list-disc space-y-2">
                                        {Object.entries(report.anomaly_reasons).map(([reason, count]) => (
                                            <li key={reason} className="text-base flex items-center">
                                                <span className="text-amber-300 font-medium">{reason}</span>
                                                <span className="ml-2 text-zinc-400">({String(count)})</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {report && report.error && (
                    <div className="text-red-400 text-center mt-6">{report.error}</div>
                )}
            </div>
        </div>
    );
}

export default Report;
