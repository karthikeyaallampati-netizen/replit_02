import { Router, type IRouter } from "express";
import {
  CreateBookingBody,
  CreateBookingResponse,
  CreateReviewBody,
  CreateReviewResponse,
  GetBookingsQueryParams,
  GetBookingsResponse,
  GetDashboardQueryParams,
  GetDashboardResponse,
  GetMentorParams,
  GetMentorResponse,
  GetMentorsQueryParams,
  GetMentorsResponse,
  GetMessagesQueryParams,
  GetMessagesResponse,
  GetNotificationsResponse,
  GetProgressResponse,
  GetReviewsQueryParams,
  GetReviewsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  SendMessageBody,
  SendMessageResponse,
  type Booking,
  type Dashboard,
  type Mentor,
  type Message,
  type Notification,
  type Progress,
  type Review,
} from "@workspace/api-zod";
import { generateMentorMatches, generateSessionPrep, generateGoalRoadmap } from "../lib/gemini";

const router: IRouter = Router();

// This process-local store is intentionally demo-only. Production persistence and
// user ownership must be provided by Supabase before using real accounts.
const mentors: Mentor[] = [
  { id: "m-01", name: "Maya Chen", title: "Staff Software Engineer", company: "Northstar Systems", category: "Software Development", location: "San Francisco, CA", experienceYears: 9, rating: 4.98, reviewCount: 86, sessions: 214, price: 45, availability: "Today, 4:30 PM", verified: true, bio: "I help early-career engineers build strong foundations, navigate their first roles, and grow into thoughtful technical leaders.", skills: ["React", "TypeScript", "System design", "Career growth"], avatar: "", companyColor: "#5470e8", match: 98 },
  { id: "m-02", name: "Arjun Kapoor", title: "Machine Learning Engineer", company: "Lattice AI", category: "AI / ML", location: "Austin, TX", experienceYears: 7, rating: 4.96, reviewCount: 64, sessions: 172, price: 55, availability: "Tomorrow, 10:00 AM", verified: true, bio: "Making machine learning practical: from your first portfolio project to shipping production models with confidence.", skills: ["Python", "Machine learning", "PyTorch", "MLOps"], avatar: "", companyColor: "#15877c", match: 94 },
  { id: "m-03", name: "Sofia Martinez", title: "Product Design Lead", company: "Fieldwork Studio", category: "UI/UX", location: "New York, NY", experienceYears: 8, rating: 4.99, reviewCount: 103, sessions: 246, price: 50, availability: "Tomorrow, 1:00 PM", verified: true, bio: "I coach designers through the messy middle: portfolio storytelling, research practice, and confident stakeholder conversations.", skills: ["Product design", "Figma", "User research", "Portfolio"], avatar: "", companyColor: "#d36d4f", match: 92 },
  { id: "m-04", name: "Noah Williams", title: "Senior Data Scientist", company: "Blue Oak Analytics", category: "Data Science", location: "Chicago, IL", experienceYears: 10, rating: 4.93, reviewCount: 75, sessions: 191, price: 60, availability: "Fri, 11:30 AM", verified: true, bio: "From statistics coursework to business impact. Let's turn your analytical skills into a career people rely on.", skills: ["SQL", "Python", "Experimentation", "Storytelling"], avatar: "", companyColor: "#2c829c", match: 89 },
  { id: "m-05", name: "Priya Nair", title: "Cybersecurity Architect", company: "Cinder Security", category: "Cybersecurity", location: "Seattle, WA", experienceYears: 11, rating: 4.97, reviewCount: 58, sessions: 138, price: 65, availability: "Fri, 2:00 PM", verified: true, bio: "I help security-curious students understand the field, find a first role, and build a sustainable learning plan.", skills: ["Cloud security", "Threat modeling", "AWS", "Career planning"], avatar: "", companyColor: "#7158b9", match: 87 },
  { id: "m-06", name: "Ethan Brooks", title: "Cloud Platform Engineer", company: "Kiteframe", category: "Cloud Computing", location: "Denver, CO", experienceYears: 8, rating: 4.91, reviewCount: 47, sessions: 125, price: 48, availability: "Mon, 9:00 AM", verified: true, bio: "Practical cloud engineering advice, hands-on portfolio reviews, and a clear path from fundamentals to your first certification.", skills: ["AWS", "Kubernetes", "Terraform", "DevOps"], avatar: "", companyColor: "#41866f", match: 86 },
  { id: "m-07", name: "Amara Okafor", title: "Senior Product Manager", company: "Kindred Works", category: "Product Management", location: "Atlanta, GA", experienceYears: 9, rating: 4.99, reviewCount: 92, sessions: 211, price: 58, availability: "Mon, 12:00 PM", verified: true, bio: "Helping aspiring PMs develop product sense, tell sharper interview stories, and build a career rooted in customer empathy.", skills: ["Product strategy", "Roadmapping", "Discovery", "Interviews"], avatar: "", companyColor: "#bb684a", match: 91 },
  { id: "m-08", name: "Leo Fischer", title: "Investment Analyst", company: "Orchard Capital", category: "Finance", location: "Boston, MA", experienceYears: 6, rating: 4.88, reviewCount: 39, sessions: 96, price: 52, availability: "Tue, 10:30 AM", verified: true, bio: "Breaking down finance careers, case prep, and the day-to-day skills that matter in a fast-moving investment team.", skills: ["Financial modeling", "Excel", "Valuation", "Interview prep"], avatar: "", companyColor: "#467baa", match: 83 },
  { id: "m-09", name: "Zara Ali", title: "Growth Marketing Director", company: "Sunroom Creative", category: "Marketing", location: "Los Angeles, CA", experienceYears: 10, rating: 4.94, reviewCount: 61, sessions: 146, price: 46, availability: "Tue, 3:00 PM", verified: true, bio: "From first marketing internship to leading a team: learn how to experiment, measure, and communicate your impact.", skills: ["Growth strategy", "SEO", "Analytics", "Brand"], avatar: "", companyColor: "#cb5871", match: 85 },
  { id: "m-10", name: "Daniel Park", title: "Founder & CTO", company: "Pebblepath", category: "Entrepreneurship", location: "Portland, OR", experienceYears: 12, rating: 4.97, reviewCount: 53, sessions: 119, price: 75, availability: "Wed, 9:30 AM", verified: true, bio: "Honest, tactical mentorship for early builders: validating ideas, finding your first users, and leading a small product team.", skills: ["Startups", "Product building", "Leadership", "Fundraising"], avatar: "", companyColor: "#5c7046", match: 82 },
  { id: "m-11", name: "Isabella Rossi", title: "Frontend Engineering Manager", company: "Morrow Digital", category: "Software Development", location: "Miami, FL", experienceYears: 12, rating: 4.95, reviewCount: 70, sessions: 183, price: 54, availability: "Wed, 1:00 PM", verified: true, bio: "A people-first engineering leader offering code reviews, frontend career advice, and interview preparation without the jargon.", skills: ["JavaScript", "Accessibility", "React", "Leadership"], avatar: "", companyColor: "#7654a5", match: 90 },
  { id: "m-12", name: "Kofi Mensah", title: "Data Engineering Manager", company: "Harborlight Data", category: "Data Science", location: "Toronto, ON", experienceYears: 9, rating: 4.92, reviewCount: 44, sessions: 108, price: 57, availability: "Thu, 10:00 AM", verified: true, bio: "Build your first data pipeline, tell a stronger project story, and learn what engineering teams actually look for.", skills: ["SQL", "dbt", "Data pipelines", "Python"], avatar: "", companyColor: "#368b83", match: 88 },
  { id: "m-13", name: "Olivia Bennett", title: "UX Researcher", company: "Common Thread", category: "UI/UX", location: "London, UK", experienceYears: 7, rating: 4.96, reviewCount: 57, sessions: 132, price: 44, availability: "Thu, 2:30 PM", verified: true, bio: "Learn to plan useful research, synthesize what you hear, and make a portfolio that shows your judgment—not just deliverables.", skills: ["UX research", "Interviewing", "Synthesis", "Portfolio"], avatar: "", companyColor: "#af695d", match: 90 },
  { id: "m-14", name: "Ravi Shah", title: "Platform Security Engineer", company: "Brightspan Cloud", category: "Cybersecurity", location: "Bengaluru, IN", experienceYears: 8, rating: 4.93, reviewCount: 41, sessions: 101, price: 42, availability: "Fri, 9:00 AM", verified: true, bio: "A clear, structured path into security engineering, including project feedback and advice on interviews and certifications.", skills: ["Application security", "Linux", "OWASP", "Cloud"], avatar: "", companyColor: "#4c74ad", match: 84 },
  { id: "m-15", name: "Grace Kim", title: "AI Product Manager", company: "Signal Grove", category: "AI / ML", location: "Vancouver, BC", experienceYears: 8, rating: 4.98, reviewCount: 66, sessions: 157, price: 62, availability: "Mon, 11:00 AM", verified: true, bio: "Translate technical ideas into helpful AI products. I mentor aspiring PMs on discovery, evaluation, and cross-functional craft.", skills: ["AI products", "Product discovery", "Evaluation", "Roadmaps"], avatar: "", companyColor: "#b57641", match: 93 },
];

