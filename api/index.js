import app from "../artifacts/api-server/dist/serverless.mjs";

// Vercel Serverless Function entry point for MentorBridge API
export default function handler(req, res) {
  return app(req, res);
}
