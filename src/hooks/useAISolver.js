import { useState, useEffect, useRef, useCallback } from 'react';
import SolverWorker from '../workers/solver.worker.js?worker';

export function useAISolver() {
  const [status,          setStatus]          = useState('idle');
  const [searchStats,     setSearchStats]     = useState({ depth: 0, nodes: 0, cutoffs: 0, ms: 0, result: 'UNKNOWN' });
  const [topMoves,        setTopMoves]        = useState([]);
  const [currentEvalMove, setCurrentEvalMove] = useState(null);
  const [finalHint,       setFinalHint]       = useState(null);
  const [completedDepths, setCompletedDepths] = useState([]);
  const workerRef = useRef(null);

  const analyze = useCallback((board, ROWS, COLS, timeLimitMs = 4000, disabled = []) => {
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    setStatus('thinking');
    setSearchStats({ depth: 0, nodes: 0, cutoffs: 0, ms: 0, result: 'UNKNOWN' });
    setTopMoves([]); setCurrentEvalMove(null); setFinalHint(null); setCompletedDepths([]);

    const worker = new SolverWorker();
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setSearchStats({ depth: msg.depth, nodes: msg.nodes, cutoffs: msg.cutoffs, ms: msg.ms, result: msg.result });
        setTopMoves(msg.topMoves || []);
        setCompletedDepths(prev => prev.includes(msg.depth) ? prev : [...prev, msg.depth]);
      } else if (msg.type === 'tick') {
        setSearchStats(prev => ({ ...prev, nodes: msg.nodes, cutoffs: msg.cutoffs, ms: msg.ms }));
        setCurrentEvalMove(msg.currentMove);
      } else if (msg.type === 'done') {
        setFinalHint(msg);
        setStatus('done');
        setCurrentEvalMove(null);
        if (msg.topMoves?.length) setTopMoves(msg.topMoves);
        setSearchStats(prev => ({ ...prev, depth: msg.depth, nodes: msg.nodes, cutoffs: msg.cutoffs || 0, ms: msg.ms, result: msg.result }));
        setCompletedDepths(prev => msg.depth && !prev.includes(msg.depth) ? [...prev, msg.depth] : prev);
        workerRef.current = null;
      }
    };
    worker.onerror = (err) => {
      console.error('Solver error:', err);
      setStatus('error');
      workerRef.current = null;
    };
    worker.postMessage({ board, ROWS, COLS, SIZE: Math.max(ROWS, COLS), timeLimitMs, disabled });
  }, []);

  const cancel = useCallback(() => {
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    setStatus('idle');
    setCurrentEvalMove(null);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setFinalHint(null);
    setTopMoves([]);
    setCompletedDepths([]);
    setSearchStats({ depth: 0, nodes: 0, cutoffs: 0, ms: 0, result: 'UNKNOWN' });
  }, [cancel]);

  useEffect(() => () => { if (workerRef.current) workerRef.current.terminate(); }, []);

  return { status, searchStats, topMoves, currentEvalMove, finalHint, completedDepths, analyze, cancel, reset };
}
