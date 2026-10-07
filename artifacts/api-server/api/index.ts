import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../src/app";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as any)(req, res);
}
