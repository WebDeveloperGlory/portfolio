"use client";

import { useState, useEffect } from "react";
import { Mail, ArrowUpRight, Menu, X } from "lucide-react";

const GithubIcon = ({
  size = 18,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const NAV_LINKS = ["about", "projects", "stack", "writing", "contact"] as const;
type NavLink = (typeof NAV_LINKS)[number];

interface Project {
  id: string;
  name: string;
  tag: string;
  tagType: "ongoing" | "client" | "confidential" | "open" | "wip";
  year: string;
  hours: string;
  oneLiner: string;
  description: string;
  decisions: string[];
  stack: string[];
  consumed: string;
  frontend: string;
  status: string;
  github?: string;
  canShow: boolean;
  metrics: string[];
  index: number;
}

const PROJECTS: Project[] = [
  {
    id: "campscore",
    name: "CampScore / FSM",
    tag: "ORIGIN · ONGOING",
    tagType: "ongoing",
    year: "2024–NOW",
    hours: "166H BACKEND · 140H FRONTEND",
    oneLiner:
      "The project that started it all — a university sports platform born from the absence of any central record of campus football history.",
    description:
      "No database. No records. Just word of mouth and screenshots. I built FSM to fix that — a full sports management platform covering competitions, fixtures, player stats, TOTS voting, and real-time live match updates. What began as a JavaScript API became a dual-version system (V1/V1.2 in JS, V2 in TypeScript) as I used the project to learn TypeScript properly. V2 introduced WebSockets for live match broadcasting, a blog/media system, basketball support, and a deeper role hierarchy. It ran live for a full semester, served real competitions, and now lives in a full SaaS refactor as CampScore.",
    decisions: [
      "Dual-version architecture — V1 (JS) and V2 (TS) ran in parallel, enabling gradual migration with zero downtime for the live system",
      "Mongoose discriminator pattern for competition types — league tables, knockout brackets, and group stages extended from a single base schema",
      "Isolated live fixture collection — real-time match data lives separately; WebSocket rooms broadcast to clients without polluting historical records",
      "TOTS weighted voting — admin votes carry 10× weight; algorithm determines winning formations and top players per position automatically",
      "Audit middleware on every admin action — IP, user agent, before/after state captured asynchronously so it never adds latency",
    ],
    stack: [
      "Node.js",
      "Express",
      "MongoDB",
      "TypeScript",
      "Socket.IO",
      "JWT",
      "Swagger",
      "Cloudinary",
      "Nodemailer",
    ],
    consumed: "REST API + WebSocket (Socket.IO) + Swagger docs at /api-docs",
    frontend:
      "Collaborated with a frontend developer. Admin panel designed and built by me in Next.js.",
    status: "Frontend being stabilised. CampScore SaaS refactor in progress.",
    github: "#",
    canShow: true,
    metrics: [
      "13+ Mongoose models",
      "2 API versions",
      "7 admin roles",
      "Real-time WebSockets",
      "TOTS voting system",
    ],
    index: 0,
  },
  {
    id: "attendance",
    name: "Attendance System",
    tag: "CLIENT PROJECT",
    tagType: "client",
    year: "2025",
    hours: "~50H",
    oneLiner:
      "Biometric university attendance — backend, Flutter app, and a web fallback when the hardware wouldn't cooperate.",
    description:
      "A client needed a complete attendance system for their final-year project. I built the backend API and a Flutter mobile application. The original plan was a fingerprint reader with Android/iOS connectivity — when the hardware couldn't be sourced, I also built a web version that interfaced directly with the fingerprint scanner. Three surfaces, one backend.",
    decisions: [
      "Unified user model with role polymorphism — single User schema with conditional fields instead of separate collections",
      "Automated attendance record creation — absent records pre-generated for all enrolled students when a class is created",
      "Fingerprint verification abstracted as a swappable service — configurable failure rate simulates hardware; drop-in replacement when scanners arrive",
      "MongoDB aggregation pipelines for analytics — weekly summaries reduced from 4 queries to a single pipeline",
      "Service-controller separation — business logic in service files, HTTP handling in controllers",
    ],
    stack: [
      "Node.js",
      "Express",
      "MongoDB",
      "JWT",
      "bcrypt",
      "Swagger",
      "Flutter",
    ],
    consumed:
      "REST API with Bearer token auth. Flutter app + web interface consumed same endpoints.",
    frontend:
      "Flutter mobile app (first Flutter project). Web version for fingerprint scanner. Both built by me.",
    status: "Delivered to client.",
    canShow: false,
    metrics: [
      "80+ endpoints",
      "3 user roles",
      "Biometric integration",
      "Analytics dashboard",
      "First Flutter app",
    ],
    index: 1,
  },
  {
    id: "hilite",
    name: "Hilite",
    tag: "CLIENT · CONFIDENTIAL",
    tagType: "confidential",
    year: "2025–2026",
    hours: "48H BACKEND · 10H ADMIN",
    oneLiner:
      "Social platform for footballers — skill videos, talent discovery, real-time chat, and token-based gifting.",
    description:
      "Hilite solves a real problem: football talent is fragmented across local networks with no central place to surface it. Players upload skill videos, fans and clubs discover them, agents scout, and supporters gift tokens. I built the entire backend solo — 103+ endpoints, 5 user roles, real-time chat via Socket.IO, Flutterwave payment integration, and a custom recommendation engine with no external ML services. Admin panel in Next.js also by me.",
    decisions: [
      "Custom recommendation algorithm — built from scratch in 48h. Multi-factor scoring: recency decay, engagement signals, position matching, mutual connections. Sub-100ms at 10K+ posts.",
      "MongoDB over PostgreSQL — role-based profiles have genuinely different shapes; schema flexibility avoided nullable column sprawl",
      "REST + Socket.IO only — REST for cacheable CRUD; Socket.IO for chat, typing, read receipts, and online status",
      "Local storage + Sharp/FFmpeg over Cloudinary — cost optimisation mid-project; media processed server-side",
      "Flutterwave webhooks — token purchase and gifting verified server-side before crediting accounts",
    ],
    stack: [
      "Node.js",
      "Express",
      "MongoDB",
      "Socket.IO",
      "Flutterwave",
      "JWT",
      "Sharp",
      "FFmpeg",
      "Nodemailer",
      "Swagger",
      "Next.js",
    ],
    consumed:
      "REST API + WebSocket. Frontend team (React Native + React.js) consumed without backend changes.",
    frontend:
      "Admin panel built by me in Next.js. Mobile app by a separate developer.",
    status: "Deployed on Render. Code is confidential.",
    canShow: false,
    metrics: [
      "103+ endpoints",
      "5 user roles",
      "<100ms recommendations",
      "Real-time chat",
      "Token payments",
    ],
    index: 2,
  },
  {
    id: "cachevault",
    name: "CacheVault",
    tag: "OPEN SOURCE · DDD",
    tagType: "open",
    year: "2026",
    hours: "10H BACKEND · 3H FRONTEND",
    oneLiner:
      "Built to understand caching properly. First public showcase of the DDD structure I now ship with.",
    description:
      "CacheVault is intentionally a learning project, but a production-quality one. Beyond standard cache-aside, I implemented a zRange-based popularity tracker that caches only the top 3 product categories and automatically invalidates when a category drops out. Auth uses the token pattern I now use across all projects: short-lived access token in memory, refresh token as an HTTP-only cookie.",
    decisions: [
      "zRange popularity caching — only the top 3 categories get cached; automatic invalidation when a category drops out",
      "Cache-aside with explicit TTLs — product list (60s), single product (300s), category (120s), user profile (300s)",
      "Docker for local Redis — reproducible dev environment, no local install required",
      "DDD module structure — first public project in this architecture; controller/service/repo/cache layers per module",
      "Refresh token rotation — tokens stored in DB, rotated on every use; allDevices logout revokes all sessions",
    ],
    stack: [
      "Node.js",
      "TypeScript",
      "Express",
      "MongoDB",
      "Redis",
      "Docker",
      "JWT",
      "Zod",
      "bcrypt",
    ],
    consumed: "REST API. GitHub repo available.",
    frontend: "Simple frontend built by me to demonstrate the API.",
    status: "GitHub available. Deployment coming.",
    github: "#",
    canShow: true,
    metrics: [
      "zRange popularity cache",
      "Cache-aside pattern",
      "Token rotation",
      "DDD architecture",
      "Docker + Redis",
    ],
    index: 3,
  },
  {
    id: "mediclaim",
    name: "MediClaim",
    tag: "IN PROGRESS",
    tagType: "wip",
    year: "2025–NOW",
    hours: "54H SO FAR",
    oneLiner:
      "HMO management — hospitals submit pre-auth requests, HMOs decide, then claims and invoices follow. REST and SOAP from one Express app.",
    description:
      "Hospitals and HMOs communicate through fragmented manual processes. MediClaim structures that flow: pre-auth request → HMO decision → claim + invoice. First project with PostgreSQL + Drizzle ORM — the relational nature of pre-auths, items, tariffs, and claims demanded it. REST serves the dashboards; SOAP handles legacy hospital system integrations from the same Express app.",
    decisions: [
      "PostgreSQL + Drizzle ORM — pre-auths, items, tariffs, claims, invoices, and audit logs are genuinely relational",
      "REST + SOAP from one Express app — REST for dashboards; SOAP for legacy HIS integrations on a separate path",
      "Refresh token rotation with family tracking — token reuse (replay attack) detected by family invalidation",
      "API key system — scoped keys with test/live environments and per-key audit logging",
      "Three separate dashboard identities — hospital, HMO, and admin — same tokens, distinct visual personalities",
    ],
    stack: [
      "Node.js",
      "TypeScript",
      "Express",
      "PostgreSQL",
      "Drizzle ORM",
      "JWT",
      "Nodemailer",
      "Zod",
      "Next.js",
      "Tailwind",
      "Zustand",
      "Axios",
    ],
    consumed:
      "REST API (dashboards) + SOAP API (legacy HIS integrations). Next.js frontend built by me.",
    frontend:
      "Full Next.js frontend — hospital dashboard, HMO dashboard, admin dashboard. Built by me.",
    status: "In active development.",
    canShow: false,
    metrics: [
      "REST + SOAP",
      "PostgreSQL + Drizzle",
      "3 org types",
      "Pre-auth workflow",
      "API key system",
    ],
    index: 4,
  },
];

const STACK: Record<string, string[]> = {
  "Core Languages": ["Node.js", "TypeScript", "JavaScript"],
  Backend: ["Express.js", "REST API design", "WebSockets / Socket.IO", "SOAP"],
  "Databases & ORM": [
    "MongoDB / Mongoose",
    "PostgreSQL / Drizzle ORM",
    "Redis",
  ],
  "Auth & Security": [
    "JWT",
    "Refresh token rotation",
    "HTTP-only cookies",
    "bcrypt",
    "RBAC",
  ],
  Architecture: [
    "Domain-Driven Design (DDD)",
    "Clean architecture",
    "Service-controller pattern",
  ],
  Frontend: ["Next.js", "React", "Tailwind CSS"],
  "DevOps & Tools": ["Docker", "Git", "Swagger / OpenAPI", "Postman"],
  Integrations: [
    "WhatsApp Business API",
    "Flutterwave",
    "Cloudinary",
    "Nodemailer",
    "Sharp / FFmpeg",
  ],
  Learning: ["Flutter (beginner)", "German 🇩🇪"],
};

const TAG_BG: Record<string, string> = {
  ongoing: "bg-yellow-400 text-black",
  client: "bg-blue-500 text-white",
  confidential: "bg-red-500 text-white",
  open: "bg-green-500 text-black",
  wip: "bg-violet-500 text-white",
};

function NavBar({
  active,
  onNav,
}: {
  active: string;
  onNav: (id: NavLink) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b-2 border-white">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => onNav("about")}
          className="font-mono text-white text-sm font-bold tracking-widest uppercase hover:text-yellow-400 transition-colors"
        >
          GLORY UMUERRI
        </button>
        <div className="hidden md:flex items-center gap-0">
          {NAV_LINKS.map((l) => (
            <button
              key={l}
              onClick={() => onNav(l)}
              className={`font-mono text-xs font-bold tracking-widest uppercase px-4 py-4 border-l border-white/20 transition-colors ${
                active === l
                  ? "bg-yellow-400 text-black"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-black border-t-2 border-white">
          {NAV_LINKS.map((l) => (
            <button
              key={l}
              onClick={() => {
                onNav(l);
                setOpen(false);
              }}
              className="block w-full text-left font-mono text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/5 px-6 py-3 border-b border-white/10"
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

function Hero({ onNav }: { onNav: (id: NavLink) => void }) {
  return (
    <section
      id="about"
      className="min-h-screen pt-14 bg-black flex flex-col justify-center"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="border-b-2 border-white/10 pb-8 mb-8">
          <p className="font-mono text-xs text-yellow-400 font-bold tracking-widest uppercase mb-4">
            Backend Engineer · Lagos, NG · FUPRE 400L EEE
          </p>
        </div>

        <h1 className="font-mono font-black text-white leading-none tracking-tighter mb-0">
          <span className="block text-[clamp(3.5rem,12vw,9rem)]">GLORY</span>
          <span className="block text-[clamp(3.5rem,12vw,9rem)] text-white/15">
            UMUERRI
          </span>
        </h1>

        <div className="mt-12 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-white/60 text-lg leading-relaxed">
              I build the infrastructure other developers ship on. REST APIs,
              real-time systems, and clean architecture in the
              Node.js/TypeScript ecosystem. Finishing an EEE degree and
              preparing for a Masters in Mechatronics in Germany.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a
                href="https://github.com/WebDeveloperGlory"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border-2 border-white text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                <GithubIcon size={14} /> GitHub
              </a>
              <a
                href="mailto:gloryumuerri223@gmail.com"
                className="flex items-center gap-2 px-4 py-2 border-2 border-white/30 text-white/60 font-mono text-xs font-bold uppercase tracking-widest hover:border-white hover:text-white transition-all"
              >
                <Mail size={14} /> Email
              </a>
              <button
                onClick={() => onNav("projects")}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-yellow-300 transition-colors"
              >
                View Work <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10">
            {[
              { n: "6", label: "PROJECTS" },
              { n: "300+", label: "ENDPOINTS" },
              { n: "2", label: "SAAS IN PROGRESS" },
              { n: "400+", label: "WAKATIME HRS" },
            ].map((s) => (
              <div key={s.label} className="bg-black p-6">
                <p className="font-mono font-black text-white text-4xl md:text-5xl leading-none">
                  {s.n}
                </p>
                <p className="font-mono text-xs text-white/30 font-bold tracking-widest mt-2">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-b-2 border-white/10 transition-colors ${expanded ? "border-white/30" : ""}`}
    >
      <button
        className="w-full text-left py-8 group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="font-mono text-xs text-white/20 font-bold">
                0{project.index + 1}
              </span>
              <span
                className={`font-mono text-xs font-black px-2 py-0.5 ${TAG_BG[project.tagType]}`}
              >
                {project.tag}
              </span>
              <span className="font-mono text-xs text-white/30 font-bold">
                {project.year}
              </span>
              <span className="font-mono text-xs text-white/20">
                {project.hours}
              </span>
            </div>
            <h3 className="font-mono font-black text-white text-2xl md:text-3xl uppercase tracking-tight group-hover:text-yellow-400 transition-colors mb-3">
              {project.name}
            </h3>
            <p className="text-white/50 text-sm leading-relaxed max-w-2xl">
              {project.oneLiner}
            </p>
          </div>
          <div
            className={`shrink-0 mt-2 w-10 h-10 border-2 flex items-center justify-center font-mono font-black text-xl transition-all ${expanded ? "bg-yellow-400 border-yellow-400 text-black rotate-45" : "border-white/20 text-white/30 group-hover:border-white/60"}`}
          >
            +
          </div>
        </div>

        {!expanded && (
          <div className="flex flex-wrap gap-2 mt-5">
            {project.metrics.map((m) => (
              <span
                key={m}
                className="font-mono text-xs text-white/30 border border-white/10 px-2 py-1"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </button>

      {expanded && (
        <div className="pb-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/10 mb-8">
            {project.metrics.map((m) => (
              <div key={m} className="bg-black p-4">
                <p className="font-mono text-xs font-bold text-white/60">{m}</p>
              </div>
            ))}
          </div>

          <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-3xl">
            {project.description}
          </p>

          <div className="mb-8">
            <p className="font-mono text-xs font-black text-white/20 uppercase tracking-widest mb-5">
              / Architecture decisions
            </p>
            <div className="space-y-0 border-l-2 border-yellow-400/30 pl-6">
              {project.decisions.map((d, i) => (
                <div
                  key={i}
                  className="py-3 border-b border-white/5 last:border-b-0"
                >
                  <p className="text-white/55 text-sm leading-relaxed">
                    <span className="font-mono text-yellow-400/60 text-xs mr-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {d}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div>
              <p className="font-mono text-xs font-black text-white/20 uppercase tracking-widest mb-3">
                / Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((s) => (
                  <span
                    key={s}
                    className="font-mono text-xs text-white/60 border border-white/15 px-2 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-xs font-black text-white/20 uppercase tracking-widest mb-3">
                / Consumption
              </p>
              <p className="text-white/50 text-sm mb-2">{project.consumed}</p>
              <p className="text-white/30 text-xs">{project.frontend}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            <span className="font-mono text-xs text-white/25">
              {project.status}
            </span>
            {project.canShow && project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-2 font-mono text-xs font-bold text-yellow-400 hover:text-yellow-300 uppercase tracking-widest transition-colors"
              >
                <GithubIcon size={12} /> View Source <ArrowUpRight size={11} />
              </a>
            )}
            {!project.canShow && (
              <span className="ml-auto font-mono text-xs text-white/15">
                CODE NOT PUBLIC
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Projects() {
  return (
    <section
      id="projects"
      className="py-24 bg-black border-t-2 border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="font-mono text-xs font-bold text-white/20 uppercase tracking-widest mb-2">
              / Selected work
            </p>
            <h2 className="font-mono font-black text-white text-5xl md:text-6xl uppercase tracking-tighter">
              Projects
            </h2>
          </div>
          <p className="hidden md:block font-mono text-xs text-white/25 max-w-xs text-right leading-relaxed">
            Ordered by timeline. Each reflects where I was technically and what
            I was learning.
          </p>
        </div>
        <div>
          {PROJECTS.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stack() {
  return (
    <section id="stack" className="py-24 bg-black border-t-2 border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <p className="font-mono text-xs font-bold text-white/20 uppercase tracking-widest mb-2">
            / Capabilities
          </p>
          <h2 className="font-mono font-black text-white text-5xl md:text-6xl uppercase tracking-tighter">
            Stack
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {Object.entries(STACK).map(([cat, items]) => (
            <div
              key={cat}
              className="bg-black p-6 hover:bg-white/3 transition-colors"
            >
              <p className="font-mono text-xs font-black text-yellow-400 uppercase tracking-widest mb-4">
                {cat}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <p key={item} className="font-mono text-sm text-white/50">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Writing() {
  return (
    <section id="writing" className="py-24 bg-black border-t-2 border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <p className="font-mono text-xs font-bold text-white/20 uppercase tracking-widest mb-2">
            / Notes
          </p>
          <h2 className="font-mono font-black text-white text-5xl md:text-6xl uppercase tracking-tighter">
            Writing
          </h2>
        </div>
        <div className="border-2 border-white/10 p-16 text-center">
          <p className="font-mono font-black text-5xl text-white/10 uppercase mb-4">
            COMING SOON
          </p>
          <p className="font-mono text-sm text-white/30 max-w-sm mx-auto">
            DDD structure, caching patterns, building dual-API architecture from
            real projects.
          </p>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="py-24 bg-black border-t-2 border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <p className="font-mono text-xs font-bold text-white/20 uppercase tracking-widest mb-2">
            / Let&apos;s talk
          </p>
          <h2 className="font-mono font-black text-white text-5xl md:text-6xl uppercase tracking-tighter">
            Contact
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-px bg-white/10 max-w-2xl">
          <a
            href="mailto:gloryumuerri223@gmail.com"
            className="group bg-black p-8 hover:bg-yellow-400 transition-all"
          >
            <Mail
              size={20}
              className="text-white/30 group-hover:text-black mb-4 transition-colors"
            />
            <p className="font-mono font-black text-white group-hover:text-black uppercase tracking-tight text-lg transition-colors">
              Email
            </p>
            <p className="font-mono text-xs text-white/40 group-hover:text-black/60 mt-1 transition-colors">
              gloryumuerri223@gmail.com
            </p>
          </a>
          <a
            href="https://github.com/WebDeveloperGlory"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-black p-8 hover:bg-yellow-400 transition-all"
          >
            <GithubIcon
              size={20}
              className="text-white/30 group-hover:text-black mb-4 transition-colors"
            />
            <p className="font-mono font-black text-white group-hover:text-black uppercase tracking-tight text-lg transition-colors">
              GitHub
            </p>
            <p className="font-mono text-xs text-white/40 group-hover:text-black/60 mt-1 transition-colors">
              WebDeveloperGlory
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t-2 border-white/10 py-8 bg-black">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-mono text-xs text-white/20 font-bold uppercase tracking-widest">
          Glory Umuerri · {new Date().getFullYear()}
        </p>
        <p className="font-mono text-xs text-white/10 uppercase tracking-widest">
          Next.js · Tailwind CSS
        </p>
      </div>
    </footer>
  );
}

export default function PortfolioV3() {
  const [activeSection, setActiveSection] = useState<NavLink>("about");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setActiveSection(entry.target.id as NavLink);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    NAV_LINKS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: NavLink) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-400 selection:text-black">
      <NavBar active={activeSection} onNav={scrollTo} />
      <main>
        <Hero onNav={scrollTo} />
        <Projects />
        <Stack />
        <Writing />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