const studentNames = [
  "Aarav Mehta", "Anika Bose", "Sam Patel", "Hana Lee", "Jules Carter",
  "Mila Thompson", "Omar Haddad", "Nia Johnson", "Theo Martin", "Lina Rahman",
  "Mateo Silva", "Asha Rao", "Eli Turner", "Mina Cho", "Yusuf Khan",
  "Freya Clarke", "Dev Gupta", "Iris Chen", "Kai Morgan", "Leila Ahmed",
  "Rohan Das", "Eva Novak", "Amir Ali", "Chloe Wright", "Neel Iyer",
  "Talia Cohen", "Ben Walker", "Maya Singh", "Sasha Kim", "Ria Kapoor",
];

const bookings: Booking[] = Array.from({ length: 20 }, (_, index) => {
  const mentor = mentors[index % mentors.length];
  const isPast = index < 12;
  return {
    id: `b-${String(index + 1).padStart(2, "0")}`,
    mentorId: mentor.id,
    mentorName: mentor.name,
    studentName: studentNames[index % studentNames.length],
    type: ["Career Guidance", "Mock Interview", "Portfolio Review", "Technical Mentoring"][index % 4],
    date: isPast ? `2026-09-${String(22 + (index % 8)).padStart(2, "0")}` : `2026-10-${String(9 + (index % 18)).padStart(2, "0")}`,
    time: ["9:00 AM", "10:30 AM", "1:00 PM", "3:30 PM"][index % 4],
    status: isPast ? "completed" : index % 4 === 0 ? "pending" : "confirmed",
    price: mentor.price,
    meetingUrl: null,
  };
});

