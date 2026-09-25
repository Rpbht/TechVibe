import type { TechnologyMeta } from '../types';

const category = (metadata: Omit<TechnologyMeta, 'questionCount'>): TechnologyMeta => ({
  ...metadata,
  questionCount: 0,
});

export const TECHNOLOGIES: TechnologyMeta[] = [
  category({
    id: 'general-engineering', name: 'General Engineering Fundamentals', iconName: 'BookOpen',
    description: 'Core software engineering principles, problem solving, trade-offs, quality, and professional practice.',
    subtopics: ['Problem Solving & Complexity', 'Engineering Trade-offs', 'Code Quality & Reviews', 'Professional Practice'],
  }),
  category({
    id: 'java', name: 'Java', iconName: 'Coffee',
    description: 'JVM internals, collections, concurrency, memory management, streams, and modern Java.',
    subtopics: ['JVM, Memory & Garbage Collection', 'Collections & Generics', 'Concurrency & Virtual Threads', 'Streams & Modern Java'],
  }),
  category({
    id: 'spring-boot', name: 'Spring Boot', iconName: 'Leaf',
    description: 'Dependency injection, auto-configuration, data access, transactions, security, testing, and operations.',
    subtopics: ['Dependency Injection & Auto-Configuration', 'Spring Data & Transactions', 'Security & REST APIs', 'Testing & Actuator'],
  }),
  category({
    id: 'react', name: 'React', iconName: 'Atom',
    description: 'Component architecture, Fiber reconciliation, concurrency, state management, and hooks.',
    subtopics: ['State & Concurrency', 'Reconciliation & Rendering', 'Hooks & Performance', 'Server Components'],
  }),
  category({
    id: 'angular', name: 'Angular', iconName: 'Braces',
    description: 'Standalone components, signals, change detection, RxJS, dependency injection, routing, and forms.',
    subtopics: ['Components, Signals & Change Detection', 'RxJS & State Management', 'Dependency Injection & Services', 'Routing, Forms & Testing'],
  }),
  category({
    id: 'frontend-engineering', name: 'Frontend Engineering', iconName: 'Globe',
    description: 'Browser architecture, component systems, state, rendering, build tooling, and frontend architecture.',
    subtopics: ['Browser Runtime & DOM', 'State & Component Architecture', 'Build Tools & Bundling', 'Frontend System Design'],
  }),
  category({
    id: 'web-platform', name: 'HTML, CSS & Web Platform', iconName: 'Globe',
    description: 'Semantic HTML, modern CSS, browser APIs, responsive design, storage, and web standards.',
    subtopics: ['Semantic HTML', 'CSS Layout & Responsive Design', 'Browser APIs & Storage', 'Web Standards'],
  }),
  category({
    id: 'javascript', name: 'JavaScript', iconName: 'FileCode2',
    description: 'Language semantics, closures, prototypes, event loop, modules, async programming, and runtime behavior.',
    subtopics: ['Language Semantics & Closures', 'Prototypes & Objects', 'Event Loop & Async', 'Modules & Tooling'],
  }),
  category({
    id: 'typescript', name: 'TypeScript', iconName: 'FileCode2',
    description: 'Generics, inference, conditional and mapped types, narrowing, modules, and type-safe architecture.',
    subtopics: ['Generics & Inference', 'Conditional & Mapped Types', 'Narrowing & Discriminated Unions', 'Type-Safe Architecture'],
  }),
  category({
    id: 'nextjs', name: 'Next.js', iconName: 'Globe',
    description: 'App Router, React Server Components, server actions, caching, routing, and rendering strategies.',
    subtopics: ['App Router & Layouts', 'Server Components & Actions', 'SSR, SSG & ISR', 'Caching & Middleware'],
  }),
  category({
    id: 'vue', name: 'Vue & Nuxt', iconName: 'Braces',
    description: 'Vue reactivity, Composition API, component design, state management, and Nuxt rendering.',
    subtopics: ['Reactivity & Composition API', 'Components & State', 'Routing & Forms', 'Nuxt & Server Rendering'],
  }),
  category({
    id: 'nodejs', name: 'Node.js', iconName: 'Server',
    description: 'Event loop, libuv, streams, worker threads, clustering, memory, and backend runtime design.',
    subtopics: ['Event Loop & Microtasks', 'Streams & Backpressure', 'Workers & Clustering', 'Memory & Diagnostics'],
  }),
  category({
    id: 'backend-engineering', name: 'Backend Engineering', iconName: 'Server',
    description: 'Service architecture, business logic, persistence, authentication, resilience, and scalability.',
    subtopics: ['Service Layer Architecture', 'Persistence & Transactions', 'Authentication & Authorization', 'Resilience & Scalability'],
  }),
  category({
    id: 'api-design', name: 'API Design: REST, GraphQL & gRPC', iconName: 'Network',
    description: 'Resource modeling, API contracts, versioning, pagination, GraphQL, gRPC, and protocol trade-offs.',
    subtopics: ['REST & HTTP Semantics', 'GraphQL', 'gRPC & Protobuf', 'Versioning, Pagination & Compatibility'],
  }),
  category({
    id: 'python', name: 'Python', iconName: 'Terminal',
    description: 'Language internals, typing, iterators, concurrency, packaging, and production Python.',
    subtopics: ['Object Model & Data Model', 'Typing & Metaprogramming', 'Asyncio & Multiprocessing', 'Packaging & Performance'],
  }),
  category({
    id: 'python-web', name: 'Django, FastAPI & Python Web', iconName: 'Server',
    description: 'Python web frameworks, ORM behavior, dependency injection, validation, async APIs, and deployment.',
    subtopics: ['Django & ORM', 'FastAPI & Validation', 'Async Web Services', 'Security & Deployment'],
  }),
  category({
    id: 'golang', name: 'Go', iconName: 'Cpu',
    description: 'Goroutines, channels, interfaces, memory, runtime scheduling, context, and service design.',
    subtopics: ['Goroutines & Channels', 'Interfaces & Generics', 'Runtime & Memory', 'Context & Service Patterns'],
  }),
  category({
    id: 'c-cpp', name: 'C & C++', iconName: 'Cpu',
    description: 'Memory, pointers, object lifetime, templates, concurrency, systems programming, and performance.',
    subtopics: ['Memory & Object Lifetime', 'Templates & Modern C++', 'Concurrency & Atomics', 'Systems Programming'],
  }),
  category({
    id: 'dotnet', name: 'C# & .NET', iconName: 'FileCode2',
    description: 'CLR, modern C#, async programming, LINQ, ASP.NET Core, dependency injection, and EF Core.',
    subtopics: ['CLR & Language Features', 'Async, LINQ & Collections', 'ASP.NET Core', 'Entity Framework & Testing'],
  }),
  category({
    id: 'kotlin', name: 'Kotlin', iconName: 'FileCode2',
    description: 'Null safety, coroutines, functional constructs, JVM interoperability, and application architecture.',
    subtopics: ['Type System & Null Safety', 'Coroutines & Flow', 'JVM Interoperability', 'Application Architecture'],
  }),
  category({
    id: 'rust', name: 'Rust', iconName: 'Cpu',
    description: 'Ownership, borrowing, lifetimes, traits, async Rust, unsafe boundaries, and systems programming.',
    subtopics: ['Ownership & Borrowing', 'Lifetimes & Traits', 'Concurrency & Async', 'Unsafe Rust & Systems'],
  }),
  category({
    id: 'php', name: 'PHP & Laravel', iconName: 'Server',
    description: 'Modern PHP, Composer, Laravel architecture, queues, ORM, testing, and web application design.',
    subtopics: ['Modern PHP & Composer', 'Laravel Architecture', 'Eloquent, Queues & Caching', 'Testing & Security'],
  }),
  category({
    id: 'ruby', name: 'Ruby & Rails', iconName: 'Server',
    description: 'Ruby object model, metaprogramming, Rails conventions, Active Record, jobs, and performance.',
    subtopics: ['Ruby Object Model', 'Rails Architecture', 'Active Record & Transactions', 'Jobs, Testing & Performance'],
  }),
  category({
    id: 'scala-functional', name: 'Scala & Functional Programming', iconName: 'FileCode2',
    description: 'Functional design, immutability, algebraic data types, effects, concurrency, and Scala ecosystems.',
    subtopics: ['Functional Principles', 'Types & Pattern Matching', 'Effects & Concurrency', 'Scala Ecosystem'],
  }),
  category({
    id: 'dsa', name: 'Data Structures & Algorithms', iconName: 'BookOpen',
    description: 'Complexity, arrays, trees, graphs, dynamic programming, greedy techniques, and algorithm design.',
    subtopics: [
      'Complexity Analysis & Amortized Analysis',
      'Arrays, Strings & Matrices',
      'Linked Lists',
      'Stacks, Queues & Deques',
      'Hash Tables, Maps & Sets',
      'Trees & Binary Search Trees',
      'Balanced Trees: AVL, Red-Black & B-Trees',
      'Heaps & Priority Queues',
      'Tries, Radix Trees & Suffix Structures',
      'Graph Representations & Traversal',
      'Disjoint Set Union / Union-Find',
      'Fenwick Trees, Segment Trees & Sparse Tables',
      'Bloom Filters & Probabilistic Structures',
      'Skip Lists',
      'Persistent & Immutable Data Structures',
      'Concurrent & Lock-Free Data Structures',
      'Searching & Binary Search Patterns',
      'Sorting & Selection Algorithms',
      'Recursion & Backtracking',
      'Divide and Conquer',
      'Greedy Algorithms',
      'Dynamic Programming',
      'Graph Algorithms',
      'String Matching Algorithms',
    ],
  }),
  category({
    id: 'object-design', name: 'Object-Oriented Design & Patterns', iconName: 'Boxes',
    description: 'SOLID design, domain modeling, patterns, refactoring, extensibility, and maintainable object systems.',
    subtopics: ['SOLID & Domain Modeling', 'Creational & Structural Patterns', 'Behavioral Patterns', 'Refactoring & Maintainability'],
  }),
  category({
    id: 'operating-systems', name: 'Operating Systems', iconName: 'Cpu',
    description: 'Processes, threads, scheduling, virtual memory, filesystems, synchronization, and kernel concepts.',
    subtopics: ['Processes, Threads & Scheduling', 'Memory Management', 'Filesystems & I/O', 'Synchronization & Deadlocks'],
  }),
  category({
    id: 'networking', name: 'Computer Networking', iconName: 'Network',
    description: 'TCP/IP, DNS, HTTP, TLS, routing, load balancing, proxies, and network troubleshooting.',
    subtopics: ['TCP/IP & Routing', 'DNS, HTTP & TLS', 'Load Balancing & Proxies', 'Network Security & Diagnostics'],
  }),
  category({
    id: 'computer-architecture', name: 'Computer Architecture', iconName: 'Cpu',
    description: 'CPU execution, caches, memory hierarchy, instruction sets, parallelism, storage, and hardware trade-offs.',
    subtopics: ['CPU & Instruction Execution', 'Caches & Memory Hierarchy', 'Parallelism & Accelerators', 'Storage & I/O'],
  }),
  category({
    id: 'compilers', name: 'Compilers & Programming Languages', iconName: 'FileCode2',
    description: 'Lexing, parsing, type systems, intermediate representations, optimization, runtimes, and interpreters.',
    subtopics: ['Lexing & Parsing', 'Type Systems & Semantics', 'IR & Optimization', 'Runtimes & Interpreters'],
  }),
  category({
    id: 'system-design', name: 'System Design', iconName: 'Network',
    description: 'Scalable architecture, caching, partitioning, availability, capacity, consistency, and trade-offs.',
    subtopics: ['Scalability & Capacity', 'Caching & Partitioning', 'Availability & Consistency', 'Architecture Trade-offs'],
  }),
  category({
    id: 'distributed-systems', name: 'Distributed Systems', iconName: 'Network',
    description: 'Consensus, replication, clocks, consistency, fault tolerance, coordination, and distributed transactions.',
    subtopics: ['Consensus & Coordination', 'Replication & Consistency', 'Time, Ordering & Clocks', 'Fault Tolerance & Transactions'],
  }),
  category({
    id: 'microservices', name: 'Microservices Architecture', iconName: 'Boxes',
    description: 'Service boundaries, discovery, resilience, sagas, observability, gateways, and deployment patterns.',
    subtopics: ['Service Boundaries & Discovery', 'Resilience Patterns', 'Sagas & Data Ownership', 'Gateways & Observability'],
  }),
  category({
    id: 'event-driven', name: 'Event-Driven Systems & Messaging', iconName: 'Network',
    description: 'Kafka, queues, streams, delivery semantics, schemas, event sourcing, CQRS, and backpressure.',
    subtopics: ['Queues, Topics & Streams', 'Kafka & Broker Design', 'Delivery Semantics & Schemas', 'Event Sourcing & CQRS'],
  }),
  category({
    id: 'database-engineering', name: 'Database Engineering & SQL', iconName: 'Database',
    description: 'Relational design, SQL, transactions, indexes, query planning, normalization, and database operations.',
    subtopics: ['Relational Modeling & SQL', 'Transactions & Isolation', 'Indexes & Query Planning', 'Replication & Operations'],
  }),
  category({
    id: 'postgres', name: 'PostgreSQL', iconName: 'Database',
    description: 'MVCC, WAL, indexing, query plans, vacuum, locking, partitioning, extensions, and operations.',
    subtopics: ['MVCC, WAL & Vacuum', 'Indexes & Query Plans', 'Locks & Isolation', 'Partitioning & Operations'],
  }),
  category({
    id: 'mysql', name: 'MySQL & MariaDB', iconName: 'Database',
    description: 'InnoDB, indexes, execution plans, transactions, locking, replication, clustering, and operations.',
    subtopics: ['InnoDB & Storage', 'Indexes & Query Plans', 'Transactions & Locking', 'Replication & Operations'],
  }),
  category({
    id: 'nosql', name: 'NoSQL Databases', iconName: 'Database',
    description: 'Document, key-value, wide-column, graph, and time-series models with consistency and scaling trade-offs.',
    subtopics: ['Document & Key-Value Stores', 'Wide-Column & Time-Series', 'Graph Databases', 'Consistency & Data Modeling'],
  }),
  category({
    id: 'redis-caching', name: 'Redis & Caching', iconName: 'Database',
    description: 'Cache patterns, eviction, persistence, distributed locks, pub/sub, clustering, and stampede prevention.',
    subtopics: ['Cache Patterns & Eviction', 'Data Structures & Persistence', 'Locks, Pub/Sub & Streams', 'Clustering & Stampede Control'],
  }),
  category({
    id: 'search', name: 'Search Engines & Elasticsearch', iconName: 'Database',
    description: 'Inverted indexes, relevance, analyzers, distributed search, aggregations, scaling, and operations.',
    subtopics: ['Indexing & Analysis', 'Ranking & Relevance', 'Distributed Search', 'Aggregations & Operations'],
  }),
  category({
    id: 'cloud-architecture', name: 'Cloud Architecture', iconName: 'Globe',
    description: 'AWS, Azure, GCP, compute, storage, networking, identity, serverless, reliability, cost, and sustainability.',
    subtopics: ['AWS, Azure & GCP', 'Compute, Storage & Networking', 'Identity & Serverless', 'Reliability, Cost & Sustainability'],
  }),
  category({
    id: 'devops-cicd', name: 'DevOps & CI/CD', iconName: 'Boxes',
    description: 'Build pipelines, delivery strategies, artifact management, automation, GitOps, and release engineering.',
    subtopics: ['Continuous Integration', 'Delivery & Deployment Strategies', 'Artifacts & Supply Chain', 'GitOps & Release Engineering'],
  }),
  category({
    id: 'docker', name: 'Docker & Kubernetes', iconName: 'Boxes',
    description: 'Container internals, images, orchestration, scheduling, services, networking, storage, and security.',
    subtopics: ['Containers & Images', 'Kubernetes Workloads', 'Networking & Storage', 'Scheduling, Security & Operations'],
  }),
  category({
    id: 'infrastructure-as-code', name: 'Infrastructure as Code', iconName: 'Boxes',
    description: 'Terraform, configuration management, state, modules, policy, drift, testing, and infrastructure automation.',
    subtopics: ['Terraform & State', 'Modules & Reuse', 'Policy, Security & Testing', 'Configuration & Drift Management'],
  }),
  category({
    id: 'linux-shell', name: 'Linux & Shell', iconName: 'Terminal',
    description: 'Linux processes, permissions, filesystems, networking, shell scripting, diagnostics, and administration.',
    subtopics: ['Processes & Services', 'Permissions & Filesystems', 'Shell Scripting', 'Networking & Diagnostics'],
  }),
  category({
    id: 'sre-observability', name: 'SRE & Observability', iconName: 'Network',
    description: 'SLIs, SLOs, error budgets, metrics, logs, traces, alerting, incident response, and reliability engineering.',
    subtopics: ['SLIs, SLOs & Error Budgets', 'Metrics, Logs & Traces', 'Alerting & Incident Response', 'Capacity & Reliability'],
  }),
  category({
    id: 'performance-engineering', name: 'Performance Engineering', iconName: 'Cpu',
    description: 'Profiling, benchmarking, load testing, latency, throughput, memory, concurrency, and capacity planning.',
    subtopics: ['Profiling & Benchmarking', 'Latency & Throughput', 'Memory & Concurrency', 'Load Testing & Capacity'],
  }),
  category({
    id: 'cybersecurity', name: 'Cybersecurity & DevSecOps', iconName: 'Network',
    description: 'Application security, threat modeling, identity, cryptography, secure SDLC, cloud and supply-chain security.',
    subtopics: ['Application Security & OWASP', 'Identity & Cryptography', 'Threat Modeling & Secure Design', 'Cloud & Supply-Chain Security'],
  }),
  category({
    id: 'testing-qa', name: 'Testing & Quality Engineering', iconName: 'BookOpen',
    description: 'Unit, integration, contract, end-to-end, property, performance, accessibility, and test architecture.',
    subtopics: ['Unit & Integration Testing', 'Contract & End-to-End Testing', 'Property & Mutation Testing', 'Test Architecture & Automation'],
  }),
  category({
    id: 'data-engineering', name: 'Data Engineering & Big Data', iconName: 'Database',
    description: 'Batch and streaming pipelines, warehouses, lakes, orchestration, governance, quality, and distributed processing.',
    subtopics: ['Batch & Streaming Pipelines', 'Warehouses, Lakes & Lakehouses', 'Spark & Distributed Processing', 'Governance & Data Quality'],
  }),
  category({
    id: 'data-science', name: 'Data Science & Analytics', iconName: 'Database',
    description: 'Statistics, experimentation, data preparation, visualization, analytics, causal reasoning, and communication.',
    subtopics: ['Statistics & Probability', 'Experimentation & Causality', 'Data Preparation & Analysis', 'Visualization & Communication'],
  }),
  category({
    id: 'machine-learning', name: 'Machine Learning', iconName: 'Cpu',
    description: 'Supervised and unsupervised learning, feature engineering, evaluation, deep learning, and responsible ML.',
    subtopics: ['Learning Algorithms', 'Features & Evaluation', 'Deep Learning', 'Responsible & Explainable ML'],
  }),
  category({
    id: 'generative-ai', name: 'Generative AI, LLMs & Agents', iconName: 'Cpu',
    description: 'Transformers, prompting, retrieval, embeddings, agents, evaluation, safety, inference, and LLM systems.',
    subtopics: ['Transformers & Foundation Models', 'RAG & Embeddings', 'Agents & Tool Use', 'Evaluation, Safety & Inference'],
  }),
  category({
    id: 'mlops', name: 'MLOps & AI Infrastructure', iconName: 'Boxes',
    description: 'Training pipelines, model registries, deployment, feature stores, monitoring, GPUs, and AI platform operations.',
    subtopics: ['Training & Experiment Tracking', 'Model Registry & Deployment', 'Feature Stores & Monitoring', 'GPU & AI Infrastructure'],
  }),
  category({
    id: 'mobile-engineering', name: 'Mobile Engineering', iconName: 'Braces',
    description: 'Mobile architecture, lifecycle, networking, storage, offline behavior, performance, security, and delivery.',
    subtopics: ['Application Architecture & Lifecycle', 'Networking, Storage & Offline', 'Performance & Security', 'Testing & Store Delivery'],
  }),
  category({
    id: 'android', name: 'Android & Jetpack Compose', iconName: 'Braces',
    description: 'Android lifecycle, Kotlin, Compose, coroutines, persistence, background work, testing, and performance.',
    subtopics: ['Lifecycle & Architecture', 'Compose UI', 'Coroutines, Storage & Work', 'Testing & Performance'],
  }),
  category({
    id: 'ios', name: 'iOS, Swift & SwiftUI', iconName: 'Braces',
    description: 'Swift, UIKit, SwiftUI, concurrency, persistence, lifecycle, testing, and Apple platform architecture.',
    subtopics: ['Swift Language & Concurrency', 'UIKit & SwiftUI', 'Persistence & Lifecycle', 'Testing & Performance'],
  }),
  category({
    id: 'cross-platform-mobile', name: 'Flutter & React Native', iconName: 'Braces',
    description: 'Cross-platform rendering, state, navigation, native bridges, performance, testing, and release engineering.',
    subtopics: ['Flutter & Dart', 'React Native', 'Native Bridges & Modules', 'Performance, Testing & Delivery'],
  }),
  category({
    id: 'embedded-iot', name: 'Embedded Systems & IoT', iconName: 'Cpu',
    description: 'Microcontrollers, real-time constraints, firmware, buses, protocols, power, safety, and device-cloud systems.',
    subtopics: ['Microcontrollers & Firmware', 'Real-Time Systems', 'Hardware Interfaces & Protocols', 'IoT Security & Device Cloud'],
  }),
  category({
    id: 'blockchain', name: 'Blockchain & Web3', iconName: 'Network',
    description: 'Distributed ledgers, consensus, smart contracts, cryptography, token systems, scaling, and security.',
    subtopics: ['Ledgers & Consensus', 'Smart Contracts', 'Cryptography & Wallets', 'Scaling & Security'],
  }),
  category({
    id: 'game-development', name: 'Game Development', iconName: 'Cpu',
    description: 'Game loops, engines, rendering, physics, networking, ECS, optimization, tooling, and multiplayer systems.',
    subtopics: ['Game Loops & Engines', 'Rendering & Physics', 'ECS & Gameplay Architecture', 'Multiplayer & Optimization'],
  }),
  category({
    id: 'web-accessibility', name: 'Web Accessibility & Inclusive Design', iconName: 'Globe',
    description: 'WCAG, semantic structure, keyboard access, assistive technology, accessible components, and testing.',
    subtopics: ['WCAG & Semantics', 'Keyboard & Focus', 'Assistive Technologies', 'Accessible UI & Testing'],
  }),
  category({
    id: 'git-collaboration', name: 'Git & Engineering Collaboration', iconName: 'FileCode2',
    description: 'Git internals, branching, merging, review workflows, repository strategy, documentation, and teamwork.',
    subtopics: ['Git Objects & History', 'Branching, Merging & Recovery', 'Code Review & Repository Strategy', 'Documentation & Collaboration'],
  }),
  category({
    id: 'software-delivery', name: 'Software Delivery, Agile & Product Engineering', iconName: 'BookOpen',
    description: 'Requirements, estimation, iterative delivery, architecture decisions, product discovery, metrics, and quality.',
    subtopics: ['Requirements & Discovery', 'Estimation & Iterative Delivery', 'Architecture Decisions', 'Product & Delivery Metrics'],
  }),
  category({
    id: 'engineering-leadership', name: 'Engineering Leadership', iconName: 'BookOpen',
    description: 'Technical leadership, mentoring, team design, decision making, execution, communication, and organizational systems.',
    subtopics: ['Technical Strategy & Decisions', 'Mentoring & Team Design', 'Execution & Prioritization', 'Communication & Culture'],
  }),
  category({
    id: 'enterprise-integration', name: 'Enterprise Integration', iconName: 'Network',
    description: 'Integration patterns, ESBs, workflow, identity federation, legacy modernization, B2B, and enterprise architecture.',
    subtopics: ['Integration Patterns & Middleware', 'Workflow & Orchestration', 'Identity & B2B Integration', 'Legacy Modernization'],
  }),
  category({
    id: 'real-time-systems', name: 'Real-Time & Streaming Systems', iconName: 'Network',
    description: 'Low-latency systems, stream processing, WebSockets, media, scheduling, determinism, and backpressure.',
    subtopics: ['Low-Latency Architecture', 'Stream Processing', 'WebSockets & Real-Time Media', 'Scheduling & Determinism'],
  }),
  category({
    id: 'robotics', name: 'Robotics & Autonomous Systems', iconName: 'Cpu',
    description: 'Sensing, localization, planning, control, perception, simulation, safety, and robotics software architecture.',
    subtopics: ['Sensors & Perception', 'Localization & Mapping', 'Planning & Control', 'Simulation & Safety'],
  }),
  category({
    id: 'spatial-computing', name: 'AR, VR & Spatial Computing', iconName: 'Globe',
    description: '3D rendering, tracking, spatial interaction, immersive UX, performance, devices, and real-time collaboration.',
    subtopics: ['3D Rendering & Tracking', 'Spatial Interaction & UX', 'Devices & Performance', 'Shared Immersive Systems'],
  }),
  category({
    id: 'quantum-computing', name: 'Quantum Computing', iconName: 'Cpu',
    description: 'Qubits, circuits, gates, algorithms, noise, error correction, simulation, and hybrid quantum systems.',
    subtopics: ['Qubits, Gates & Circuits', 'Quantum Algorithms', 'Noise & Error Correction', 'Simulation & Hybrid Systems'],
  }),
];
