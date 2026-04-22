# grepme-x CLI (branch: `main`)

`grepme-x` is a Node.js CLI that scans a project and generates documentation from real code patterns (routes, middleware, env vars, schemas, dependencies, and project structure).

## Install

```bash
npm install
```

## Run

```bash
node index.js
```

By default it writes `grepme-X.md` in the current project directory.

## CLI usage

```bash
grepme-x [options]
```

If you are developing locally without global install, use:

```bash
node index.js [options]
```

## Options

| Flag | Short | Default | Description |
|---|---|---|---|
| `--output` | `-o` | `grepme-X.md` | Output file name |
| `--ignore` | `-i` | `""` | Comma-separated extra directories to ignore |
| `--format` | `-f` | `markdown` | Output format: `markdown` or `json` |
| `--ai <OPENROUTER_API_KEY>` | `-a` (`-ai` also accepted) | — | Enable AI descriptions for controllers via OpenRouter |
| `--help` | `-h` | — | Show help |

## Examples

```bash
# Default markdown output
node index.js

# Custom output file
node index.js --output README.generated.md

# Ignore extra directories
node index.js --ignore tmp,fixtures,scripts

# JSON output
node index.js --format json --output grepme-x.json

# Enable AI controller descriptions
node index.js --ai YOUR_OPENROUTER_API_KEY
```

## Environment variables

Optional:

```env
OPENROUTER_MODEL=gpt-3.5-turbo
```

## What grepme-x extracts

- API routes (Express, Fastify, Next.js App Router, Next.js Pages API)
- Middleware usage
- Controller/function names
- Model/schema patterns (Mongoose, Sequelize, Prisma)
- `process.env.*` variables
- Auth hints and protected/public route signals
- Docker/Docker Compose metadata
- Scripts and dependencies from `package.json`
- File tree snapshot

## Branch note

This README is for the **CLI tool in `main` branch**.  
For website docs, see `README.md` in the `grepme-x-website` branch.
