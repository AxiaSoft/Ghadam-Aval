import fs from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

interface StoredSession {
  sessionId: string;
  [key: string]: unknown;
}

interface StoredResponsesFile {
  updatedAt: string | null;
  totalSessions: number;
  latestSession: StoredSession | null;
  sessions: StoredSession[];
}

const RESPONSES_FILE_PATH = path.resolve(process.cwd(), '.local/playerResponses.json');

function playerResponsesJsonPlugin(): Plugin {
  let writeQueue: Promise<void> = Promise.resolve();

  const readJsonFileSafe = async (): Promise<StoredResponsesFile> => {
    try {
      const raw = await fs.readFile(RESPONSES_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoredResponsesFile>;
      return {
        updatedAt: parsed.updatedAt ?? null,
        totalSessions: Array.isArray(parsed.sessions) ? parsed.sessions.length : 0,
        latestSession: parsed.latestSession ?? null,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      };
    } catch {
      return {
        updatedAt: null,
        totalSessions: 0,
        latestSession: null,
        sessions: [],
      };
    }
  };

  const attachMiddleware = (middlewares: {
    use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
  }) => {
    middlewares.use((req, res, next) => {
      const urlPath = req.url?.split('?')[0];
      if (urlPath !== '/api/player-responses') {
        next();
        return;
      }

      if (req.method === 'GET') {
        readJsonFileSafe()
          .then((data) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data, null, 2));
          })
          .catch((err) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          });
        return;
      }

      if (req.method === 'POST') {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        req.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf8');
          writeQueue = writeQueue
            .then(async () => {
              const incomingSession = JSON.parse(bodyText) as StoredSession;
              if (!incomingSession || typeof incomingSession.sessionId !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ ok: false, error: 'Invalid session payload' }));
                return;
              }

              const existing = await readJsonFileSafe();
              const idx = existing.sessions.findIndex(
                (s) => s.sessionId === incomingSession.sessionId
              );
              const nextSessions = [...existing.sessions];
              if (idx >= 0) {
                nextSessions[idx] = incomingSession;
              } else {
                nextSessions.push(incomingSession);
              }

              const now = new Date().toISOString();
              const updatedFile: StoredResponsesFile = {
                updatedAt: now,
                totalSessions: nextSessions.length,
                latestSession: incomingSession,
                sessions: nextSessions,
              };

              await fs.mkdir(path.dirname(RESPONSES_FILE_PATH), { recursive: true });
              await fs.writeFile(
                RESPONSES_FILE_PATH,
                JSON.stringify(updatedFile, null, 2) + '\n',
                'utf8'
              );

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ ok: true, file: '.local/playerResponses.json' }));
            })
            .catch((err) => {
              if (!res.writableEnded) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ ok: false, error: String(err) }));
              }
            });
        });
        return;
      }

      next();
    });
  };

  return {
    name: 'player-responses-json-writer',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(previewServer) {
      attachMiddleware(previewServer.middlewares);
    },
  };
}

export default defineConfig({
  plugins: [react(), playerResponsesJsonPlugin()],
  base: './',
  appType: 'mpa',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    cors: true,
    watch: {
      ignored: ['**/.local/**', '**/dist/**', '**/docs/**', '**/node_modules/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    open: false,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: 'app.html',
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          gsap: ['gsap'],
        },
      },
    },
  },
});
