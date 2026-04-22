# grepme-x

> A regex-powered CLI tool that statically analyzes your Node.js codebase and auto-generates a structured, accurate `README.md` — no LLM required. Add `--ai` for a Copilot-style prose README powered by Claude.

## Version

1.0.0

---

## What it does

Most README generators ask an AI to "guess" your project structure. **grepme-x** does the opposite — it parses your source files directly using regex patterns and extracts confirmed facts:

- Every API route (Express, Fastify, Next.js App Router, Pages Router)
- Controllers and exported functions
- Database schemas (Mongoose, Sequelize, Prisma)
- Authentication libraries and protected vs public routes
- Environment variables from `process.env` usage
- Docker configuration, services, ports, and volumes
- npm scripts and dependencies
- A visual file tree of your project

Run without flags for a fast, deterministic structured README. Add `--ai` and it feeds those confirmed facts to Claude, which writes natural Copilot-style prose around them — accurate because the AI never has to guess.

---

## Installation

```bash
# Run directly with Node (no install needed)
node install grepme-x

# Or add to your project scripts in package.json
"scripts": {
  "docs": "grepme-x"
}
```

**Requirements:** Node.js 18+ (uses `util.parseArgs` and native ESM)

---

## Usage

```bash
# Structured README (fast, offline, deterministic)
npm install grepme-x

# Copilot-style AI prose README
grepme-x --ai

# Pass API key inline (or set ANTHROPIC_API_KEY env var)
grepme-x --ai --key sk-ant-xxxxxxxxxxxx

# Custom output file
grepme-x --output DOCS.md

# Ignore extra directories
grepme-x --ignore tmp,scripts,fixtures

# Raw JSON output — pipe into other tools or your own LLM prompt
grepme-x --format json

# Choose a different Claude model
grepme-x. --ai --model claude-sonnet-4-6
```

### CLI Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--output` | `-o` | `README.md` | Output file name |
| `--ignore` | `-i` | `""` | Comma-separated extra dirs to ignore |
| `--format` | `-f` | `markdown` | Output format: `markdown` or `json` |
| `--ai` | `-a` | `false` | Generate Copilot-style prose README via Claude |
| `--key` | `-k` | `""` | Anthropic API key (or use `ANTHROPIC_API_KEY` env var) |
| `--model` | `-m` | `claude-opus-4-6` | Claude model to use |
| `--help` | `-h` | — | Show help |

---

## Two modes

### Default — structured README

Fast, offline, deterministic. Runs regex extraction and renders a markdown document with precise tables, route lists, schema blocks, and env var templates. Same output every run.

```bash
grepme-x
```

### `--ai` — Copilot-style prose README

Runs the same extraction first to get confirmed facts (routes, auth, Docker, env vars, dependencies), then sends those facts to Claude with a strict system prompt: *"use only what's listed, write like a senior engineer."* Claude writes natural prose sections — tagline, features, how it works, usage narrative — without hallucinating anything grepme-x did not find.

```bash
# With env var (recommended)

node grepme-x --ai  (openrouter apikey)

# Or inline
grepme-x --ai --key sk-ant-xxxxxxxxxxxx
```

The response streams live to your terminal and writes to the output file when complete. If the API call fails for any reason, it automatically falls back to the structured README.

---

## What gets extracted

### API Routes

| Framework | Pattern detected |
|-----------|-----------------|
| Express / Fastify | `app.get()`, `app.post()`, `router.put()`, etc. |
| Express chained | `.route('/path').get().post().delete()` |
| Next.js App Router | `export async function GET/POST/PUT/PATCH/DELETE` |
| Next.js Pages Router | `export default function handler` in `pages/api/**` |

Dynamic segments are normalized: `[id]` → `:id`, `[...slug]` → `:slug*`

### Authentication

Detects 20+ auth libraries by scanning both `package.json` and `import`/`require` statements — `passport`, `passport-jwt`, `jsonwebtoken`, `next-auth`, `firebase-admin`, `@supabase/supabase-js`, `clerk`, `auth0`, `bcrypt`, `argon2`, and more.

Routes are annotated as 🔒 **Protected** or 🔓 **Public** by scanning handler context for patterns like `passport.authenticate`, `jwt.verify`, `requireAuth`, `getServerSession`, etc.

### Docker

Reads `Dockerfile` and all compose variants (`.yml`, `.prod.yml`, `.dev.yml`, `.override.yml`) — extracts services, port mapping tables, named volumes, build args, stage names, and auto-generates copy-pasteable run commands.

### Schemas

- **Mongoose** — `new mongoose.Schema({...})`
- **Sequelize** — `sequelize.define('ModelName', {...})`
- **Prisma** — `model Name { ... }` from `.prisma` files

### Environment Variables

Scans all source files for `process.env.VARIABLE_NAME` and outputs a ready-to-fill `.env` template.

---

## What gets ignored by default

```
node_modules  .git  .next  dist  build  .cache  coverage
```

Plus all binary file types: images, fonts, archives, executables, audio/video, `.db`, `.lock`.

---

## How it compares

| | grepme-x (default) | grepme-x --ai | Copilot / AI-only |
|---|---|---|---|
| Requires internet | No | Yes | Yes |
| Cost | Free | ~$0.01–0.05/run | Paid subscription |
| Speed | Milliseconds | ~5–10 seconds | ~5–15 seconds |
| Route accuracy | Exact | Exact (regex first) | May hallucinate |
| Prose quality | Structured/factual | Human-quality | Human-quality |
| Reproducible | Deterministic | Varies slightly | Varies |
| CI/CD friendly | Yes | Yes | Rarely |

---

## Roadmap

- [ ] `--watch` mode — regenerate on file save during development
- [ ] `.grepme-x.json` config file — persist ignore lists and preferences
- [ ] Incremental updates — preserve hand-written sections using `<!-- grepme-x:start -->` delimiters
- [ ] Route prefix chaining — follow `app.use('/api', router)` to reconstruct full paths
- [ ] JSDoc extraction — pull `@param` / `@returns` to document controllers
- [ ] Test coverage summary — detect `__tests__` and report which routes have tests
- [ ] `--model ollama/llama3` — local LLM support for fully offline AI mode

---

## Contributing

1. Fork the repo
2. Make your changes to `grepme-x.mjs`
3. Test against a real Express or Next.js project
4. Open a PR with a brief description of what pattern you added or fixed

---

## License

MIT

---

_Generated with ❤️ by [grepme-x]
