import client from "prom-client";
import { Request, Response, NextFunction } from "express";

const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const activeConnections = new client.Gauge({
  name: "active_connections",
  help: "Number of active HTTP connections",
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);

/** Normalize route to avoid high cardinality (e.g. /api/users/123 -> /api/users/:id) */
function normalizeRoute(path: string): string {
  return path.replace(/\/[a-fA-F0-9]{24}\b/g, "/:id").replace(/\/\d+\b/g, "/:id");
}

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  activeConnections.inc();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route =
      req.route?.path && req.baseUrl
        ? `${req.baseUrl}${req.route.path}`
        : req.route?.path || req.path;
    const normalizedRoute = normalizeRoute(route);
    const statusCode = res.statusCode.toString();

    httpRequestDuration.labels(req.method, normalizedRoute, statusCode).observe(duration);
    httpRequestTotal.labels(req.method, normalizedRoute, statusCode).inc();
    activeConnections.dec();
  });

  next();
};

export const metricsEndpoint = async (_req: Request, res: Response): Promise<void> => {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
};

export { register };