const reviews: Review[] = [
  { id: "r-01", mentorId: "m-01", studentName: "Anika Bose", rating: 5, comment: "Maya helped me turn a vague career plan into specific next steps. I left feeling much more confident.", date: "2026-09-26", tags: ["Helpful", "Practical Advice"] },
  { id: "r-02", mentorId: "m-01", studentName: "Sam Patel", rating: 5, comment: "Clear, thoughtful feedback on my portfolio and the kind of questions I should ask in interviews.", date: "2026-09-18", tags: ["Professional", "Good Communication"] },
  { id: "r-03", mentorId: "m-02", studentName: "Hana Lee", rating: 5, comment: "Arjun explained ML concepts in a way that connected to real work. The project suggestions were excellent.", date: "2026-09-22", tags: ["Knowledgeable", "Practical Advice"] },
  { id: "r-04", mentorId: "m-03", studentName: "Jules Carter", rating: 5, comment: "Sofia's portfolio notes were specific and kind. I made improvements the same afternoon.", date: "2026-09-20", tags: ["Helpful", "Professional"] },
  { id: "r-05", mentorId: "m-04", studentName: "Mila Thompson", rating: 5, comment: "Noah made the data science job search feel manageable and shared a practical learning plan.", date: "2026-09-19", tags: ["Practical Advice", "Knowledgeable"] },
  { id: "r-06", mentorId: "m-05", studentName: "Omar Haddad", rating: 5, comment: "Really useful overview of security roles and the projects that can help me stand out.", date: "2026-09-17", tags: ["Helpful", "Knowledgeable"] },
  { id: "r-07", mentorId: "m-07", studentName: "Nia Johnson", rating: 5, comment: "Amara gave me a much clearer way to explain my product thinking during interviews.", date: "2026-09-16", tags: ["Professional", "Practical Advice"] },
  { id: "r-08", mentorId: "m-09", studentName: "Theo Martin", rating: 5, comment: "A great balance of encouragement and honest feedback on my marketing projects.", date: "2026-09-15", tags: ["Helpful", "Good Communication"] },
  { id: "r-09", mentorId: "m-11", studentName: "Lina Rahman", rating: 5, comment: "Isabella took time to understand my goals before making suggestions. Fantastic session.", date: "2026-09-12", tags: ["Professional", "Helpful"] },
  { id: "r-10", mentorId: "m-15", studentName: "Mateo Silva", rating: 5, comment: "Grace helped me connect my technical background to AI product roles in a very practical way.", date: "2026-09-10", tags: ["Knowledgeable", "Practical Advice"] },
];

