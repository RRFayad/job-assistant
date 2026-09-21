// PROTOTYPE ONLY — mock data standing in for a parsed Profile. Modeled as
// a fixed Header plus an ORDERED LIST of typed sections, so the form can
// support renaming, reordering, adding, and removing sections freely —
// not just a fixed template schema. Content below is Renan's real resume,
// used for a realistic comparison against backend/templates/resume_template.docx.

export const mockResumeFileName = "Renan_Fayad_FullStack_AI_Engineer.pdf";

// Per docs/adr/0007-collapse-baseline-into-profile.md.
export const MAX_PROFILES = 3;

export type ProfileLink = {
  id: string;
  label: string;
  url: string;
};

export type ProfileHeader = {
  fullName: string;
  careerTitle: string;
  email: string;
  phone: string;
  location: string;
  links: ProfileLink[];
  // Resume theme — primary colors the header block and section titles
  // are rendered in on the exported document.
  primaryColor: string;
  secondaryColor: string;
};

export type TextSection = {
  id: string;
  type: "text";
  title: string;
  body: string;
};

export type TagsSection = {
  id: string;
  type: "tags";
  title: string;
  categories: { id: string; label: string; items: string[] }[];
};

export type EntriesSection = {
  id: string;
  type: "entries";
  title: string;
  entries: {
    id: string;
    heading: string;
    dates: string;
    // Markdown-lite: **bold**, *italic*, ++underline++, [text](url), "- " lines as bullets.
    body: string;
  }[];
};

export type ListSection = {
  id: string;
  type: "list";
  title: string;
  items: string[];
};

export type PairsSection = {
  id: string;
  type: "pairs";
  title: string;
  pairs: { id: string; left: string; right: string }[];
};

export type ProfileSection =
  TextSection | TagsSection | EntriesSection | ListSection | PairsSection;

// A Profile is the whole, independent, resume-shaped entity (per
// docs/adr/0007-collapse-baseline-into-profile.md) — up to three per
// Candidate, each with its own header, sections, and theme. `name` is a
// short internal label for switching between them; it never appears on the
// exported document itself (that's `header.careerTitle`'s job).
export type Profile = {
  id: string;
  name: string;
  header: ProfileHeader;
  sections: ProfileSection[];
};

export const mockHeader: ProfileHeader = {
  fullName: "Renan Fayad",
  careerTitle:
    "Full Stack AI Engineer | TypeScript, React, Next.js, Python, FastAPI",
  email: "renan.r.fayad@gmail.com",
  phone: "+1 (646) 235-3720",
  location: "Remote (US & EU Timezones) | Available to Relocate",
  links: [
    { id: "github", label: "GitHub", url: "https://github.com/renanfayad" },
    {
      id: "linkedin",
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/renanfayad/",
    },
  ],
  primaryColor: "#2563EB",
  secondaryColor: "#334155",
};

