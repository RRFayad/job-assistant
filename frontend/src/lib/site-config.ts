import { getEnvVar } from "@/lib/utils";

const github = getEnvVar("NEXT_PUBLIC_GITHUB_URL", false) ?? "";

export const siteConfig = {
  name: "SaaS Starter Kit",
  url: getEnvVar("FRONTEND_URL").replace(/\/$/, ""),
  github,
  // #readme lands a plain "view the repo" link straight on its rendered
  // README instead of the file tree — distinct from the footer's explicit
  // link to the raw README.md file, which needs the bare `github` URL.
  githubReadme: github ? `${github}/#readme` : "",
  tagline: "A full-stack foundation for modern SaaS products",
} as const;
