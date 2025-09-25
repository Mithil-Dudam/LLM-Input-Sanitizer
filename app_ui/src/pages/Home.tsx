import React, { useState } from "react";
import { Link } from "react-router-dom";

function Home() {
    const [input, setInput] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [reason, setReason] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setResult(null);
        setStatus(null);
        setReason(null);
        try {
            const response = await fetch("http://localhost:8000/sanitize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: input })
            });
            const data = await response.json();
            setStatus(data.status);
            if (data.status === "sanitized" || data.status === "clean") {
                setResult(data.result);
            } else if (data.status === "blocked") {
                setReason(data.reason);
            }
        } catch (err) {
            setResult("Error connecting to backend.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            handleSubmit();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800 flex flex-col items-center justify-center font-sans">
            <div className="bg-zinc-800 shadow-xl rounded-2xl p-9 max-w-lg w-full my-8 border border-zinc-700">
                <h1 className="text-center text-slate-100 font-bold text-3xl mb-2">LLM Input Sanitizer</h1>
                <p className="text-center text-zinc-400 mb-7">
                    Enter your text below to automatically redact PII, block prompt injection, and detect anomalies.
                </p>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={5}
                        className="w-full border border-zinc-700 bg-zinc-900 text-slate-100 rounded-lg p-4 text-base mb-5 resize-vertical outline-none focus:border-indigo-500 transition"
                        placeholder="Paste or type your input here..."
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-lg py-3 text-lg font-semibold shadow transition"
                    >
                        {loading ? "Sanitizing..." : "Sanitize"}
                    </button>
                </form>
                {status === "sanitized" && (
                    <div className="mt-8 text-cyan-300">
                        <b>Sanitized Output:</b>
                        <pre className="bg-zinc-900 text-slate-100 p-4 rounded-lg mt-2 text-base whitespace-pre-wrap border border-zinc-700">{result}</pre>
                    </div>
                )}
                {status === "clean" && (
                    <div className="mt-8 text-green-400">
                        <b>Input is clean. No PII or issues detected:</b>
                        <pre className="bg-zinc-900 text-slate-100 p-4 rounded-lg mt-2 text-base whitespace-pre-wrap border border-zinc-700">{result}</pre>
                    </div>
                )}
                {status === "blocked" && (
                    <div className="mt-8 text-red-400">
                        <b>Blocked:</b> {reason}
                    </div>
                )}
                <div className="mt-10 flex justify-center">
                    <Link
                        to="/report"
                        className="inline-block border border-indigo-500 text-indigo-300 hover:bg-indigo-600 hover:text-white font-semibold rounded-lg px-6 py-2 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-800"
                    >
                        View Report
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Home;