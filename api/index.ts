import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";

// Vercel Serverless Function entry point for MentorBridge API
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as any, res as any);
}