export const mockSections: ProfileSection[] = [
  {
    id: "profile-career",
    type: "text",
    title: "Profile & Career",
    body: "**Full Stack Engineer** with 3+ years of hands-on experience and strong Frontend specialization, focused on building web applications across the TypeScript and Python ecosystems, including React, Next.js, Node.js, FastAPI, PostgreSQL, and MongoDB. Experienced in developing scalable, product-oriented solutions in international startup environments, with growing expertise in AI applications, Agents and RAG systems.\n\nPreviously a Senior Product and Sales Manager at a tech innovation consultancy, leading strategic R&D projects for top-tier companies for *13 years*.",
  },
  {
    id: "tech-stack",
    type: "tags",
    title: "Tech Stack",
    categories: [
      {
        id: "frontend",
        label: "Frontend",
        items: [
          "TypeScript",
          "JavaScript",
          "React",
          "Next.js",
          "React Native",
          "Zustand",
          "Styled Components",
          "Tailwind CSS",
          "shadcn/ui",
        ],
      },
      {
        id: "backend",
        label: "Backend & Data",
        items: [
          "Python",
          "FastAPI",
          "Node.js",
          "PostgreSQL",
          "MongoDB",
          "Prisma",
          "Drizzle",
          "SQLAlchemy",
          "Firebase",
          "BigQuery",
          "Pydantic",
        ],
      },
      {
        id: "ai",
        label: "AI",
        items: [
          "LLM Applications",
          "RAG",
          "AI Agents",
          "LangChain",
          "LangGraph",
          "OpenAI APIs",
        ],
      },
      {
        id: "tools",
        label: "Tools",
        items: ["Git", "GitHub", "Vercel", "Stripe", "Clerk"],
      },
    ],
  },
  {
    id: "experience",
    type: "entries",
    title: "Experience",
    entries: [
      {
        id: "helios-ai",
        heading:
          "Frontend Engineer, Helios AI (AI-driven agriculture forecasting Startup), Arlington - USA (Remote)",
        dates: "Jan 2025 — Jun 2026",
        body: "Owned end-to-end Frontend initiatives, from technical discussions and architecture decisions to production delivery, within a fast-paced international startup environment focused on high-performance data visualization, charts, tables, and dashboards.\n\n- Built scalable frontend solutions using **React, Next.js, TypeScript, Zustand, and Styled Components**, with focus on reusable architecture and maintainable UI patterns.\n- Optimized performance for large-scale components, achieving rendering improvements of approximately **91%** in heavy-data components.\n- Developed charting and visualization features handling datasets with over **50,000 data points**.\n- Developed full-stack features using Python, Pydantic, Firebase, and BigQuery.",
      },
      {
        id: "lsinn-manager",
        heading:
          "Business Development & Technical Senior Manager, LSINN (Leading Brazilian Tech / Innovation Consultancy), Remote",
        dates: "Mar 2021 — Jan 2025",
        body: "Led Business Development and strategic client initiatives, combining B2B sales, client relationship management, consulting methodology development, and cross-functional leadership.\n\n- Led B2B projects, from sales to delivery exceeding **R$ 1 Million** in annual revenue.\n- Collaborated directly with C-level stakeholders and strategic clients.\n- Managed a team of **8**, across Operations, Sales, and Marketing.\n- Developed B2B sales / business development methodology.",
      },
      {
        id: "rf-importados",
        heading: "Entrepreneur: Digital Marketing | E-Commerce, RF Importados",
        dates: "Sept 2019 — Mar 2021",
        body: "Launched and managed a successful e-commerce import business, generating monthly revenues exceeding **R$100,000**.\n\n- Conducted market studies, product selection and negotiation with suppliers.\n- Managed paid traffic campaigns, specifically Facebook Ads.\n- Created persuasive copywriting for the sales funnel.\n- Led a team of two employees.",
      },
      {
        id: "lsinn-supervisor",
        heading:
          "Technical Supervisor - R&D Consulting, LSINN (Tech / Innovation Consultancy)",
        dates: "Sept 2017 — Sept 2019",
        body: "Led the consultancy team, structuring the methodology and implementing work tools.\n\n- Managed 25 projects per year, delivering benefits totaling **R$46,5 M**.\n- Managed and provided training to a team of 12 consultants.",
      },
    ],
  },
  {
    // Demonstrates a fully custom, user-added section — not part of the
    // base template, placed wherever the candidate wants in the order.
    id: "personal-projects",
    type: "list",
    title: "Personal Projects",
    items: [
      "**[SaaS Starter Kit](https://github.com/renanfayad/saas-starter-kit)** (2026) — Production-ready SaaS boilerplate with authentication (Clerk), billing (Stripe), database persistence, authorization, and a Python backend designed for rapid product launches. Built with Next.js, TypeScript, FastAPI, Python, PostgreSQL, Drizzle ORM and SQLAlchemy.",
      "**Primal Trainer** (2024) — A Full Stack AI-assisted fitness platform used by *40+ Users* focused on personalized workout and nutrition planning. Built with Next.js, TypeScript, PostgreSQL, and Prisma, with responsive UI using Tailwind CSS and shadcn/ui.",
      "**WebFlare** (2023) — Full Stack Web Application serving as a digital assets marketplace, including product listing, discovery flows, and transactional marketplace logic. Built with JavaScript, React, Node.js, MongoDB, and Mongoose.",
    ],
  },
  {
    id: "rd-consultant-roles",
    type: "list",
    title: "R&D Consultant Roles",
    items: [
      "Senior R&D Consultant at PwC: May/15 - Sep/17",
      "R&D Consultant at FI Group: May/14 - May/15",
      "Intern R&D Consultant at GAC Group: Jul/11 - Jul/13",
    ],
  },
  {
    id: "education",
    type: "entries",
    title: "Education",
    entries: [
      {
        id: "paulista-university",
        heading:
          "Production and Mechanical Engineering, Paulista University, São Paulo",
        dates: "Apr 2009 — 2014",
        body: "",
      },
    ],
  },
  {
    id: "languages",
    type: "pairs",
    title: "Languages",
    pairs: [
      { id: "english", left: "English", right: "Fluent" },
      { id: "portuguese", left: "Portuguese", right: "Native" },
      { id: "spanish", left: "Spanish", right: "Basic" },
    ],
  },
];

