import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { createHash } from "crypto";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Images are now served via API route /api/assets/:filename in routes.ts

// Trust proxy for production (Plesk/Nginx) - Always trust first proxy
app.set('trust proxy', 1);

// Session configuration
const PgSession = ConnectPgSimple(session);
const isProduction = process.env.NODE_ENV === 'production';

console.log('[Session Config]', {
  NODE_ENV: process.env.NODE_ENV,
  isProduction,
  hasSessionSecret: !!process.env.SESSION_SECRET
});

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true
  }),
  name: 'moderno.sid',
  secret: process.env.SESSION_SECRET || 'U/jU2wbJ9Rm7t+W+m5/N47ihf+DIkzzKXFv5z0/2Xsn5WrltM9NTAps9xnWJBWHYEeqDhph/xait8kLvWDed7g==',
  resave: true,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false, // Temporarily disable for testing
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax',
    path: '/'
  },
  proxy: true
}));

// Hash password helper
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Passport configuration
passport.use(new LocalStrategy(
  async (username: string, password: string, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      // Compare hashed password
      if (hashPassword(password) !== user.password) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      // Return user without password
      const { password: _, ...safeUser } = user;
      return done(null, safeUser);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    // Return user without password
    const { password: _, ...safeUser } = user;
    done(null, safeUser);
  } catch (error) {
    done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