const messages: Message[] = [
  { id: "msg-01", conversationId: "m-01", sender: "Maya Chen", body: "Hi Anika, I reviewed the portfolio link you shared. Looking forward to talking through it together.", time: "10:32 AM", mine: false },
  { id: "msg-02", conversationId: "m-01", sender: "You", body: "Thank you! I added a case study this morning, so I will send the updated link before our session.", time: "10:41 AM", mine: true },
  { id: "msg-03", conversationId: "m-03", sender: "Sofia Martinez", body: "Your case study has a strong problem statement. Happy to help you refine the storytelling.", time: "Yesterday", mine: false },
  { id: "msg-04", conversationId: "m-07", sender: "Amara Okafor", body: "I sent over a short product sense exercise to try before our next conversation.", time: "Monday", mine: false },
];

const notifications: Notification[] = [
  { id: "n-01", title: "Booking request received", detail: "Your session request with Maya Chen is awaiting confirmation.", time: "12 min ago", unread: true },
  { id: "n-02", title: "New message from Sofia", detail: "Sofia Martinez shared feedback on your portfolio.", time: "1 hr ago", unread: true },
  { id: "n-03", title: "Career goal updated", detail: "Your frontend engineering roadmap is ready for your next step.", time: "Yesterday", unread: false },
];

const progress: Progress = {
  goal: "Land a frontend engineering role",
  completion: 72,
  skills: [
    { name: "JavaScript", value: 82, color: "indigo" },
    { name: "React", value: 74, color: "blue" },
    { name: "TypeScript", value: 61, color: "violet" },
    { name: "System design", value: 38, color: "teal" },
  ],
  nextSteps: ["Review your portfolio with a mentor", "Practice one frontend interview", "Build a small project with TypeScript"],
};

const dashboards: Record<string, Dashboard> = {
  student: { role: "student", sessions: 8, upcoming: 2, earnings: 0, rating: 0, students: 0, progress: 72, activity: ["You requested a session with Maya Chen", "Sofia Martinez shared portfolio feedback", "You completed your JavaScript learning goal"] },
  mentor: { role: "mentor", sessions: 34, upcoming: 6, earnings: 1840, rating: 4.98, students: 28, progress: 0, activity: ["New request from Aarav Mehta", "You completed a portfolio review", "A new five-star review was added"] },
  admin: { role: "admin", sessions: 1284, upcoming: 86, earnings: 42680, rating: 4.91, students: 30, progress: 0, activity: ["3 mentor profiles awaiting review", "18 sessions booked this week", "6 new student accounts this week"] },
};

