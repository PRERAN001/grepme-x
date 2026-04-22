import { useEffect, useMemo, useState } from 'react'

import { AnnouncementBanner } from './components/announcement-banner'
import { buttonVariants } from './components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { cn } from './lib/utils'

function SectionIntro({ label, title, description }) {
  return (
    <div className='mb-10 max-w-3xl'>
      <p className='mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent/80'>
        {label}
      </p>
      <h2 className='text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl'>
        {title}
      </h2>
      {description ? (
        <p className='mt-4 text-base leading-7 text-muted'>{description}</p>
      ) : null}
    </div>
  )
}

function App() {
  const terminalLines = useMemo(
    () => [
      '$ node install grepme-x',
      '$ grepme-x',
      'Scanning files...',
      '12 routes found',
      '3 protected routes detected',
      'README generated -> grepme-X.md',
    ],
    [],
  )

  const [visibleLines, setVisibleLines] = useState(0)
  const [mode, setMode] = useState('default')

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((current) => {
        if (current >= terminalLines.length) {
          clearInterval(interval)
          return current
        }

        return current + 1
      })
    }, 600)

    return () => clearInterval(interval)
  }, [terminalLines])

  const featureCards = [
    {
      title: 'Blazing Fast',
      description: 'Regex parsing, no API calls, runs in milliseconds.',
    },
    {
      title: 'Hallucination-Free',
      description:
        'Extracts exact routes, schemas, and env vars directly from source code.',
    },
    {
      title: 'AI Mode',
      description:
        'Add --ai to get Copilot-style prose powered by Claude, grounded in confirmed facts.',
    },
  ]

  const extracts = [
    ['API Routes', 'Express, Fastify, Next.js App Router, Pages Router'],
    ['Auth Detection', 'Passport, JWT, NextAuth, Clerk, Supabase, Firebase and 15 more'],
    ['Docker Info', 'Services, ports, volumes, and generated run commands'],
    ['DB Schemas', 'Mongoose, Sequelize, Prisma'],
    ['Env Variables', 'All process.env references output as a ready-to-fill .env template'],
    ['File Tree', 'Visual project structure up to 3 levels deep'],
  ]

  const flags = [
    ['--output', '-o', 'README.md', 'Output file name'],
    ['--ignore', '-i', '""', 'Comma-separated dirs to ignore'],
    ['--format', '-f', 'markdown', 'Output format: markdown or json'],
    ['--ai', '-a', 'false', 'Claude-powered prose README'],
    ['--key', '-k', '""', 'Anthropic API key'],
    ['--model', '-m', 'claude-opus-4-6', 'Claude model to use'],
  ]

  const installs = [
    {
      title: 'Node.js version',
      badge: 'npm',
      install: 'npm install grepme-x',
      run: 'grepme-x',
      result: 'grepme-X README generated',
    },
    {
      title: 'Python version',
      badge: 'pip',
      install: 'pip install grepme-x',
      run: 'grepme-x',
      result: 'grepme-X README generated',
    },
  ]

  return (
    <div className='relative mx-auto w-full max-w-[88rem] px-6 pb-24 md:px-12 lg:px-20'>
      <div className='pointer-events-none absolute inset-y-0 left-6 hidden w-px bg-border/80 md:block md:left-10 lg:left-16' />
      <div className='pointer-events-none absolute inset-y-0 right-6 hidden w-px bg-border/80 md:block md:right-10 lg:right-16' />

      <AnnouncementBanner
        title='Product update'
        description='grepme-x now ships with both Node.js and Python versions, plus updated CLI help and install flows.'
        actionLabel='Read more'
        actionHref='#cli-flags'
        storageKey='grepme-x-announcement-dismissed'
      />

      <header className='sticky top-0 z-20 mb-8 border-b border-border/80 bg-background/90 py-4 backdrop-blur'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <span className='font-mono text-lg font-semibold tracking-tight text-foreground'>
              grepme-x
            </span>
            <span className='rounded-full border border-border bg-[#101010] px-2.5 py-0.5 font-mono text-[11px] text-muted'>
              v1.0.0
            </span>
          </div>

          <nav className='hidden items-center gap-6 text-sm text-muted md:flex'>
            <a className='transition-colors hover:text-foreground' href='#features'>Features</a>
            <a className='transition-colors hover:text-foreground' href='#modes'>Modes</a>
            <a className='transition-colors hover:text-foreground' href='#cli-flags'>CLI Flags</a>
          </nav>
        </div>
      </header>

      <section className='relative py-12 md:py-20'>
        <div className='pointer-events-none absolute left-0 top-6 -z-10 h-80 w-80 rounded-full [background:radial-gradient(circle,rgba(34,197,94,0.17),rgba(10,10,10,0)_70%)]' />

        <div className='grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12'>
          <div>
            <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent'>
              Available for both Node.js and Python
            </div>
            <div className='mb-8 flex items-center gap-3'>
              <h1 className='font-mono text-5xl font-semibold tracking-tight text-foreground md:text-6xl'>
                grepme-x
              </h1>
              <span className='rounded-full border border-border bg-[#101010] px-3 py-1 font-mono text-xs text-muted'>
                v1.0.0
              </span>
            </div>

            <p className='max-w-2xl text-3xl font-medium tracking-tight text-foreground md:text-[2.2rem] md:leading-tight'>
              Your codebase, documented in milliseconds.
            </p>
            <p className='mt-5 max-w-2xl text-base leading-7 text-muted'>
              Regex-powered README generation for Node.js projects. No LLM. No
              internet. No hallucinations.
            </p>

            <div className='mt-9 flex flex-wrap gap-4'>
              <a
                href='#cli-flags'
                className={cn(buttonVariants({ variant: 'default' }), 'h-11 px-6 text-sm')}
              >
                Get Started
              </a>
              <a
                className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-6 text-sm')}
                href='https://github.com/PRERAN001/grepme-X'
                target='_blank'
                rel='noreferrer'
              >
                View on GitHub
              </a>
            </div>
          </div>

          <div className='rounded-2xl border border-border bg-[#0d0d0d] p-5 md:p-6'>
            <div className='mb-5 flex items-center justify-between border-b border-border/80 pb-3'>
              <div className='flex items-center gap-2'>
                <span className='h-2.5 w-2.5 rounded-full bg-[#3a3a3a]' />
                <span className='h-2.5 w-2.5 rounded-full bg-[#3a3a3a]' />
                <span className='h-2.5 w-2.5 rounded-full bg-[#3a3a3a]' />
              </div>
              <span className='font-mono text-xs text-muted'>terminal</span>
            </div>
            <div className='font-mono text-sm leading-7 text-[#d4d4d8]'>
              {terminalLines.slice(0, visibleLines).map((line, index) => {
                const isLastVisible = index === visibleLines - 1

                return (
                  <div key={line + index} className='whitespace-pre-wrap'>
                    {line}
                    {isLastVisible ? (
                      <span className='ml-0.5 inline-block h-[1em] w-2 translate-y-[2px] animate-pulse bg-accent' />
                    ) : null}
                  </div>
                )
              })}
              {visibleLines === 0 ? (
                <div>
                  <span className='inline-block h-[1em] w-2 animate-pulse bg-accent' />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className='border-t border-border py-16 md:py-20'>
        <SectionIntro
          label='Install'
          title='Node.js and Python releases, side by side'
          description='Same README generator concept, with language-specific packaging and the same fast CLI experience.'
        />
        <div className='grid gap-5 lg:grid-cols-2'>
          {installs.map((item) => (
            <Card key={item.title} className='hover:border-accent/30'>
              <CardHeader>
                <div className='flex items-center justify-between gap-4'>
                  <CardTitle className='text-xl'>{item.title}</CardTitle>
                  <span className='rounded-full border border-border bg-[#101010] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted'>
                    {item.badge}
                  </span>
                </div>
                <div className='mt-4 space-y-3 font-mono text-sm text-[#d4d4d8]'>
                  <div className='rounded-md border border-border bg-[#0b0b0b] p-4'>
                    <p className='mb-2 text-xs uppercase tracking-[0.12em] text-muted'>
                      Install
                    </p>
                    <p>{item.install}</p>
                  </div>
                  <div className='rounded-md border border-border bg-[#0b0b0b] p-4'>
                    <p className='mb-2 text-xs uppercase tracking-[0.12em] text-muted'>
                      Run
                    </p>
                    <p>{item.run}</p>
                  </div>
                  <div className='rounded-md border border-accent/20 bg-accent/8 p-4 text-accent'>
                    {item.result}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id='features' className='border-t border-border py-16 md:py-20'>
        <SectionIntro
          label='Features'
          title='Fast facts extraction, reliable by design'
          description='Built for deterministic output first, with optional AI prose only when you explicitly ask for it.'
        />
        <div className='grid gap-5 md:grid-cols-3'>
          {featureCards.map((item) => (
            <Card key={item.title} className='group hover:border-accent/40 hover:bg-[#121212]'>
              <CardHeader>
                <CardTitle className='transition-colors group-hover:text-accent'>
                  {item.title}
                </CardTitle>
                <CardDescription className='text-sm leading-6'>
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className='border-t border-border py-16 md:py-20'>
        <SectionIntro
          label='Workflow'
          title='Three steps from source code to README'
        />
        <div className='grid gap-4 md:grid-cols-3'>
          <Card className='hover:border-accent/30'>
            <CardHeader>
              <CardTitle className='font-mono text-2xl tracking-tight'>
                1. Drop it in
              </CardTitle>
              <CardDescription>
                copy grepme-x.mjs into any Node.js project
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className='hover:border-accent/30'>
            <CardHeader>
              <CardTitle className='font-mono text-2xl tracking-tight'>2. Run it</CardTitle>
              <CardDescription>node grepme-x.mjs</CardDescription>
            </CardHeader>
          </Card>
          <Card className='hover:border-accent/30'>
            <CardHeader>
              <CardTitle className='font-mono text-2xl tracking-tight'>3. Done</CardTitle>
              <CardDescription>
                README.md generated with routes, auth, Docker, schemas, and env
                vars
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id='modes' className='border-t border-border py-16 md:py-20'>
        <SectionIntro
          label='Output Modes'
          title='Default structure or narrative-style AI prose'
          description='Switch instantly between deterministic markdown and Claude-assisted documentation flow.'
        />

        <Tabs defaultValue='default' value={mode} onValueChange={setMode}>
          <TabsList className='w-full justify-start md:w-auto'>
            <TabsTrigger value='default'>Default Mode</TabsTrigger>
            <TabsTrigger value='ai'>AI Mode</TabsTrigger>
          </TabsList>

          <div key={mode} className='animate-fadeIn'>
            <TabsContent value='default'>
              <div className='grid gap-5 md:grid-cols-2'>
                <Card className='font-mono text-sm text-[#d4d4d8]'>
                  <p className='mb-3 text-xs uppercase tracking-[0.12em] text-muted'>
                    Terminal Command
                  </p>
                  <pre className='overflow-x-auto whitespace-pre-wrap rounded-md bg-[#0b0b0b] p-4 leading-7'>
                    node grepme-x.mjs
                  </pre>
                </Card>
                <Card>
                  <p className='mb-3 text-xs uppercase tracking-[0.12em] text-muted'>
                    README Preview
                  </p>
                  <pre className='overflow-x-auto whitespace-pre-wrap rounded-md bg-[#0b0b0b] p-4 font-mono text-sm leading-7 text-[#d4d4d8]'>
                    {`## Routes\n| Method | Path | Auth |\n|---|---|---|\n| GET | /api/users | required |\n\n## Env\nDATABASE_URL=\nJWT_SECRET=\n\n## Schema\nUser { id, email, role }`}
                  </pre>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='ai'>
              <div className='grid gap-5 md:grid-cols-2'>
                <Card className='font-mono text-sm text-[#d4d4d8]'>
                  <p className='mb-3 text-xs uppercase tracking-[0.12em] text-muted'>
                    Terminal Command
                  </p>
                  <pre className='overflow-x-auto whitespace-pre-wrap rounded-md bg-[#0b0b0b] p-4 leading-7'>
                    node grepme-x.mjs --ai --key sk-ant-...
                  </pre>
                </Card>
                <Card>
                  <p className='mb-3 text-xs uppercase tracking-[0.12em] text-muted'>
                    README Preview
                  </p>
                  <div className='space-y-4 rounded-md bg-[#0b0b0b] p-4 text-sm leading-7 text-[#d4d4d8]'>
                    <p>
                      This service exposes a compact API surface focused on
                      account management and project lifecycle operations.
                    </p>
                    <p>
                      Authentication is enforced on protected endpoints, and
                      environment requirements are listed with deployment-ready
                      defaults.
                    </p>
                    <p>
                      Docker configuration includes service definitions, port
                      bindings, and recommended local run commands.
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </section>

      <section className='border-t border-border py-16 md:py-20'>
        <SectionIntro
          label='Coverage'
          title='What grepme-x extracts from your project'
        />
        <div className='grid gap-4 md:grid-cols-2'>
          {extracts.map(([title, detail]) => (
            <Card key={title} className='hover:border-accent/30'>
              <CardHeader>
                <CardTitle className='text-lg'>{title}</CardTitle>
                <CardDescription className='leading-6'>{detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id='cli-flags' className='border-t border-border py-16 md:py-20'>
        <SectionIntro
          label='Reference'
          title='CLI Flags'
          description='Node.js and Python share the same core concepts, with a few interface differences shown below.'
        />
        <div className='font-mono'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead>Short</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map(([flag, short, defaultValue, description]) => (
                <TableRow key={flag}>
                  <TableCell className='text-foreground'>{flag}</TableCell>
                  <TableCell>{short}</TableCell>
                  <TableCell>{defaultValue}</TableCell>
                  <TableCell>{description}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className='text-foreground'>grepme-x</TableCell>
                <TableCell>Python / Node</TableCell>
                <TableCell>CLI entrypoint</TableCell>
                <TableCell>Run the generator from either package manager</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <footer className='border-t border-border py-20 text-center'>
        <div className='mx-auto max-w-2xl'>
          <div className='rounded-2xl border border-border bg-[#0d0d0d] p-6 font-mono text-lg text-foreground md:text-xl'>
            node install grepme-x
          </div>
          <div className='mt-4 rounded-2xl border border-border bg-[#0d0d0d] p-6 font-mono text-lg text-foreground md:text-xl'>
            grepme-x
          </div>
          <div className='mt-6 flex items-center justify-center gap-6 text-sm text-muted'>
            <a
              className='transition-colors hover:text-accent'
              href='https://github.com/grepme-x/grepme-x'
              target='_blank'
              rel='noreferrer'
            >
              GitHub
            </a>
            <a
              className='transition-colors hover:text-accent'
              href='https://opensource.org/license/mit'
              target='_blank'
              rel='noreferrer'
            >
              MIT License
            </a>
          </div>
          <p className='mt-6 text-sm text-muted'>
            Built for devs who write code, not docs.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
