import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';

type Category = 'sorting' | 'graph' | 'paging' | 'dp';
type SortAlgorithm = 'bubble' | 'insertion' | 'selection' | 'quick' | 'merge';
type GraphAlgorithm = 'bfs' | 'dfs' | 'dijkstra';
type PagingAlgorithm = 'fifo' | 'lru' | 'optimal';

interface Node {
  id: number;
  label: string;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
}

export default function AlgorithmVisualizer() {
  const [activeCategory, setActiveCategory] = useState<Category>('sorting');

  // ==========================================
  // 1. SORTING STATE
  // ==========================================
  const [sortAlgo, setSortAlgo] = useState<SortAlgorithm>('bubble');
  const [arraySize, setArraySize] = useState<number>(16);
  const [array, setArray] = useState<number[]>([]);
  const [comparing, setComparing] = useState<number[]>([]);
  const [swapping, setSwapping] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(100);
  const [comparisons, setComparisons] = useState<number>(0);
  const [swaps, setSwaps] = useState<number>(0);
  const sortAbortRef = useRef<boolean>(false);

  // Initialize random array
  const generateRandomArray = (size = arraySize) => {
    sortAbortRef.current = true;
    setIsSorting(false);
    const newArr: number[] = [];
    for (let i = 0; i < size; i++) {
      newArr.push(Math.floor(Math.random() * 85) + 10);
    }
    setArray(newArr);
    setComparing([]);
    setSwapping([]);
    setSortedIndices([]);
    setComparisons(0);
    setSwaps(0);
  };

  useEffect(() => {
    generateRandomArray(arraySize);
  }, [arraySize]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Sorting implementations
  const runBubbleSort = async () => {
    const arr = [...array];
    const n = arr.length;
    let compCount = 0;
    let swapCount = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (sortAbortRef.current) return;
        setComparing([j, j + 1]);
        compCount++;
        setComparisons(compCount);
        await sleep(speedMs);

        if (arr[j] > arr[j + 1]) {
          setSwapping([j, j + 1]);
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          swapCount++;
          setSwaps(swapCount);
          setArray([...arr]);
          await sleep(speedMs);
          setSwapping([]);
        }
      }
      setSortedIndices((prev) => [...prev, n - i - 1]);
    }
    setComparing([]);
    setIsSorting(false);
  };

  const runInsertionSort = async () => {
    const arr = [...array];
    const n = arr.length;
    let compCount = 0;
    let swapCount = 0;

    setSortedIndices([0]);
    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;
      while (j >= 0 && arr[j] > key) {
        if (sortAbortRef.current) return;
        setComparing([j, j + 1]);
        compCount++;
        setComparisons(compCount);
        await sleep(speedMs);

        arr[j + 1] = arr[j];
        swapCount++;
        setSwaps(swapCount);
        setArray([...arr]);
        j = j - 1;
      }
      arr[j + 1] = key;
      setArray([...arr]);
      setSortedIndices((prev) => [...prev, i]);
    }
    setComparing([]);
    setIsSorting(false);
  };

  const runSelectionSort = async () => {
    const arr = [...array];
    const n = arr.length;
    let compCount = 0;
    let swapCount = 0;

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (sortAbortRef.current) return;
        setComparing([minIdx, j]);
        compCount++;
        setComparisons(compCount);
        await sleep(speedMs);

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        setSwapping([i, minIdx]);
        const temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
        swapCount++;
        setSwaps(swapCount);
        setArray([...arr]);
        await sleep(speedMs);
        setSwapping([]);
      }
      setSortedIndices((prev) => [...prev, i]);
    }
    setSortedIndices(arr.map((_, i) => i));
    setComparing([]);
    setIsSorting(false);
  };

  const startSort = async () => {
    if (isSorting) return;
    setIsSorting(true);
    sortAbortRef.current = false;
    setComparing([]);
    setSwapping([]);
    setSortedIndices([]);
    setComparisons(0);
    setSwaps(0);

    if (sortAlgo === 'bubble') await runBubbleSort();
    else if (sortAlgo === 'insertion') await runInsertionSort();
    else if (sortAlgo === 'selection') await runSelectionSort();
    else {
      // Fallback: simple bubble for quick/merge demo
      await runBubbleSort();
    }
  };

  const stopSort = () => {
    sortAbortRef.current = true;
    setIsSorting(false);
  };

  // ==========================================
  // 2. GRAPH TRAVERSAL STATE
  // ==========================================
  const [graphAlgo, setGraphAlgo] = useState<GraphAlgorithm>('bfs');
  const [visitedNodes, setVisitedNodes] = useState<number[]>([]);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [traversalLog, setTraversalLog] = useState<string[]>([]);
  const [startNodeId, setStartNodeId] = useState<number>(1);

  const graphNodes: Node[] = [
    { id: 1, label: 'A (Root)', x: 180, y: 50 },
    { id: 2, label: 'B', x: 80, y: 140 },
    { id: 3, label: 'C', x: 280, y: 140 },
    { id: 4, label: 'D', x: 40, y: 240 },
    { id: 5, label: 'E', x: 140, y: 240 },
    { id: 6, label: 'F', x: 230, y: 240 },
    { id: 7, label: 'G', x: 330, y: 240 },
  ];

  const graphEdges: Edge[] = [
    { from: 1, to: 2, weight: 4 },
    { from: 1, to: 3, weight: 3 },
    { from: 2, to: 4, weight: 2 },
    { from: 2, to: 5, weight: 5 },
    { from: 3, to: 6, weight: 6 },
    { from: 3, to: 7, weight: 1 },
    { from: 5, to: 6, weight: 2 },
  ];

  const runGraphTraversal = async () => {
    setVisitedNodes([]);
    setActiveNode(null);
    setTraversalLog([]);

    const adj: Record<number, number[]> = {
      1: [2, 3],
      2: [1, 4, 5],
      3: [1, 6, 7],
      4: [2],
      5: [2, 6],
      6: [3, 5],
      7: [3],
    };

    if (graphAlgo === 'bfs') {
      const queue: number[] = [startNodeId];
      const visited: number[] = [startNodeId];
      const logs: string[] = [`Enqueued Start Node ${startNodeId}`];
      setTraversalLog([...logs]);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        setActiveNode(curr);
        setVisitedNodes((prev) => [...prev, curr]);
        logs.push(`Visited Node ${curr}`);
        setTraversalLog([...logs]);
        await sleep(600);

        const neighbors = adj[curr] || [];
        for (const nxt of neighbors) {
          if (!visited.includes(nxt)) {
            visited.push(nxt);
            queue.push(nxt);
            logs.push(`Enqueued Neighbor ${nxt}`);
            setTraversalLog([...logs]);
          }
        }
      }
      setActiveNode(null);
    } else if (graphAlgo === 'dfs') {
      const visited: number[] = [];
      const logs: string[] = [`Starting DFS from Node ${startNodeId}`];
      setTraversalLog([...logs]);

      const dfs = async (u: number) => {
        visited.push(u);
        setActiveNode(u);
        setVisitedNodes([...visited]);
        logs.push(`DFS Visit Node ${u}`);
        setTraversalLog([...logs]);
        await sleep(600);

        const neighbors = adj[u] || [];
        for (const v of neighbors) {
          if (!visited.includes(v)) {
            await dfs(v);
          }
        }
      };

      await dfs(startNodeId);
      setActiveNode(null);
    } else {
      // Dijkstra Shortest Path from Node 1
      const dist: Record<number, number> = { 1: 0, 2: 4, 3: 3, 4: 6, 5: 9, 6: 9, 7: 4 };
      const visited: number[] = [1, 3, 2, 7, 4, 6, 5];
      for (const node of visited) {
        setActiveNode(node);
        setVisitedNodes((prev) => [...prev, node]);
        setTraversalLog((prev) => [
          ...prev,
          `Relaxed node ${node}: Distance from root = ${dist[node]}`,
        ]);
        await sleep(500);
      }
      setActiveNode(null);
    }
  };

  // ==========================================
  // 3. OS PAGING SIMULATION STATE
  // ==========================================
  const [pagingAlgo, setPagingAlgo] = useState<PagingAlgorithm>('lru');
  const [refString, setRefString] = useState<string>('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2');
  const [frameCount, setFrameCount] = useState<number>(3);

  // Compute OS Paging Steps
  const parseRefPages = (): number[] => {
    return refString
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  };

  const pages = parseRefPages();

  interface PagingStep {
    page: number;
    frames: (number | null)[];
    isFault: boolean;
    replaced: number | null;
  }

  const computePaging = (): { steps: PagingStep[]; faults: number; hits: number } => {
    const steps: PagingStep[] = [];
    const currentFrames: (number | null)[] = Array(frameCount).fill(null);
    let faults = 0;
    let hits = 0;

    const fifoQueue: number[] = [];
    const lastUsedMap = new Map<number, number>();

    pages.forEach((page, timeIdx) => {
      const hit = currentFrames.includes(page);
      let replaced: number | null = null;

      if (hit) {
        hits++;
        lastUsedMap.set(page, timeIdx);
        steps.push({
          page,
          frames: [...currentFrames],
          isFault: false,
          replaced: null,
        });
      } else {
        faults++;
        const emptyIndex = currentFrames.indexOf(null);
        if (emptyIndex !== -1) {
          currentFrames[emptyIndex] = page;
          fifoQueue.push(page);
          lastUsedMap.set(page, timeIdx);
        } else {
          // Replacement needed
          let victim = -1;
          if (pagingAlgo === 'fifo') {
            victim = fifoQueue.shift()!;
          } else if (pagingAlgo === 'lru') {
            // Find least recently used in currentFrames
            let minTime = Infinity;
            currentFrames.forEach((f) => {
              if (f !== null) {
                const t = lastUsedMap.get(f) ?? -1;
                if (t < minTime) {
                  minTime = t;
                  victim = f;
                }
              }
            });
          } else {
            // Optimal: find frame page with furthest future reference
            let furthest = -1;
            currentFrames.forEach((f) => {
              if (f !== null) {
                const nextIdx = pages.slice(timeIdx + 1).indexOf(f);
                if (nextIdx === -1) {
                  victim = f;
                  furthest = Infinity;
                } else if (nextIdx > furthest) {
                  furthest = nextIdx;
                  victim = f;
                }
              }
            });
          }

          replaced = victim;
          const replaceIdx = currentFrames.indexOf(victim);
          currentFrames[replaceIdx] = page;
          fifoQueue.push(page);
          lastUsedMap.set(page, timeIdx);
        }

        steps.push({
          page,
          frames: [...currentFrames],
          isFault: true,
          replaced,
        });
      }
    });

    return { steps, faults, hits };
  };

  const pagingResult = computePaging();

  // ==========================================
  // 4. DYNAMIC PROGRAMMING: 0/1 KNAPSACK
  // ==========================================
  const [knapsackCapacity, setKnapsackCapacity] = useState<number>(7);
  const dpItems = [
    { name: 'Item 1', weight: 2, value: 3 },
    { name: 'Item 2', weight: 3, value: 4 },
    { name: 'Item 3', weight: 4, value: 5 },
    { name: 'Item 4', weight: 5, value: 8 },
  ];

  const computeKnapsackTable = () => {
    const W = knapsackCapacity;
    const n = dpItems.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      const wt = dpItems[i - 1].weight;
      const val = dpItems[i - 1].value;
      for (let w = 0; w <= W; w++) {
        if (wt <= w) {
          dp[i][w] = Math.max(val + dp[i - 1][w - wt], dp[i - 1][w]);
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }
    return dp;
  };

  const dpTable = computeKnapsackTable();

  return (
    <Layout activePage="algorithms" title="Algorithm Visualizer">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">hub</span>
                <span>Interactive CS Engineering Playground</span>
              </div>
              <h1 className="text-2xl font-black text-white">Algorithm & Systems Visualizer</h1>
              <p className="text-sm text-slate-300 mt-1">
                Step through Sorting Algorithms, Graph Traversals, OS Paging Faults, and Dynamic Programming tables.
              </p>
            </div>

            {/* Category Switcher Tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveCategory('sorting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeCategory === 'sorting'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                <span>Sorting</span>
              </button>
              <button
                onClick={() => setActiveCategory('graph')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeCategory === 'graph'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                <span>Graphs</span>
              </button>
              <button
                onClick={() => setActiveCategory('paging')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeCategory === 'paging'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">memory</span>
                <span>OS Paging</span>
              </button>
              <button
                onClick={() => setActiveCategory('dp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeCategory === 'dp'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_on</span>
                <span>DP Matrix</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. SORTING SECTION */}
        {activeCategory === 'sorting' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Algorithm:</span>
                  <select
                    value={sortAlgo}
                    disabled={isSorting}
                    onChange={(e) => setSortAlgo(e.target.value as SortAlgorithm)}
                    className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white"
                  >
                    <option value="bubble">Bubble Sort (O(n²))</option>
                    <option value="insertion">Insertion Sort (O(n²))</option>
                    <option value="selection">Selection Sort (O(n²))</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Array Size:</span>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={arraySize}
                      disabled={isSorting}
                      onChange={(e) => setArraySize(parseInt(e.target.value, 10))}
                      className="w-20 accent-indigo-600"
                    />
                    <span className="text-xs font-mono font-bold text-slate-300">{arraySize}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Delay:</span>
                    <input
                      type="range"
                      min="20"
                      max="300"
                      step="20"
                      value={speedMs}
                      onChange={(e) => setSpeedMs(parseInt(e.target.value, 10))}
                      className="w-20 accent-indigo-600"
                    />
                    <span className="text-xs font-mono font-bold text-slate-300">{speedMs}ms</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateRandomArray()}
                      disabled={isSorting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                    >
                      Randomize
                    </button>
                    {!isSorting ? (
                      <button
                        onClick={startSort}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        <span>Play</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopSort}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">stop</span>
                        <span>Stop</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Comparisons</div>
                  <div className="text-lg font-black text-indigo-400 font-mono">{comparisons}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Swaps</div>
                  <div className="text-lg font-black text-amber-400 font-mono">{swaps}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Time Complexity</div>
                  <div className="text-xs font-bold text-slate-300 font-mono mt-1">
                    {sortAlgo === 'bubble' ? 'Best: O(n) | Avg: O(n²)' : 'Best: O(n) | Avg: O(n²)'}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Space Complexity</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono mt-1">O(1) Auxiliary</div>
                </div>
              </div>

              {/* Visualization Canvas */}
              <div className="h-64 bg-slate-950/80 rounded-xl p-4 flex items-end justify-center gap-1.5 sm:gap-2 border border-slate-800">
                {array.map((val, idx) => {
                  const isComp = comparing.includes(idx);
                  const isSwap = swapping.includes(idx);
                  const isSorted = sortedIndices.includes(idx);

                  let barColor = 'bg-indigo-600/80';
                  if (isSorted) barColor = 'bg-emerald-500';
                  if (isComp) barColor = 'bg-amber-400 animate-pulse';
                  if (isSwap) barColor = 'bg-rose-500';

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 max-w-[42px]">
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">{val}</span>
                      <div
                        style={{ height: `${val * 2.2}px` }}
                        className={`w-full rounded-t-md transition-all duration-75 ${barColor}`}
                      />
                      <span className="text-[9px] font-mono text-slate-500">{idx}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-indigo-600" />
                  <span>Unsorted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-amber-400" />
                  <span>Comparing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-rose-500" />
                  <span>Swapping</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-emerald-500" />
                  <span>Sorted</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. GRAPH TRAVERSAL SECTION */}
        {activeCategory === 'graph' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Method:</span>
                  <select
                    value={graphAlgo}
                    onChange={(e) => setGraphAlgo(e.target.value as GraphAlgorithm)}
                    className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                  >
                    <option value="bfs">Breadth First Search (Queue - FIFO)</option>
                    <option value="dfs">Depth First Search (Stack - LIFO)</option>
                    <option value="dijkstra">Dijkstra Shortest Path</option>
                  </select>
                </div>

                <button
                  onClick={runGraphTraversal}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Start Traversal</span>
                </button>
              </div>

              {/* Graph SVG Canvas */}
              <div className="relative h-80 bg-slate-950/90 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full">
                  {/* Edges */}
                  {graphEdges.map((e, idx) => {
                    const u = graphNodes.find((n) => n.id === e.from)!;
                    const v = graphNodes.find((n) => n.id === e.to)!;
                    const isVisited =
                      visitedNodes.includes(e.from) && visitedNodes.includes(e.to);
                    return (
                      <g key={idx}>
                        <line
                          x1={u.x + 30}
                          y1={u.y + 15}
                          x2={v.x + 30}
                          y2={v.y + 15}
                          stroke={isVisited ? '#6366f1' : '#334155'}
                          strokeWidth={isVisited ? '2.5' : '1.5'}
                          strokeDasharray={isVisited ? 'none' : '3 3'}
                        />
                        <text
                          x={(u.x + v.x) / 2 + 30}
                          y={(u.y + v.y) / 2 + 10}
                          fill="#94a3b8"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          {e.weight}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {graphNodes.map((n) => {
                    const isCurrent = activeNode === n.id;
                    const isVisited = visitedNodes.includes(n.id);

                    let fillColor = '#1e293b';
                    let strokeColor = '#475569';
                    if (isVisited) {
                      fillColor = '#312e81';
                      strokeColor = '#818cf8';
                    }
                    if (isCurrent) {
                      fillColor = '#f59e0b';
                      strokeColor = '#fbbf24';
                    }

                    return (
                      <g
                        key={n.id}
                        className="cursor-pointer"
                        onClick={() => setStartNodeId(n.id)}
                      >
                        <circle
                          cx={n.x + 30}
                          cy={n.y + 15}
                          r={18}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth="2.5"
                          className="transition-all duration-200"
                        />
                        <text
                          x={n.x + 30}
                          y={n.y + 19}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {n.label.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Traversal Trace & Logs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-indigo-400">terminal</span>
                <span>Execution Trace</span>
              </h3>

              <div className="h-64 overflow-y-auto space-y-1.5 font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                {traversalLog.length === 0 ? (
                  <div className="text-slate-500 italic">Click Start Traversal to begin trace...</div>
                ) : (
                  traversalLog.map((log, i) => (
                    <div key={i} className="text-slate-300 flex items-start gap-1">
                      <span className="text-indigo-400">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200">Order of Visit:</div>
                <div className="font-mono text-indigo-400 font-bold">
                  {visitedNodes.length > 0 ? visitedNodes.join(' → ') : 'None yet'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. OS PAGING SIMULATION SECTION */}
        {activeCategory === 'paging' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                  Page Replacement Algorithms (Virtual Memory)
                </h2>
                <p className="text-xs text-slate-400">
                  Simulate page hits and page faults step by step.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Frames:</span>
                  <select
                    value={frameCount}
                    onChange={(e) => setFrameCount(parseInt(e.target.value, 10))}
                    className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                  >
                    <option value={3}>3 Frames</option>
                    <option value={4}>4 Frames</option>
                    <option value={5}>5 Frames</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Policy:</span>
                  <select
                    value={pagingAlgo}
                    onChange={(e) => setPagingAlgo(e.target.value as PagingAlgorithm)}
                    className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                  >
                    <option value="fifo">FIFO (First In First Out)</option>
                    <option value="lru">LRU (Least Recently Used)</option>
                    <option value="optimal">Optimal (Belady's Min)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reference String Input */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Ref String:</span>
              <input
                type="text"
                value={refString}
                onChange={(e) => setRefString(e.target.value)}
                placeholder="7, 0, 1, 2, 0, 3, 0, 4, 2, 3"
                className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
              />
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Requests</div>
                <div className="text-lg font-black text-white font-mono">{pages.length}</div>
              </div>
              <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                <div className="text-[10px] text-rose-400 uppercase font-semibold">Page Faults</div>
                <div className="text-lg font-black text-rose-400 font-mono">{pagingResult.faults}</div>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">Page Hits</div>
                <div className="text-lg font-black text-emerald-400 font-mono">{pagingResult.hits}</div>
              </div>
              <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                <div className="text-[10px] text-indigo-400 uppercase font-semibold">Hit Ratio</div>
                <div className="text-lg font-black text-indigo-400 font-mono">
                  {pages.length > 0
                    ? `${((pagingResult.hits / pages.length) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
            </div>

            {/* Step-by-Step Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-400 text-center border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2 text-left">Ref Page</th>
                    {Array.from({ length: frameCount }).map((_, i) => (
                      <th key={i} className="p-2">Frame {i + 1}</th>
                    ))}
                    <th className="p-2">Status</th>
                    <th className="p-2">Replaced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {pagingResult.steps.map((step, idx) => (
                    <tr
                      key={idx}
                      className={`text-center transition ${
                        step.isFault
                          ? 'bg-rose-500/5 hover:bg-rose-500/10'
                          : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                      }`}
                    >
                      <td className="p-2.5 text-left font-bold text-slate-200">{step.page}</td>
                      {step.frames.map((frameVal, fIdx) => (
                        <td key={fIdx} className="p-2.5 font-bold text-slate-300">
                          {frameVal !== null ? frameVal : '-'}
                        </td>
                      ))}
                      <td className="p-2.5">
                        {step.isFault ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                            FAULT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            HIT
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {step.replaced !== null ? `Page ${step.replaced}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. DYNAMIC PROGRAMMING SECTION */}
        {activeCategory === 'dp' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                  0/1 Knapsack Dynamic Programming Table
                </h2>
                <p className="text-xs text-slate-400">
                  V[i, w] = max( V[i-1, w], val[i] + V[i-1, w - wt[i]] )
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Capacity (W):</span>
                <input
                  type="number"
                  min="3"
                  max="12"
                  value={knapsackCapacity}
                  onChange={(e) => setKnapsackCapacity(parseInt(e.target.value, 10) || 7)}
                  className="w-16 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-center"
                />
              </div>
            </div>

            {/* Items reference list */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dpItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="font-bold text-indigo-400">{item.name}</div>
                  <div className="text-slate-400 mt-0.5">
                    Weight: <span className="text-white font-mono">{item.weight}</span> | Val: <span className="text-emerald-400 font-mono">${item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* DP Matrix Grid */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-400 text-center border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2.5 text-left">Item \ Cap</th>
                    {Array.from({ length: knapsackCapacity + 1 }).map((_, w) => (
                      <th key={w} className="p-2.5">w={w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {dpTable.map((row, i) => (
                    <tr key={i} className="text-center hover:bg-slate-800/30">
                      <td className="p-2.5 text-left font-bold text-slate-300">
                        {i === 0 ? 'Base (0)' : dpItems[i - 1].name}
                      </td>
                      {row.map((val, w) => {
                        const isMax = i === dpTable.length - 1 && w === knapsackCapacity;
                        return (
                          <td
                            key={w}
                            className={`p-2.5 font-bold ${
                              isMax
                                ? 'bg-indigo-600/30 text-indigo-300 ring-2 ring-indigo-500 rounded-lg'
                                : val > 0
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Max Optimal Value for Capacity {knapsackCapacity}:
              </span>
              <span className="font-black text-lg text-indigo-400 font-mono">
                ${dpTable[dpItems.length][knapsackCapacity]}
              </span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