router.get("/mentors", (req, res): void => {
  const parsed = GetMentorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid mentor search filters." });
    return;
  }
  const { search, category, minRating, maxPrice } = parsed.data;
  const term = search?.trim().toLowerCase();
  const filtered = mentors.filter((mentor) => {
    const searchMatch = !term || [mentor.name, mentor.title, mentor.company, mentor.category, ...mentor.skills].some((value) => value.toLowerCase().includes(term));
    return searchMatch &&
      (!category || mentor.category === category) &&
      (minRating === undefined || mentor.rating >= minRating) &&
      (maxPrice === undefined || mentor.price <= maxPrice);
  });
  res.json(GetMentorsResponse.parse(filtered));
});

router.get("/mentors/:id", (req, res): void => {
  const parsed = GetMentorParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid mentor id." });
    return;
  }
  const mentor = mentors.find((entry) => entry.id === parsed.data.id);
  if (!mentor) {
    res.status(404).json({ error: "Mentor not found." });
    return;
  }
  res.json(GetMentorResponse.parse(mentor));
});

router.get("/bookings", (req, res): void => {
  const parsed = GetBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid booking filter." });
    return;
  }
  const result = parsed.data.role === "mentor"
    ? bookings.filter((booking) => booking.mentorId === "m-01")
    : bookings;
  res.json(GetBookingsResponse.parse(result));
});

router.post("/bookings", (req, res): void => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please choose a mentor, session type, date, and time." });
    return;
  }
  const mentor = mentors.find((entry) => entry.id === parsed.data.mentorId);
  if (!mentor) {
    res.status(404).json({ error: "That mentor is no longer available." });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.data.date) || Number.isNaN(Date.parse(parsed.data.date))) {
    res.status(400).json({ error: "Choose a valid session date." });
    return;
  }
  if (Date.parse(`${parsed.data.date}T23:59:59`) < Date.now()) {
    res.status(400).json({ error: "Choose a future session date." });
    return;
  }
  const booking: Booking = {
    id: `b-${Date.now().toString(36)}`,
    mentorId: mentor.id,
    mentorName: mentor.name,
    studentName: "Demo Student",
    type: parsed.data.type,
    date: parsed.data.date,
    time: parsed.data.time,
    status: "pending",
    price: mentor.price,
    meetingUrl: null,
  };
  bookings.unshift(booking);
  res.status(201).json(CreateBookingResponse.parse(booking));
});

router.get("/dashboard", (req, res): void => {
  const parsed = GetDashboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid dashboard role." });
    return;
  }
  res.json(GetDashboardResponse.parse(dashboards[parsed.data.role ?? "student"]));
});

router.get("/reviews", (req, res): void => {
  const parsed = GetReviewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid review filter." });
    return;
  }
  const result = parsed.data.mentorId
    ? reviews.filter((review) => review.mentorId === parsed.data.mentorId)
    : reviews;
  res.json(GetReviewsResponse.parse(result));
});

router.post("/reviews", (req, res): void => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Add a rating and a short comment before submitting." });
    return;
  }
  const mentor = mentors.find((entry) => entry.id === parsed.data.mentorId);
  if (!mentor) {
    res.status(404).json({ error: "Mentor not found." });
    return;
  }
  const review: Review = {
    id: `r-${Date.now().toString(36)}`,
    mentorId: mentor.id,
    studentName: "Demo Student",
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    date: new Date().toISOString().slice(0, 10),
    tags: parsed.data.tags ?? [],
  };
  reviews.unshift(review);
  mentor.rating = Number((((mentor.rating * mentor.reviewCount) + review.rating) / (mentor.reviewCount + 1)).toFixed(2));
  mentor.reviewCount += 1;
  res.status(201).json(CreateReviewResponse.parse(review));
});

router.get("/messages", (req, res): void => {
  const parsed = GetMessagesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid conversation filter." });
    return;
  }
  const result = parsed.data.conversationId
    ? messages.filter((message) => message.conversationId === parsed.data.conversationId)
    : messages;
  res.json(GetMessagesResponse.parse(result));
});

