import { logger } from "./logger";

export interface AiMatchRecommendation {
  mentorId: string;
  mentorName: string;
  matchReason: string;
  recommendedTopic: string;
  matchScore: number;
}

export interface AiMatchResult {
  recommendations: AiMatchRecommendation[];
  aiNote: string;
}

export interface AiSessionPrepResult {
  questions: string[];
  keyAdvice: string;
}

export interface AiRoadmapResult {
  milestones: Array<{
    title: string;
    description: string;
    estimatedWeeks: number;
  }>;
  suggestedSkills: string[];
}

/**
 * Backend-only Gemini AI call for intelligent mentor matching with JSON mode and secret protection.
 */
export async function generateMentorMatches(
  goal: string,
  field: string | undefined,
  mentorsList: Array<any>
): Promise<AiMatchResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are MentorBridge AI Career Advisor.
Given a mentee's goal and available mentors, recommend the top 3 best-fitting mentors.
Return strictly valid JSON conforming to the requested schema.

Mentee Goal: "${goal}"
Preferred Field: "${field || "Any"}"

Mentors:
${JSON.stringify(
  mentorsList.map((m) => ({
    id: m.id,
    name: m.name,
    title: m.title,
    company: m.company,
    category: m.category,
    skills: m.skills,
    bio: m.bio,
  })),
  null,
  2
)}

JSON Format:
{
  "recommendations": [
    {
      "mentorId": "m-01",
      "mentorName": "Full Name",
      "matchReason": "Why this mentor fits the mentee's specific goals",
      "recommendedTopic": "Actionable discussion topic for their 1-on-1",
      "matchScore": 96
    }
  ],
  "aiNote": "A supportive 1-sentence observation on their trajectory"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );

      if (res.ok) {
        const json = (await res.json()) as any;
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed.recommendations)) {
            return parsed;
          }
        }
      } else {
        logger.warn({ status: res.status }, "Gemini API non-200 response, using structured fallback");
      }
    } catch (err) {
      logger.error({ err }, "Error invoking Gemini API, using structured fallback");
    }
  }

  // High quality heuristic fallback in identical JSON schema
  const query = (goal + " " + (field || "")).toLowerCase();
  const scored = mentorsList
    .map((m) => {
      let score = m.match || 88;
      const skillsMatch = m.skills.filter((s: string) => query.includes(s.toLowerCase())).length;
      if (skillsMatch > 0) score = Math.min(99, score + skillsMatch * 3);
      if (field && m.category.toLowerCase().includes(field.toLowerCase())) score = Math.min(99, score + 5);
      return {
        mentorId: m.id,
        mentorName: m.name,
        matchReason: `Tailored match for "${m.skills.slice(0, 2).join(" & ")}". As a ${m.title} at ${m.company}, ${m.name} has guided students through similar career transitions.`,
        recommendedTopic: `Strategic guidance on ${m.skills[0] || "industry growth"} and interview narratives`,
        matchScore: score,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  return {
    recommendations: scored,
    aiNote: "AI Advisor recommendation based on your unique goals and our mentors' real-world craft.",
  };
}

/**
 * Backend-only Gemini AI call for preparing high-value session questions.
 */
export async function generateSessionPrep(
  mentor: any,
  sessionType: string
): Promise<AiSessionPrepResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are MentorBridge AI Prep Coach.
Given a mentor's profile and session topic, provide 3 high-leverage discussion questions and 1 actionable piece of advice for the student.
Return strictly valid JSON conforming to the schema.

Mentor: ${mentor.name}, ${mentor.title} at ${mentor.company}
Session Type: "${sessionType}"
Mentor Skills: ${mentor.skills.join(", ")}

JSON Format:
{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ],
  "keyAdvice": "One concise tip to maximize value from the conversation"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.3,
            },
          }),
        }
      );

      if (res.ok) {
        const json = (await res.json()) as any;
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed.questions)) {
            return parsed;
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "Error invoking Gemini for session prep");
    }
  }

  return {
    questions: [
      `What were the most important milestones you hit when transitioning into ${mentor.category}?`,
      `If you were in my shoes evaluating my portfolio/resume, what is the single biggest gap you'd advise addressing first?`,
      `How do top performers at companies like ${mentor.company} stand out during team technical reviews?`,
    ],
    keyAdvice: `Come prepared with a concrete example or challenge you faced recently. Mentors give the sharpest feedback when reacting to tangible work.`,
  };
}

/**
 * Backend-only Gemini AI call for milestone roadmap generation.
 */
export async function generateGoalRoadmap(
  currentGoal: string
): Promise<AiRoadmapResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are MentorBridge AI Career Roadmap Generator.
Break down the student's goal into 3 practical progressive milestones and key skill priorities.
Return strictly valid JSON.

Goal: "${currentGoal}"

JSON Format:
{
  "milestones": [
    {
      "title": "Milestone title",
      "description": "Concrete action and deliverable",
      "estimatedWeeks": 2
    }
  ],
  "suggestedSkills": ["Skill 1", "Skill 2", "Skill 3"]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.3,
            },
          }),
        }
      );

      if (res.ok) {
        const json = (await res.json()) as any;
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed.milestones)) {
            return parsed;
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "Error invoking Gemini for goal roadmap");
    }
  }

  return {
    milestones: [
      {
        title: "Foundation & Narrative Audit",
        description: "Review current resume, portfolio case studies, and code repos with a senior mentor.",
        estimatedWeeks: 2,
      },
      {
        title: "Mock Interview & System Thinking",
        description: "Practice one end-to-end technical simulation and refine trade-off explanations.",
        estimatedWeeks: 3,
      },
      {
        title: "Production-Grade Capstone Project",
        description: "Ship a full-stack feature with end-to-end tests, telemetry, and CI/CD automation.",
        estimatedWeeks: 4,
      },
    ],
    suggestedSkills: ["System Design", "TypeScript / React", "Production Debugging", "Architecture Storytelling"],
  };
}