// A second Profile — same underlying career, reframed toward Frontend
// roles: AI-specific content trimmed, everything else (experience,
// projects, education) carried over since it's still relevant. Distinct
// theme colors so switching between Profiles is visually obvious.
export const mockFrontendHeader: ProfileHeader = {
  ...mockHeader,
  careerTitle: "Frontend Engineer | TypeScript, React, Next.js, Tailwind CSS",
  primaryColor: "#0D9488",
  secondaryColor: "#134E4A",
};

export const mockFrontendSections: ProfileSection[] = [
  {
    id: "fe-profile-career",
    type: "text",
    title: "Profile & Career",
    body: "**Frontend Engineer** with 3+ years of hands-on experience building web applications with React, Next.js, and TypeScript, with a strong eye for reusable architecture, maintainable UI patterns, and performance at scale.\n\nPreviously a Senior Product and Sales Manager at a tech innovation consultancy, leading strategic R&D projects for top-tier companies for *13 years*.",
  },
  {
    id: "fe-tech-stack",
    type: "tags",
    title: "Tech Stack",
    categories: [
      {
        id: "fe-frontend",
        label: "Frontend",
        items: [
          "TypeScript",
          "JavaScript",
          "React",
          "Next.js",
          "React Native",
          "Zustand",
          "Styled Components",
          "Tailwind CSS",
          "shadcn/ui",
        ],
      },
      {
        id: "fe-backend",
        label: "Backend & Data",
        items: ["Node.js", "PostgreSQL", "MongoDB", "Prisma", "Firebase"],
      },
      {
        id: "fe-tools",
        label: "Tools",
        items: ["Git", "GitHub", "Vercel", "Stripe", "Clerk"],
      },
    ],
  },
  {
    id: "fe-experience",
    type: "entries",
    title: "Experience",
    entries: [
      {
        id: "fe-helios-ai",
        heading:
          "Frontend Engineer, Helios AI (AI-driven agriculture forecasting Startup), Arlington - USA (Remote)",
        dates: "Jan 2025 — Jun 2026",
        body: "Owned end-to-end Frontend initiatives, from technical discussions and architecture decisions to production delivery, within a fast-paced international startup environment focused on high-performance data visualization, charts, tables, and dashboards.\n\n- Built scalable frontend solutions using **React, Next.js, TypeScript, Zustand, and Styled Components**, with focus on reusable architecture and maintainable UI patterns.\n- Optimized performance for large-scale components, achieving rendering improvements of approximately **91%** in heavy-data components.\n- Developed charting and visualization features handling datasets with over **50,000 data points**.",
      },
      {
        id: "fe-lsinn-manager",
        heading:
          "Business Development & Technical Senior Manager, LSINN (Leading Brazilian Tech / Innovation Consultancy), Remote",
        dates: "Mar 2021 — Jan 2025",
        body: "Led Business Development and strategic client initiatives, combining B2B sales, client relationship management, consulting methodology development, and cross-functional leadership.\n\n- Led B2B projects, from sales to delivery exceeding **R$ 1 Million** in annual revenue.\n- Managed a team of **8**, across Operations, Sales, and Marketing.",
      },
    ],
  },
  {
    id: "fe-personal-projects",
    type: "list",
    title: "Personal Projects",
    items: [
      "**[SaaS Starter Kit](https://github.com/renanfayad/saas-starter-kit)** (2026) — Production-ready SaaS boilerplate. Built with Next.js, TypeScript, FastAPI, Python, PostgreSQL, Drizzle ORM and SQLAlchemy.",
      "**Primal Trainer** (2024) — A Full Stack AI-assisted fitness platform used by *40+ Users*. Built with Next.js, TypeScript, PostgreSQL, and Prisma, with responsive UI using Tailwind CSS and shadcn/ui.",
    ],
  },
  {
    id: "fe-education",
    type: "entries",
    title: "Education",
    entries: [
      {
        id: "fe-paulista-university",
        heading:
          "Production and Mechanical Engineering, Paulista University, São Paulo",
        dates: "Apr 2009 — 2014",
        body: "",
      },
    ],
  },
  {
    id: "fe-languages",
    type: "pairs",
    title: "Languages",
    pairs: [
      { id: "fe-english", left: "English", right: "Fluent" },
      { id: "fe-portuguese", left: "Portuguese", right: "Native" },
    ],
  },
];

export const mockProfiles: Profile[] = [
  {
    id: "profile-ai-engineer",
    name: "Full-Stack AI Engineer",
    header: mockHeader,
    sections: mockSections,
  },
  {
    id: "profile-frontend",
    name: "Frontend Engineer",
    header: mockFrontendHeader,
    sections: mockFrontendSections,
  },
];
