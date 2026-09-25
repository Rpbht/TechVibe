import type { QuestionItem } from '../types';

/**
 * Generic interview questions dataset.
 * Designed to seamlessly serialize to/from a Node.js REST API (e.g. Express / Fastify / MongoDB / PostgreSQL).
 */
export const QUESTIONS_DATA: QuestionItem[] = [
  // ==========================================
  // REACT
  // ==========================================
  {
    id: 'react-1',
    technology: 'react',
    title: 'How does React 19 Actions & Concurrency work under the hood?',
    summary:
      'React 19 introduces native Actions integrated with transitions, allowing asynchronous state transitions that automatically handle pending states, optimistic updates, and error rollbacks without blocking main thread interactions.',
    explanation: [
      'Prior to React 19, asynchronous state updates (like submitting forms or awaiting API calls) typically required manual isLoading state flags, explicit try/catch blocks, and synchronization with multiple component renders.',
      'Under React 19, an Action is an async function passed to startTransition or built-in action hooks (such as useActionState). React treats transitions as non-urgent, interruptible background work on the Fiber tree.',
      'When an Action starts, React creates a concurrent transition lane. If high-priority input events (such as typing or clicking) occur while the asynchronous Action promise is pending, React yields control to the browser microtask/render loop.',
      'React automatically orchestrates optimistic updates via useOptimistic, and automatically rolls back the optimistic state if the underlying promise rejects.',
    ],
  },
  {
    id: 'react-2',
    technology: 'react',
    title: 'Stale Closure and Memory Leak in Real-Time Listener',
    summary:
      'Analyze an asynchronous event subscription hook containing race conditions, stale closure bugs, and memory leaks upon unmounting.',
    code: {
      language: 'typescript',
      snippet: `export function useLiveMarketPrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    let socket = new WebSocket(\`wss://stream.exchange.com/\${symbol}\`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrice(data.price);
      // BUG: Stale closure on 'history'
      setHistory([...history, data.price]);
    };

    // BUG: Missing socket cleanup on unmount/symbol change
  }, [symbol]);

  return { price, history };
}`,
    },
    pseudoCode: [
      '1. Initialize WebSocket connection to market stream using active symbol.',
      '2. In incoming message handler: parse payload and obtain updated price.',
      '3. Update current price state: setPrice(newPrice).',
      '4. Append new price to history array: setHistory([...history, newPrice]) -> Stale closure bug.',
      '5. Return subscription states to caller.',
    ],
    explanation: [
      'Line 11-13: setHistory([...history, data.price]) reads history from the render scope when the effect ran. Because history is not in the dependency array, subsequent socket messages repeatedly append to the initial stale array, losing previous ticks.',
      'Fix: Use the functional updater form setHistory((prev) => [...prev, data.price]) to always capture the freshest committed state.',
      'Line 15: No cleanup function is returned. When symbol changes or the component unmounts, the previous WebSocket remains connected, triggering updates on an unmounted component and leaking TCP connections.',
      'Fix: Return () => { socket.close(); } from useEffect.',
    ],
    complexity: {
      time: 'O(1) per message processing; O(K) space for K historical ticks.',
      space: 'O(K) where K is number of preserved historical price points in memory.',
    },
  },
  {
    id: 'react-3',
    technology: 'react',
    title: 'How does React Fiber Reconciliation and Double Buffering work?',
    summary:
      'The React Fiber reconciler breaks recursive tree-diffing into incremental units of work using linked lists, and maintains two trees (current and workInProgress) for atomic commits.',
    explanation: [
      'In React 15 and earlier, reconciliation was recursive and synchronous (the stack reconciler). Long component trees blocked the browser rendering thread until completion.',
      'Fiber models each component as a singly linked list node containing pointers to child, sibling, and return (parent). This allows the reconciler to pause, resume, or abort rendering work.',
      'Double Buffering: React maintains two copies of the Fiber tree in memory at all times: the "current" tree (representing what is currently painted on screen) and the "workInProgress" tree (being computed concurrently).',
      'During the render phase, Fiber nodes are cloned or recycled into workInProgress. Once all changes are calculated, React enters the synchronous commit phase and swaps the root pointer (current = workInProgress), achieving instant, glitch-free UI updates.',
    ],
  },

  // ==========================================
  // NEXT.JS
  // ==========================================
  {
    id: 'nextjs-1',
    technology: 'nextjs',
    title: 'Server Components vs Client Components: Data Flow & Boundaries in Next.js',
    summary:
      'Deep dive into how React Server Components (RSC) execute strictly on the Node/Edge runtime, stream HTML/RSC payloads, and compose with interactive Client Components.',
    explanation: [
      'In the Next.js App Router, all components inside the app/ directory are React Server Components (RSC) by default unless marked with the "use client" directive.',
      'Server Components execute exclusively on the server during build time or request time. Their dependencies, database queries, and private API keys are never bundled into the client JavaScript bundle.',
      'Instead of compiling to JavaScript code for the browser, RSC output is serialized into a specialized JSON-like stream (RSC Payload) which contains the virtual DOM structure and serialized props.',
      'Client Components are still rendered on the server during Initial Page Load for SEO (SSR) and then hydrated in the browser for event listeners and stateful interactivity.',
    ],
  },
  {
    id: 'nextjs-2',
    technology: 'nextjs',
    title: 'Secure Server Action with Zod Validation and Optimistic Revalidation',
    summary:
      'Examine an idiomatic Next.js Server Action pattern for securely validating form input, performing database mutations, and revalidating cached paths.',
    code: {
      language: 'typescript',
      snippet: `'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

const CreatePostSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(20),
});

export async function createPostAction(prevState: any, formData: FormData) {
  // Parse and validate strictly on the server
  const validatedFields = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid input fields.',
    };
  }

  try {
    await db.post.create({
      data: validatedFields.data,
    });

    // Invalidate stale cached route
    revalidatePath('/dashboard/posts');
    return { success: true };
  } catch (error) {
    return { message: 'Database transaction failed.' };
  }
}`,
    },
    pseudoCode: [
      '1. Declare "use server" at top of file to designate all exported functions as RPC endpoints.',
      '2. Define Zod schema enforcing string length and character constraints.',
      '3. Extract fields from FormData and run safeParse().',
      '4. If validation fails, return structured validation errors without hitting DB.',
      '5. Execute database write within try/catch block.',
      '6. Call revalidatePath() to purge Next.js Data Cache for the affected route.',
    ],
    explanation: [
      'Line 1: "use server" creates an encrypted POST endpoint behind the scenes that the Next.js runtime dispatches to.',
      'Line 8-11: CreatePostSchema guards against malicious payloads and type coercion attacks.',
      'Line 15-23: safeParse provides early return with structured error messages before touching infrastructure.',
      'Line 31: revalidatePath("/dashboard/posts") purges the server-side cache for the posts dashboard so subsequent visitors receive fresh data.',
    ],
    complexity: {
      time: 'O(1) validation runtime; I/O bounded by DB write latency (~10-30ms).',
      space: 'O(1) memory allocation per request on Edge/Node worker.',
    },
  },

  // ==========================================
  // TYPESCRIPT
  // ==========================================
  {
    id: 'ts-1',
    technology: 'typescript',
    title: 'How do Discriminated Unions and Exhaustiveness Checking guarantee type safety?',
    summary:
      'Discriminated unions leverage a common literal property to narrow complex polymorphic types, while the never type enables compile-time exhaustiveness checking.',
    explanation: [
      'A discriminated union (or tagged union) consists of multiple interface definitions sharing a single common literal field with distinct values (e.g. kind: "circle" | "square").',
      'TypeScript\'s control flow analyzer automatically narrows the type inside conditional statements (switch or if/else) based on the discriminator property.',
      'Exhaustiveness checking: By assigning the default case of a switch statement to a variable of type never, the TypeScript compiler will throw a build error if a developer adds a new variant to the union without handling it in the switch statement.',
    ],
  },
  {
    id: 'ts-2',
    technology: 'typescript',
    title: 'Building a Type-Safe Deep Readonly and Deep Partial Utility',
    summary:
      'Inspect recursive conditional mapped types that enforce immutability across arbitrarily nested object hierarchies.',
    code: {
      language: 'typescript',
      snippet: `type Primitive = string | number | boolean | bigint | symbol | undefined | null;

// Deeply make all nested properties readonly
export type DeepReadonly<T> = T extends Primitive | Function
  ? T
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer M>
  ? ReadonlySet<DeepReadonly<M>>
  : T extends Array<infer E>
  ? ReadonlyArray<DeepReadonly<E>>
  : {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    };

// Test usage
interface UserProfile {
  name: string;
  config: {
    notifications: boolean;
    tags: string[];
  };
}

type ImmutableProfile = DeepReadonly<UserProfile>;
// config.tags is now ReadonlyArray<string>`,
    },
    pseudoCode: [
      '1. If T is a primitive (scalar) or function, return T untouched.',
      '2. If T is a Map, recursively wrap keys and values in ReadonlyMap.',
      '3. If T is a Set, wrap elements in ReadonlySet.',
      '4. If T is an Array, wrap elements in ReadonlyArray.',
      '5. If T is an object, map over each key P in keyof T, adding readonly modifier and recurring on T[P].',
    ],
    explanation: [
      'Line 4-5: Base case termination checks whether T is a scalar primitive or function; avoiding infinite compiler recursion.',
      'Line 6-11: Handles native ECMAScript container collections (Map, Set, Array) using infer pattern matching.',
      'Line 12-14: The homomorphic mapped type readonly [P in keyof T] copies properties while prepending the readonly modifier.',
    ],
    complexity: {
      time: 'O(D * P) compile-time resolution where D is depth and P is property count.',
      space: 'Zero runtime footprint; erased entirely during compilation.',
    },
  },

  // ==========================================
  // NODE.JS
  // ==========================================
  {
    id: 'node-1',
    technology: 'nodejs',
    title: 'Node.js Event Loop Phases, Microtask Queue & process.nextTick Priority',
    summary:
      'Detailed breakdown of libuv event loop phases (Timers, Pending I/O, Idle/Prepare, Poll, Check, Close) and the execution order of microtasks.',
    explanation: [
      'The Node.js event loop runs on a single main thread backed by libuv multi-platform C library.',
      'The loop progresses through six sequential phases: 1. Timers (setTimeout, setInterval), 2. Pending Callbacks (I/O errors), 3. Idle/Prepare (internal), 4. Poll (incoming connections and I/O data), 5. Check (setImmediate), and 6. Close Callbacks (socket.on("close")).',
      'Microtask Queues execute immediately after each phase before transitioning to the next phase. There are two microtask queues: the process.nextTick queue and the Promise microtask queue (resolved promises, queueMicrotask).',
      'process.nextTick has higher priority than Promise resolution. Starvation can occur if process.nextTick is called recursively, starving the event loop from ever entering the Poll or Timers phase.',
    ],
  },

  // ==========================================
  // PYTHON
  // ==========================================
  {
    id: 'python-1',
    technology: 'python',
    title: 'Asyncio Event Loop, Coroutines vs Threads & the Global Interpreter Lock (GIL)',
    summary:
      'Understanding cooperative multitasking in Python Asyncio, the limitations imposed by the GIL on multi-core scaling, and when to use Multiprocessing vs Asyncio.',
    explanation: [
      'Python\'s Global Interpreter Lock (GIL) is a mutex that prevents multiple native OS threads from executing CPython bytecode simultaneously. Hence, standard Python threads cannot leverage multiple CPU cores for CPU-bound computations.',
      'Asyncio provides single-threaded cooperative multitasking. Coroutines defined with async def yield execution back to the central event loop whenever they hit an await on an I/O operation.',
      'For I/O-bound tasks (network requests, DB queries, reading files), asyncio scales to tens of thousands of concurrent connections with minimal memory footprint compared to OS threads.',
      'For CPU-bound tasks (image processing, data science, cryptographic operations), developers must use multiprocessing or concurrent.futures.ProcessPoolExecutor to spawn separate OS processes with independent GIL instances.',
    ],
  },

  // ==========================================
  // GOLANG
  // ==========================================
  {
    id: 'go-1',
    technology: 'golang',
    title: 'Worker Pool with Graceful Cancellation using context.Context',
    summary:
      'Analyze an idiomatic Go worker pool pattern with channel buffering, wait group synchronization, and cooperative context cancellation.',
    code: {
      language: 'go',
      snippet: `package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Job struct {
	ID   int
	Data string
}

func Worker(ctx context.Context, id int, jobs <-chan Job, wg *sync.WaitGroup) {
	defer wg.Done()
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("Worker %d: shutting down gracefully: %v\\n", id, ctx.Err())
			return
		case job, ok := <-jobs:
			if !ok {
				return // Channel closed
			}
			processJob(job)
		}
	}
}

func processJob(j Job) {
	time.Sleep(50 * time.Millisecond)
}`,
    },
    pseudoCode: [
      '1. Worker function registers deferred wg.Done() callback.',
      '2. Enter infinite select loop multiplexing between channels.',
      '3. Case 1: <-ctx.Done(): Return immediately if parent context is cancelled or times out.',
      '4. Case 2: job, ok := <-jobs: If channel closed (!ok), terminate; otherwise invoke processJob(job).',
    ],
    explanation: [
      'Line 15: defer wg.Done() guarantees that the WaitGroup counter decrements when the worker exits, avoiding deadlock in main.',
      'Line 17-26: select statement provides non-blocking channel multiplexing.',
      'Line 19-21: Cooperative cancellation via ctx.Done(). When the parent cancels context, all workers drain their current task and shut down.',
      'Line 22-25: Comma-ok idiom (job, ok := <-jobs) detects when the dispatcher has closed the jobs channel.',
    ],
    complexity: {
      time: 'O(N / W) where N is total jobs and W is worker count.',
      space: 'O(W + B) where W is number of goroutines (~2KB stack each) and B is buffer capacity.',
    },
  },

  // ==========================================
  // DOCKER & K8S
  // ==========================================
  {
    id: 'docker-1',
    technology: 'docker',
    title: 'Hardened Multi-Stage Production Dockerfile for Node.js / Go',
    summary:
      'Examine an enterprise-grade multi-stage Dockerfile that drops build dependencies, creates a non-root user, and optimizes layer caching.',
    code: {
      language: 'docker',
      snippet: `# Stage 1: Build & Dependency Resolution
FROM node:20-alpine AS builder
WORKDIR /app

# Cache package manifests first to optimize layer caching
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

# Stage 2: Minimal Distroless / Alpine Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Run as non-privileged non-root user
USER node

# Copy only the compiled artifacts and production dependencies
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/index.js"]`,
    },
    pseudoCode: [
      '1. Stage 1 (Builder): Use complete Node.js image with compilers/tools.',
      '2. Copy only package*.json and run "npm ci" to cache dependency layer.',
      '3. Copy full source code and build production bundle.',
      '4. Prune devDependencies to shrink node_modules.',
      '5. Stage 2 (Runner): Start from fresh minimal base image.',
      '6. Drop root privileges by switching to non-root "node" user.',
      '7. Copy only built artifacts from builder stage with proper file ownership.',
      '8. Expose port and start node runtime process.',
    ],
    explanation: [
      'Line 6-7: Separating package*.json copy from full source copy allows Docker to reuse the cached npm ci layer if package.json has not changed.',
      'Line 13: Multi-stage declaration FROM node:20-alpine AS runner discards intermediate compilers, Git history, and test assets from the final image.',
      'Line 18: USER node eliminates container escape vulnerabilities where an attacker could gain root privileges on the host kernel.',
      'Line 21-23: --chown=node:node ensures that the non-root user owns the copied executable files.',
    ],
    complexity: {
      time: 'Build time reduced by up to 80% via Docker layer cache.',
      space: 'Final image footprint reduced from ~1.2GB to <120MB.',
    },
  },

  // ==========================================
  // POSTGRESQL
  // ==========================================
  {
    id: 'postgres-1',
    technology: 'postgres',
    title: 'B-Tree vs GIN vs BRIN Indexes: How PostgreSQL Executes Search Internals',
    summary:
      'Comparison of internal storage and lookup mechanisms for B-Tree, Generalized Inverted Index (GIN), and Block Range Index (BRIN) in relational databases.',
    explanation: [
      'B-Tree (Default): Self-balancing search tree suited for scalar values supporting equality (=) and range queries (<, <=, >, BETWEEN). Logarithmic time complexity O(log N).',
      'GIN (Generalized Inverted Index): Inverted index where each key points to a list or tree of row pointers (TIDs) that contain that element. Ideal for multi-value data types: JSONB, arrays, full-text search (tsvector).',
      'BRIN (Block Range Index): Designed for massive append-only tables where data is naturally sorted on disk (e.g. timestamps or auto-incrementing IDs). Instead of indexing every row, BRIN stores the minimum and maximum values for a range of physical disk blocks (default 128 pages).',
      'Trade-offs: B-Trees consume substantial disk space and slow down writes; GIN indexes are expensive to update but allow instantaneous JSON key lookups; BRIN uses negligible disk space for terabyte-scale tables.',
    ],
  },

  // ==========================================
  // SYSTEM DESIGN
  // ==========================================
  {
    id: 'sd-1',
    technology: 'system-design',
    title: 'Design a High-Performance Distributed Cache: Eviction & Cache Stampede',
    summary:
      'Architectural principles of distributed caching: write-through vs write-back, Redis cluster sharding, LRU eviction, and mitigating cache stampede under high concurrent load.',
    explanation: [
      'Caching Strategies: 1. Cache-Aside (Lazy Loading): Application queries cache first; on miss, queries DB and populates cache. 2. Write-Through: Data is written to cache and DB synchronously. 3. Write-Back (Write-Behind): Data is written directly to cache and asynchronously flushed to DB.',
      'Cache Stampede (Thundering Herd): Occurs when a high-traffic key expires, causing thousands of simultaneous requests to experience a cache miss and bombard the database simultaneously.',
      'Solutions to Stampede: 1. Distributed Locking (Mutex): Only the first worker acquires a lock to query the DB and refresh cache, while other requests await the lock or return stale data. 2. Probabilistic Early Expiration (XFetch): Workers asynchronously refresh the key slightly before its nominal TTL expires based on request compute cost.',
      'Eviction Policies: Least Recently Used (LRU) using a doubly linked list + hash map, or Least Frequently Used (LFU) using frequency buckets.',
    ],
    complexity: {
      time: 'O(1) read/write latency (<2ms over Redis socket).',
      space: 'Bounded by configured memory limit (maxmemory) with LRU eviction.',
    },
  },
  {
    id: 'sd-2',
    technology: 'system-design',
    title: 'How Consistent Hashing Prevents Cascading Failures in Distributed Sharding',
    summary:
      'Explore how consistent hashing maps both nodes and keys onto a circular hash ring, limiting key reassignment to k/n keys during scaling events.',
    explanation: [
      'Traditional modulo hashing (hash(key) % N) causes catastrophic redistribution when node count N changes: virtually all keys get reassigned to different servers, wiping out cache hit rates.',
      'Consistent Hashing maps both servers and data keys onto a continuous circular hash ring.',
      'A key is assigned to the first server node encountered moving clockwise around the ring.',
      'Virtual Nodes (V-Nodes): To avoid hotspot skews where keys distribute unevenly across physical machines, each physical machine is mapped to hundreds of virtual positions across the ring using multiple hash seeds.',
    ],
  },
];
