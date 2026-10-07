import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
// Restore original requested path if Vercel edge rewrite redirected to /api/index
app.use((req, _res, next) => {
  if (req.url === "/api/index" || req.url === "/index" || req.url?.startsWith("/api/index?")) {
    const original = (req.headers["x-matched-path"] as string) || req.originalUrl;
    if (original && original !== "/api/index" && original !== "/index") {
      req.url = original;
    }
  }
  next();
});

app.use("/api", router);
app.use("/", router);

export default app;
