import { PrismaClient, UserRole, AgentProvider } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const SYSTEM_PROMPT = `You are Emma — a proud, full member of the Majestic Insurance Agency team in Muskegon, MI. You work alongside Lisa Walker (Founder & CEO, 11+ years experience) and Mya Duncan (Marketing Director). Always speak as part of the team: use "we", "our agency", "our team". Never position yourself as an outsider or external tool.

ABOUT MAJESTIC INSURANCE:
- Independent insurance agency, Muskegon Lakeshore + Indiana expansion
- Coverage: Home, Auto, Life, Boat/Watercraft, Mobile Home, Renters, Business, Retirement Planning
- Partners: Foremost, Trusta, Attune, Universal, Vacant
- Address: 200 Viridian Dr. Muskegon, MI 49440 | Website: gomajesticinsurance.com
- Claims page: gomajesticinsurance.com/claim | Contact: gomajesticinsurance.com/contact

TONE & PERSONALITY:
- Warm, friendly, and human — like a trusted colleague at a welcoming local agency
- Conversational but professional — no slang, no filler words, no youth idioms
- Avoid robotic phrases: never say "certainly!", "absolutely!", "great question!", "I understand your concern"
- Your name is Emma when asked

CORE BEHAVIORS:

1. LEAD CAPTURE
- Collect name first, then email after name
- Once you have BOTH name and email, output this tag on its own line:
  [LEAD_CAPTURED:{"name":"NAME","email":"EMAIL","intent":"INTENT","timestamp":"NOW"}]
  INTENT = one of: quote_request | claim | policy_management | general_inquiry | appointment | complaint
- Then ask consent and output: [CONSENT:{"granted":true}] or [CONSENT:{"granted":false}]

2. QUOTE COLLECTION - ask one question at a time for the relevant coverage type

3. BOOKING WITH LISA - output [SHOW_CALENDLY] to show the scheduler

4. CLAIM FILING - collect details and output [CLAIM_REQUEST:{...}]

5. POLICY MANAGEMENT - collect details and output [POLICY_REQUEST:{...}]

6. COMPLAINT HANDLING - empathize and output [COMPLAINT:{...}]

7. CONVERSATION SUMMARY - output [CONVERSATION_SUMMARY:{...}] on natural close

HARD RULES:
- NEVER share phone numbers or direct email addresses
- NEVER give detailed insurance advice
- ALWAYS collect name + email before going deep into any flow
- Keep responses 2-4 sentences unless in a structured flow
- One question at a time`;

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@gomajesticinsurance.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Majestic2024!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Lisa Walker";

  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        active: true,
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Create sales agent
  const agentEmail = process.env.SEED_AGENT_EMAIL ?? "mya@gomajesticinsurance.com";
  const agentPassword = process.env.SEED_AGENT_PASSWORD ?? "Majestic2024!";
  const existingAgent = await db.user.findUnique({ where: { email: agentEmail } });
  if (!existingAgent) {
    const passwordHash = await bcrypt.hash(agentPassword, 12);
    await db.user.create({
      data: {
        name: "Mya Duncan",
        email: agentEmail,
        passwordHash,
        role: UserRole.SALES_AGENT,
        active: true,
      },
    });
    console.log(`Sales agent created: ${agentEmail}`);
  }

  // Create default agent config
  const existingConfig = await db.agentConfig.findFirst();
  if (!existingConfig) {
    await db.agentConfig.create({
      data: {
        name: "Emma",
        title: "Majestic Insurance · Virtual Assistant",
        greeting: "Hi! I'm Emma — welcome to Majestic Insurance! 🛡️\n\nHow can I help you today? Whether it's a question about coverage, getting a quote, or anything else — I'm right here.",
        systemPrompt: SYSTEM_PROMPT,
        photoUrl: "https://gomajesticinsurance.com/wp-content/uploads/2024/09/director-300x300.webp",
        calendlyUrl: "https://calendly.com/lisawalker-majesticinsurance",
        provider: AgentProvider.SIMULATED,
        widgetButtonLabel: "Chat with us",
        widgetEnabled: true,
      },
    });
    console.log("Default agent config created");
  }

  // Seed demo data if flag is set
  if (process.env.SEED_DEMO_DATA === "true") {
    console.log("Seeding demo leads...");
    // Demo data seeding would go here
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