router.post("/messages", (req, res): void => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Write a message before sending." });
    return;
  }
  const message: Message = {
    id: `msg-${Date.now().toString(36)}`,
    conversationId: parsed.data.conversationId,
    sender: "You",
    body: parsed.data.body,
    time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    mine: true,
  };
  messages.push(message);
  res.status(201).json(SendMessageResponse.parse(message));
});

router.get("/notifications", (_req, res): void => {
  res.json(GetNotificationsResponse.parse(notifications));
});

router.patch("/notifications/:id/read", (req, res): void => {
  const parsed = MarkNotificationReadParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid notification id." });
    return;
  }
  const notification = notifications.find((entry) => entry.id === parsed.data.id);
  if (!notification) {
    res.status(404).json({ error: "Notification not found." });
    return;
  }
  notification.unread = false;
  res.json(MarkNotificationReadResponse.parse(notification));
});

router.get("/progress", (_req, res): void => {
  res.json(GetProgressResponse.parse(progress));
});


// User store for authentication (Full-stack CRUD and session support)
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor" | "admin";
  avatar: string;
  password?: string;
}

const users: AuthUser[] = [
  { id: "u-student", name: "Alex Morgan", email: "student@mentorbridge.com", role: "student", avatar: "AM", password: "password123" },
  { id: "m-01", name: "Maya Chen", email: "mentor@mentorbridge.com", role: "mentor", avatar: "MC", password: "password123" },
  { id: "u-admin", name: "Sarah Jenkins", email: "admin@mentorbridge.com", role: "admin", avatar: "SJ", password: "password123" },
];

router.post("/auth/login", (req, res): void => {
  const { email, password, role } = req.body || {};
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email address is required." });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    const derivedRole: "student" | "mentor" | "admin" =
      role === "mentor" || role === "admin" ? role : "student";
    const namePart = normalizedEmail.split("@")[0].replace(/[^a-zA-Z]/g, " ");
    const formattedName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : "Demo User";
    user = {
      id: `u-${Date.now().toString(36)}`,
      name: formattedName,
      email: normalizedEmail,
      role: derivedRole,
      avatar: formattedName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "DU",
    };
    users.push(user);
  }

  const token = `mb_sess_${Buffer.from(`${user.id}:${Date.now()}`).toString("base64")}`;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    token,
  });
});

router.post("/auth/register", (req, res): void => {
  const { name, email, role, password } = req.body || {};
  if (!email || !name) {
    res.status(400).json({ error: "Name and email are required." });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }
  const newUser: AuthUser = {
    id: `u-${Date.now().toString(36)}`,
    name: name.trim(),
    email: normalizedEmail,
    role: role === "mentor" || role === "admin" ? role : "student",
    avatar: name.trim().split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U",
    password: password || "password123",
  };
  users.push(newUser);
  const token = `mb_sess_${Buffer.from(`${newUser.id}:${Date.now()}`).toString("base64")}`;
  res.status(201).json({
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
    },
    token,
  });
});

router.get("/auth/me", (req, res): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: users[0] });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true, message: "Logged out successfully." });
});

// Backend-only Gemini AI endpoints with JSON mode and secret protection
router.post("/ai/match", async (req, res): Promise<void> => {
  try {
    const { goal, field } = req.body || {};
    if (!goal) {
      res.status(400).json({ error: "Goal is required for AI matching." });
      return;
    }
    const result = await generateMentorMatches(goal, field, mentors);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate matches" });
  }
});

router.post("/ai/session-prep", async (req, res): Promise<void> => {
  try {
    const { mentorId, sessionType } = req.body || {};
    const mentor = mentors.find((m) => m.id === mentorId) || mentors[0];
    const result = await generateSessionPrep(mentor, sessionType || "1:1 Career Mentorship");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate session prep" });
  }
});

router.post("/ai/roadmap", async (req, res): Promise<void> => {
  try {
    const { goal } = req.body || {};
    const result = await generateGoalRoadmap(goal || "Land my first Senior Software Engineer role");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate roadmap" });
  }
});

export default router;
