#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { parseArgs } from "util";
import "dotenv/config.js";
import OpenRouterClient from "./openrouter.js";

// ─── CLI flags ────────────────────────────────────────────────────────────────
const normalizedArgv = process.argv
  .slice(2)
  .map((arg) => (arg === "-ai" ? "--ai" : arg));

const { values: args } = parseArgs({
  args: normalizedArgv,
  options: {
    output:  { type: "string",  short: "o", default: "grepme-X.md" },
    ignore:  { type: "string",  short: "i", default: "" },
    format:  { type: "string",  short: "f", default: "markdown" }, // markdown | json
    ai:      { type: "string",  short: "a" },
    help:    { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (args.help) {
  console.log(`
Usage: grepme-x [options]

Options:
  -o, --output <file>    Output file name (default: README.md)
  -i, --ignore <dirs>    Comma-separated extra dirs to ignore
  -f, --format <fmt>     Output format: markdown | json (default: markdown)
  -a, --ai, -ai <key>    Enable AI descriptions and pass OpenRouter API key
  -h, --help             Show this help message
`);
  process.exit(0);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".svg",
  ".pdf", ".zip", ".tar", ".gz", ".rar", ".7z",
  ".exe", ".dll", ".so", ".dylib",
  ".ttf", ".otf", ".woff", ".woff2", ".eot",
  ".mp3", ".mp4", ".wav", ".ogg", ".avi", ".mov",
  ".db", ".sqlite", ".lock",
]);

const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"]);

const BASE_IGNORE = ["node_modules", ".git", ".next", "dist", "build", ".cache", "coverage"];
const ignoreRaw = typeof args.ignore === "string" ? args.ignore : "";
const USER_IGNORE = ignoreRaw
  ? ignoreRaw.split(",").map(s => s.trim()).filter(Boolean)
  : [];
const IGNORE = new Set([...BASE_IGNORE, ...USER_IGNORE]);

// ─── File helpers ─────────────────────────────────────────────────────────────
function getFiles(dir) {
  let results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return results;
  }
  for (const file of entries) {
    if (IGNORE.has(file)) continue;
    const full = path.join(dir, file);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (!BINARY_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function isSourceCodeFile(filePath) {
  return SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

// ─── File tree ────────────────────────────────────────────────────────────────
function buildTree(dir, prefix = "", depth = 0) {
  if (depth > 3) return "";
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return ""; }
  const filtered = entries.filter(e => !IGNORE.has(e));
  return filtered
    .map((entry, i) => {
      const isLast = i === filtered.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const full = path.join(dir, entry);
      let stat;
      try { stat = fs.statSync(full); } catch { return ""; }
      if (stat.isDirectory()) {
        const sub = buildTree(full, prefix + (isLast ? "    " : "│   "), depth + 1);
        return `${prefix}${connector}${entry}/\n${sub}`;
      }
      return `${prefix}${connector}${entry}`;
    })
    .filter(Boolean)
    .join("\n");
}

// ─── Route extraction ─────────────────────────────────────────────────────────
function convertNextPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const appIdx = normalized.lastIndexOf("/app/");
  if (appIdx === -1) return null;
  let route = normalized.slice(appIdx + 4);
  // Remove file names
  route = route
    .replace(/\/(route|page)\.(js|ts|jsx|tsx)$/, "")
    .replace(/\/index\.(js|ts|jsx|tsx)$/, "");
  // Next.js dynamic segments
  route = route
    .replace(/\[\.\.\.(\w+)\]/g, ":$1*")
    .replace(/\[(\w+)\]/g, ":$1");
  return route || "/";
}

function extractRoutes(content, filePath) {
  const routes = [];

  // Express / Router / Fastify — regular methods
  const exprRegex = /(app|router|fastify)\.(get|post|put|patch|delete)\s*\(\s*['"`](.*?)['"`]/gi;
  let m;
  while ((m = exprRegex.exec(content)) !== null) {
    routes.push({ method: m[2].toUpperCase(), path: m[3] });
  }

  // Express chained .route('/path').get(...).post(...)
  const chainedRouteRegex = /\.route\s*\(\s*['"`](.*?)['"`]\s*\)\s*((?:\.(get|post|put|patch|delete)\s*\([^)]*\))+)/gi;
  while ((m = chainedRouteRegex.exec(content)) !== null) {
    const routePath = m[1];
    const methods = [...m[2].matchAll(/\.(get|post|put|patch|delete)/gi)];
    for (const method of methods) {
      routes.push({ method: method[1].toUpperCase(), path: routePath });
    }
  }

  // Next.js App Router — named exports (JS + TS)
  const nextRegex = /export\s+(?:async\s+)?(?:const\s+(\w+)\s*=|function\s+(GET|POST|PUT|PATCH|DELETE))/g;
  const httpMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
  while ((m = nextRegex.exec(content)) !== null) {
    const name = (m[1] || m[2] || "").toUpperCase();
    if (httpMethods.has(name)) {
      const nextPath = convertNextPath(filePath);
      if (nextPath) routes.push({ method: name, path: nextPath });
    }
  }

  // Pages Router — pages/api/**
  if (filePath.replace(/\\/g, "/").includes("/pages/api/")) {
    const hasHandler = /export\s+default\s+(async\s+)?function/.test(content);
    if (hasHandler) {
      let route = filePath.replace(/\\/g, "/");
      const apiIdx = route.lastIndexOf("/pages/api");
      if (apiIdx !== -1) {
        route = route.slice(apiIdx + 6).replace(/\.(js|ts)$/, "").replace(/\/index$/, "");
        route = route.replace(/\[(\w+)\]/g, ":$1");
        routes.push({ method: "ANY", path: route || "/api" });
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return routes.filter(r => {
    const key = `${r.method}:${r.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Controller/function extraction ──────────────────────────────────────────
function extractFunctions(content) {
  const found = new Set();
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g,                   // function declarations
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,       // arrow functions
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?function\s*\(/g,         // function expressions
  ];
  for (const regex of patterns) {
    let m;
    while ((m = regex.exec(content)) !== null) {
      if (m[1] && !/^(if|for|while|switch|catch)$/.test(m[1])) {
        found.add(m[1]);
      }
    }
  }
  return [...found];
}

function findMatchingBrace(content, openBraceIndex) {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openBraceIndex; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];
    const prev = content[i - 1];

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inSingleQuote) {
      if (ch === "'" && prev !== "\\") inSingleQuote = false;
      continue;
    }

    if (inDoubleQuote) {
      if (ch === '"' && prev !== "\\") inDoubleQuote = false;
      continue;
    }

    if (inTemplate) {
      if (ch === "`" && prev !== "\\") inTemplate = false;
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }

    if (ch === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (ch === "`") {
      inTemplate = true;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function extractFunctionDetails(content) {
  const found = new Map();
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g,
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g,
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?function\s*\([^)]*\)\s*\{/g,
  ];

  for (const regex of patterns) {
    let m;
    while ((m = regex.exec(content)) !== null) {
      const name = m[1];
      if (!name || /^(if|for|while|switch|catch)$/.test(name)) continue;
      if (found.has(name)) continue;

      const startIndex = m.index;
      const openBraceRelative = m[0].lastIndexOf("{");
      const openBraceIndex = startIndex + openBraceRelative;
      const endIndex = findMatchingBrace(content, openBraceIndex);
      if (endIndex === -1) continue;

      found.set(name, {
        name,
        code: content.slice(startIndex, endIndex + 1),
      });
    }
  }

  return [...found.values()];
}

// ─── Schema extraction ────────────────────────────────────────────────────────
function extractSchemas(content, filePath) {
  const schemas = [];

  // Mongoose
  const mongoRegex = /new\s+(?:mongoose\.)?Schema\s*\(\s*(\{[\s\S]*?\})\s*[,)]/g;
  let m;
  while ((m = mongoRegex.exec(content)) !== null) {
    schemas.push({ type: "mongoose", definition: m[1].slice(0, 300) });
  }

  // Sequelize
  const seqRegex = /sequelize\.define\s*\(\s*['"`](\w+)['"`]\s*,\s*(\{[\s\S]*?\})\s*[,)]/g;
  while ((m = seqRegex.exec(content)) !== null) {
    schemas.push({ type: "sequelize", name: m[1], definition: m[2].slice(0, 300) });
  }

  // Prisma models (from schema.prisma)
  if (filePath.endsWith(".prisma")) {
    const prismaRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
    while ((m = prismaRegex.exec(content)) !== null) {
      schemas.push({ type: "prisma", name: m[1], definition: m[2].trim().slice(0, 300) });
    }
  }

  return schemas;
}

// ─── Environment variables ────────────────────────────────────────────────────
function extractEnvVars(content) {
  const vars = new Set();
  const regex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  let m;
  while ((m = regex.exec(content)) !== null) vars.add(m[1]);
  return [...vars];
}

// ─── Middleware extraction ────────────────────────────────────────────────────
function extractMiddleware(content) {
  const middlewares = [];
  const regex = /(?:app|router)\.use\(\s*(?:['"`](.*?)['"`]\s*,\s*)?(\w+)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    middlewares.push({ path: m[1] || "*", name: m[2] });
  }
  return middlewares;
}

// ─── Authentication detection ─────────────────────────────────────────────────

// Known auth packages → strategy label
const AUTH_PACKAGES = {
  passport:                   "Passport.js",
  "passport-local":           "Passport.js (local)",
  "passport-jwt":             "Passport.js (JWT)",
  "passport-google-oauth20":  "Passport.js (Google OAuth)",
  "passport-github2":         "Passport.js (GitHub OAuth)",
  "passport-facebook":        "Passport.js (Facebook OAuth)",
  jsonwebtoken:               "JWT (jsonwebtoken)",
  "express-jwt":              "express-jwt",
  "jose":                     "JOSE (JWT/JWK)",
  "next-auth":                "NextAuth.js",
  "@auth/core":               "Auth.js",
  "firebase-admin":           "Firebase Auth",
  "@supabase/supabase-js":    "Supabase Auth",
  "clerk":                    "Clerk",
  "@clerk/nextjs":            "Clerk (Next.js)",
  "@clerk/clerk-sdk-node":    "Clerk (Node)",
  "keycloak-connect":         "Keycloak",
  "auth0":                    "Auth0",
  "casbin":                   "Casbin (RBAC/ABAC)",
  "express-session":          "express-session",
  "cookie-session":           "cookie-session",
  bcrypt:                     "bcrypt (password hashing)",
  bcryptjs:                   "bcryptjs (password hashing)",
  argon2:                     "argon2 (password hashing)",
};

// Patterns that flag a route handler as auth-protected
const PROTECTED_PATTERNS = [
  /passport\.authenticate\s*\(/,
  /verifyToken|authenticateToken|requireAuth|isAuthenticated|ensureAuth/,
  /jwt\.verify\s*\(/,
  /checkAuth|authMiddleware|authGuard|withAuth/,
  /requireLogin|loginRequired|isLoggedIn/,
  /\bauth\b.*,/,   // common: router.get('/x', auth, handler)
  /clerk\.(requireAuth|withAuth|getAuth)/,
  /getServerSession|getSession/,              // next-auth
  /admin\.auth\(\)\.verifyIdToken/,           // firebase
  /supabase\.auth\.getUser/,                  // supabase
];

// Patterns that flag a route as public/open
const PUBLIC_PATTERNS = [
  /\/login|\/signin|\/signup|\/register|\/auth\/|\/oauth/i,
  /\/public\//i,
  /noAuth|skipAuth|isPublic/,
];

function detectAuth(allFiles, dependencies) {
  const strategies = new Set();

  // 1. Detect from package.json dependencies
  for (const dep of dependencies) {
    if (AUTH_PACKAGES[dep]) strategies.add(AUTH_PACKAGES[dep]);
  }

  // 2. Detect from import/require statements in source files
  const importRegex = /(?:import\s+.*?from\s+|require\s*\(\s*)['"`]([\w@/-]+)['"`]/g;
  for (const file of allFiles) {
    const content = safeRead(file);
    if (!content) continue;
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const pkg = m[1].replace(/^@[^/]+\/[^/]+/, s => s); // keep scoped pkg names
      if (AUTH_PACKAGES[pkg]) strategies.add(AUTH_PACKAGES[pkg]);
    }
  }

  // 3. Scan routes and annotate with protected/public
  const routeAuthInfo = [];
  for (const file of allFiles) {
    const content = safeRead(file);
    if (!content) continue;

    // Find route definitions with their surrounding context (~300 chars)
    const routeRegex = /(app|router|fastify)\.(get|post|put|patch|delete)\s*\(\s*['"`](.*?)['"`]([\s\S]{0,400}?)\)/gi;
    let m;
    while ((m = routeRegex.exec(content)) !== null) {
      const routePath  = m[3];
      const context    = m[4];
      const isPublic   = PUBLIC_PATTERNS.some(p => p.test(routePath));
      const isProtected = !isPublic && PROTECTED_PATTERNS.some(p => p.test(context));
      routeAuthInfo.push({
        method:      m[2].toUpperCase(),
        path:        routePath,
        protected:   isProtected,
        public:      isPublic,
      });
    }
  }

  // 4. Check for .env.example or common auth env vars
  const authEnvVars = [];
  const authEnvPatterns = [
    /JWT_SECRET|JWT_PRIVATE_KEY|JWT_PUBLIC_KEY/,
    /SESSION_SECRET|COOKIE_SECRET/,
    /NEXTAUTH_SECRET|NEXTAUTH_URL/,
    /GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET/,
    /GITHUB_CLIENT_ID|GITHUB_CLIENT_SECRET/,
    /FACEBOOK_APP_ID|FACEBOOK_APP_SECRET/,
    /AUTH0_DOMAIN|AUTH0_CLIENT_ID|AUTH0_CLIENT_SECRET/,
    /CLERK_SECRET_KEY|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/,
    /SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY/,
    /FIREBASE_API_KEY|FIREBASE_PROJECT_ID/,
  ];
  for (const file of allFiles) {
    const content = safeRead(file);
    if (!content) continue;
    for (const pattern of authEnvPatterns) {
      const found = content.match(new RegExp(pattern.source, "g"));
      if (found) found.forEach(v => authEnvVars.push(v.split("=")[0].trim()));
    }
  }

  return {
    strategies:   [...strategies],
    routeAuthInfo,
    authEnvVars:  [...new Set(authEnvVars)],
  };
}

// ─── Docker / deployment info ─────────────────────────────────────────────────
function getDockerInfo(root) {
  const info = {
    hasDockerfile:       false,
    hasDockerCompose:    false,
    hasDockerIgnore:     false,
    services:            [],
    ports:               [],
    exposedPorts:        [],
    volumes:             [],
    envFiles:            [],
    buildArgs:           [],
    stages:              [],   // multi-stage build stage names
    composeVersion:      null,
    dockerfileCommands:  [],   // RUN, CMD, ENTRYPOINT summary
  };

  // ── Dockerfile ──────────────────────────────────────────────────────────────
  const dockerfilePath = path.join(root, "Dockerfile");
  if (fs.existsSync(dockerfilePath)) {
    info.hasDockerfile = true;
    const content = safeRead(dockerfilePath);

    // Multi-stage: FROM ... AS <stage>
    const stageRegex = /^FROM\s+\S+\s+AS\s+(\S+)/gim;
    let m;
    while ((m = stageRegex.exec(content)) !== null) info.stages.push(m[1]);

    // EXPOSE ports
    const exposeRegex = /^EXPOSE\s+([\d\s]+)/gim;
    while ((m = exposeRegex.exec(content)) !== null) {
      m[1].trim().split(/\s+/).forEach(p => info.exposedPorts.push(p));
    }

    // ARG (build args)
    const argRegex = /^ARG\s+(\w+)/gim;
    while ((m = argRegex.exec(content)) !== null) info.buildArgs.push(m[1]);

    // CMD / ENTRYPOINT
    const cmdRegex = /^(CMD|ENTRYPOINT)\s+(.+)/gim;
    while ((m = cmdRegex.exec(content)) !== null) {
      info.dockerfileCommands.push({ instruction: m[1], value: m[2].trim() });
    }
  }

  // ── .dockerignore ───────────────────────────────────────────────────────────
  if (fs.existsSync(path.join(root, ".dockerignore"))) {
    info.hasDockerIgnore = true;
  }

  // ── docker-compose.yml / yaml ───────────────────────────────────────────────
  const composePaths = [
    "docker-compose.yml", "docker-compose.yaml",
    "docker-compose.prod.yml", "docker-compose.production.yml",
    "docker-compose.dev.yml", "docker-compose.override.yml",
  ].map(f => path.join(root, f)).filter(fs.existsSync);

  if (composePaths.length) {
    info.hasDockerCompose = true;

    for (const composePath of composePaths) {
      const raw = safeRead(composePath);

      // version
      const verMatch = raw.match(/^version:\s*['"]?([\d.]+)['"]?/m);
      if (verMatch && !info.composeVersion) info.composeVersion = verMatch[1];

      // services
      const svcBlock = raw.match(/^services:\s*\n([\s\S]*?)(?=^\w|\Z)/m);
      if (svcBlock) {
        const svcNames = [...svcBlock[1].matchAll(/^  (\w[\w-]*):/gm)].map(x => x[1]);
        info.services.push(...svcNames);
      }

      // ports  "host:container"
      const portRegex = /['"]?(\d+):(\d+)['"]?/g;
      let m;
      while ((m = portRegex.exec(raw)) !== null) {
        info.ports.push({ host: m[1], container: m[2] });
      }

      // volumes (named volumes only — lines starting with 4 spaces under volumes:)
      const volBlock = raw.match(/^volumes:\s*\n([\s\S]*?)(?=^\w|\Z)/m);
      if (volBlock) {
        const volNames = [...volBlock[1].matchAll(/^  (\w[\w-]*):/gm)].map(x => x[1]);
        info.volumes.push(...volNames);
      }

      // env_file references
      const envFileRegex = /env_file:\s*\n\s+-\s+(.+)/g;
      while ((m = envFileRegex.exec(raw)) !== null) info.envFiles.push(m[1].trim());
    }

    // Deduplicate
    info.services = [...new Set(info.services)];
    info.ports    = [...new Map(info.ports.map(p => [`${p.host}:${p.container}`, p])).values()];
    info.volumes  = [...new Set(info.volumes)];
    info.envFiles = [...new Set(info.envFiles)];
  }

  return info;
}

// ─── File classifier ──────────────────────────────────────────────────────────
function classifyFile(filePath) {
  const lower = filePath.toLowerCase().replace(/\\/g, "/");
  if (lower.match(/\/(routes?|api)\//)) return "routes";
  if (lower.match(/\/controllers?\//)) return "controllers";
  if (lower.match(/\/models?\//)) return "models";
  if (lower.match(/\/middleware\//)) return "middleware";
  if (lower.endsWith(".prisma")) return "models";
  if (lower.includes("route")) return "routes";
  if (lower.includes("controller")) return "controllers";
  if (lower.includes("model")) return "models";
  return "other";
}

// ─── package.json ─────────────────────────────────────────────────────────────
function getPackageInfo(root) {
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) return { name: null, version: null, dependencies: [], scripts: {} };
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return {
      name:         pkg.name || null,
      version:      pkg.version || null,
      description:  pkg.description || null,
      dependencies: Object.keys(pkg.dependencies || {}),
      devDependencies: Object.keys(pkg.devDependencies || {}),
      scripts:      pkg.scripts || {},
    };
  } catch {
    return { name: null, version: null, dependencies: [], scripts: {} };
  }
}

// ─── README renderer ──────────────────────────────────────────────────────────
function generateMarkdown(data, controllerDescriptions = {}) {
  const { name, version, description, routes, controllers, models, dependencies,
          devDependencies, scripts, envVars, middleware, tree, auth, docker } = data;

  const lines = [];

  lines.push(`# ${name || "Project"}`);
  if (description) lines.push(`\n> ${description}`);
  lines.push(`\n## Version\n\n${version || "1.0.0"}`);

  // Scripts
  const scriptEntries = Object.entries(scripts || {});
  if (scriptEntries.length) {
    lines.push(`\n## Scripts\n`);
    lines.push("| Command | Description |");
    lines.push("|---------|-------------|");
    for (const [cmd, val] of scriptEntries) {
      lines.push(`| \`npm run ${cmd}\` | \`${val}\` |`);
    }
  }

  // ── Authentication ──────────────────────────────────────────────────────────
  if (auth.strategies.length || auth.routeAuthInfo.length) {
    lines.push(`\n## Authentication\n`);

    if (auth.strategies.length) {
      lines.push(`**Strategies detected:**\n`);
      for (const s of auth.strategies) lines.push(`- ${s}`);
    }

    // Route protection table
    const annotated = auth.routeAuthInfo.filter(r => r.protected || r.public);
    if (annotated.length) {
      lines.push(`\n**Route protection:**\n`);
      lines.push("| Method | Path | Access |");
      lines.push("|--------|------|--------|");
      for (const r of annotated) {
        const badge = r.public ? "🔓 Public" : "🔒 Protected";
        lines.push(`| \`${r.method}\` | \`${r.path}\` | ${badge} |`);
      }
    }

    if (auth.authEnvVars.length) {
      lines.push(`\n**Required auth environment variables:**\n`);
      lines.push("```env");
      for (const v of auth.authEnvVars) lines.push(`${v}=`);
      lines.push("```");
    }
  }

  // ── Docker / Deployment ─────────────────────────────────────────────────────
  if (docker.hasDockerfile || docker.hasDockerCompose) {
    lines.push(`\n## Docker & Deployment\n`);

    if (docker.hasDockerfile) {
      lines.push(`### Dockerfile\n`);

      if (docker.stages.length) {
        lines.push(`**Multi-stage build** — stages: ${docker.stages.map(s => `\`${s}\``).join(", ")}\n`);
      }

      if (docker.exposedPorts.length) {
        lines.push(`**Exposed ports:** ${docker.exposedPorts.map(p => `\`${p}\``).join(", ")}\n`);
      }

      if (docker.buildArgs.length) {
        lines.push(`**Build args:** ${docker.buildArgs.map(a => `\`${a}\``).join(", ")}\n`);
      }

      if (docker.dockerfileCommands.length) {
        lines.push("**Entry commands:**\n");
        for (const cmd of docker.dockerfileCommands) {
          lines.push(`- \`${cmd.instruction}\`: \`${cmd.value}\``);
        }
      }

      lines.push("\n```bash");
      lines.push(`# Build`);
      lines.push(`docker build -t ${name || "app"} .`);
      if (docker.exposedPorts.length) {
        const port = docker.exposedPorts[0];
        lines.push(`\n# Run`);
        lines.push(`docker run -p ${port}:${port} ${name || "app"}`);
      }
      lines.push("```");
    }

    if (docker.hasDockerCompose) {
      lines.push(`\n### Docker Compose\n`);

      if (docker.composeVersion) {
        lines.push(`**Compose version:** ${docker.composeVersion}\n`);
      }

      if (docker.services.length) {
        lines.push(`**Services:** ${docker.services.map(s => `\`${s}\``).join(", ")}\n`);
      }

      if (docker.ports.length) {
        lines.push("**Port mappings:**\n");
        lines.push("| Host | Container |");
        lines.push("|------|-----------|");
        for (const p of docker.ports) lines.push(`| \`${p.host}\` | \`${p.container}\` |`);
      }

      if (docker.volumes.length) {
        lines.push(`\n**Named volumes:** ${docker.volumes.map(v => `\`${v}\``).join(", ")}\n`);
      }

      if (docker.envFiles.length) {
        lines.push(`**Env files referenced:** ${docker.envFiles.map(f => `\`${f}\``).join(", ")}\n`);
      }

      lines.push("\n```bash");
      lines.push("# Start all services");
      lines.push("docker compose up -d");
      lines.push("\n# View logs");
      lines.push("docker compose logs -f");
      lines.push("\n# Stop");
      lines.push("docker compose down");
      lines.push("```");

      if (docker.hasDockerIgnore) {
        lines.push(`\n> ℹ️ \`.dockerignore\` is present.`);
      }
    }
  }

  // Routes
  lines.push(`\n## API Routes\n`);
  if (routes.length) {
    const grouped = {};
    for (const r of routes) {
      const base = r.path.split("/").slice(0, 3).join("/") || "/";
      (grouped[base] = grouped[base] || []).push(r);
    }
    for (const [, group] of Object.entries(grouped)) {
      for (const r of group) {
        // Find auth annotation if available
        const ann = auth.routeAuthInfo.find(a => a.method === r.method && a.path === r.path);
        const badge = ann?.protected ? " 🔒" : ann?.public ? " 🔓" : "";
        lines.push(`- \`${r.method.padEnd(6)}\` \`${r.path}\`${badge}`);
      }
    }
  } else {
    lines.push("No routes found.");
  }

  // Middleware
  if (middleware.length) {
    lines.push(`\n## Middleware\n`);
    for (const mw of middleware) {
      lines.push(`- \`${mw.name}\` → \`${mw.path}\``);
    }
  }

  // Controllers
  lines.push(`\n## Controllers\n`);
  if (controllers.length) {
    for (const c of controllers) {
      const desc = controllerDescriptions[c];
      if (desc) {
        lines.push(`- **\`${c}\`** — ${desc}`);
      } else {
        lines.push(`- \`${c}\``);
      }
    }
  } else {
    lines.push("No controllers found.");
  }

  // Models
  lines.push(`\n## Models / Schemas\n`);
  if (models.length) {
    for (const [i, m] of models.entries()) {
      const label = m.name ? `${m.type} — ${m.name}` : `${m.type} model ${i + 1}`;
      lines.push(`### ${label}\n\`\`\`js\n${m.definition}\n\`\`\``);
    }
  } else {
    lines.push("No models found.");
  }

  // Environment variables
  lines.push(`\n## Environment Variables\n`);
  if (envVars.length) {
    lines.push("Create a `.env` file with the following variables:\n");
    lines.push("```env");
    for (const v of envVars) lines.push(`${v}=`);
    lines.push("```");
  } else {
    lines.push("No `process.env` references found.");
  }

  // Dependencies
  lines.push(`\n## Dependencies\n`);
  if (dependencies.length) {
    lines.push(dependencies.map(d => `- \`${d}\``).join("\n"));
  } else {
    lines.push("None.");
  }
  if (devDependencies?.length) {
    lines.push(`\n### Dev Dependencies\n`);
    lines.push(devDependencies.map(d => `- \`${d}\``).join("\n"));
  }

  // File tree
  if (tree) {
    lines.push(`\n## Project Structure\n\n\`\`\`\n${tree}\n\`\`\``);
  }

  lines.push(`\n---\n_Generated by grepme-x `);
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const apiKeyFromCli = typeof args.ai === "string" ? args.ai.trim() : "";
  const aiEnabled = apiKeyFromCli.length > 0;
  const projectPath = process.cwd();
  const allFiles = getFiles(projectPath);

  const routes      = [];
  const controllers = [];
  const models      = [];
  const middleware  = [];
  const envVarsSet  = new Set();
  const controllerCodeMap = new Map();

  for (const file of allFiles) {
    const isSource = isSourceCodeFile(file);
    const isPrisma = file.endsWith(".prisma");
    if (!isSource && !isPrisma) continue;

    const content = safeRead(file);
    if (!content) continue;

    const type = classifyFile(file);

    if ((type === "routes" || type === "other") && isSource) {
      routes.push(...extractRoutes(content, file));
      middleware.push(...extractMiddleware(content));
    }
    if ((type === "controllers" || type === "other") && isSource) {
      controllers.push(...extractFunctions(content));
      const details = extractFunctionDetails(content);
      for (const detail of details) {
        if (!controllerCodeMap.has(detail.name)) {
          controllerCodeMap.set(detail.name, {
            code: detail.code,
            file,
          });
        }
      }
    }
    if (type === "models" || isPrisma) {
      models.push(...extractSchemas(content, file));
    }
    for (const v of extractEnvVars(content)) envVarsSet.add(v);
  }

  // Deduplicate controllers
  const uniqueControllers = [...new Set(controllers)];

  const pkgInfo = getPackageInfo(projectPath);
  const tree    = buildTree(projectPath);
  const envVars = [...envVarsSet].sort();
  const auth    = detectAuth(allFiles, pkgInfo.dependencies || []);
  const docker  = getDockerInfo(projectPath);

  // ─── Generate controller descriptions with OpenRouter ──────────────────────
  let controllerDescriptions = {};
  const enableAI = aiEnabled;
  
  if (enableAI && uniqueControllers.length > 0) {
    console.log(" Generating  descriptions for controllers...");
    const client = new OpenRouterClient(apiKeyFromCli);
    const functionsToDescribe = uniqueControllers
      .filter((name) => controllerCodeMap.has(name))
      .map((name) => {
        const detail = controllerCodeMap.get(name);
        return {
          name,
          code: detail.code.slice(0, 1200),
          context: `This is a controller function from ${path.basename(detail.file)}`,
        };
      });
    
    if (functionsToDescribe.length > 0) {
      controllerDescriptions = await client.generateDescriptions(functionsToDescribe);
      console.log(` Generated descriptions for ${Object.keys(controllerDescriptions).length} controllers`);
    }
  }

  const data = {
    ...pkgInfo,
    routes,
    controllers: uniqueControllers,
    models,
    middleware: [...new Map(middleware.map(m => [`${m.name}:${m.path}`, m])).values()],
    envVars,
    tree,
    auth,
    docker,
  };

  const outputPath = path.join(projectPath, args.output);

  if (args.format === "json") {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`JSON output written to ${outputPath}`);
  } else {
    const readme = generateMarkdown(data, controllerDescriptions);
    fs.writeFileSync(outputPath, readme);
    console.log(`README generated → ${outputPath}`);
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
