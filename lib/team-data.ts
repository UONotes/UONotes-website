export type TeamMember = {
  name: string;
  role: string;
  imageUrl: string; 
};

export type TeamSection = {
  teamName: string;
  description?: string;
  members: TeamMember[];
};

export const TEAM_DATA: TeamSection[] = [
  {
    teamName: "Presidential Team",
    members: [
      { name: "Kiana G. Vazvani", role: "Founder", imageUrl: "/about/Kiana-Headshot.png"},
      { name: "Talar Aghazarian", role: "Co-Founder", imageUrl: "/about/Talar-Headshot.png"},
    ],
  },
  {
    teamName: "Notes Team",
    description: "Curating, verifying, and organizing high-yield academic study materials and cheat sheets across all courses.",
    members: [
      { name: "Tabeeb Howlader", role: "VP Notes", imageUrl: "/about/Tabeeb-Headshot.png"},
      { name: "Ghada Balaa", role: "VP Notes", imageUrl: "/about/Ghada-Headshot.png" },
      { name: "Rosalie Ross", role: "Director", imageUrl: "/about/Rosalie-Headshot.png" },
      { name: "Maraia Masud", role: "Director", imageUrl: "/about/Maraia-Headshot.png" },
      { name: "Abigail Jaeger", role: "Director", imageUrl: "/about/Abigail-Headshot.png" },
      { name: "Norhan Elzayat", role: "Director", imageUrl: "/about/Norhan-Headshot.png" },
      { name: "Narmin Chowdhury", role: "Director", imageUrl: "/about/Narmin-Headshot.png" },
      { name: "Kateeba Eliyas", role: "Director", imageUrl: "/about/Placeholder.png" },
    ],
  },
  {
    teamName: "Bilingualism Team",
    description: "Ensuring equitable access to resources in both official languages and maintaining bilingual translation standards.",
    members: [
      { name: "Manwela Tache", role: "Director", imageUrl: "/about/Manwela-Headshot.png" },
      { name: "Perla Abou-Tayeh", role: "Director", imageUrl: "/about/Perla-Headshot.png" },
      { name: "Rayan Awada", role: "VP Bilingualism", imageUrl: "/about/Placeholder.png" },
      { name: "Sophie Charles", role: "Director", imageUrl: "/about/Placeholder.png" },
    ],
  },
  {
    teamName: "Finance Team",
    description: "Managing club budgeting, sponsorships, funding allocations, and financial logistics for student initiatives.",
    members: [
      { name: "Rojvan Adbullah", role: "VP Finance", imageUrl: "/about/Rojvan-Headshot.png" },
      { name: "Halann Tanflotien", role: "Director", imageUrl: "/about/Halann-Headshot.png" },
      { name: "Haris Sohail", role: "Director", imageUrl: "/about/Placeholder.png" },
      { name: "Adnan Nehme", role: "Director", imageUrl: "/about/Placeholder.png" },
    ],
  },
  {
    teamName: "Social Media Team",
    description: "Engaging the student body, managing online campaigns, and driving community presence across platforms.",
    members: [
      { name: "Lara Fakhri", role: "VP Social Media", imageUrl: "/about/Lara-Headshot.png" },
      { name: "Aanreen Reza", role: "VP Social Media", imageUrl: "/about/Aanreen-Headshot.png" },
      { name: "Umaymah Khandker", role: "Director", imageUrl: "/about/Umaymah-Headshot.png" },
      { name: "Batoul Samhat", role: "Director", imageUrl: "/about/Batoul-Headshot.png" },
      { name: "Ruah Mari", role: "Director", imageUrl: "/about/Placeholder.png" },
      { name: "Nouran Tayeb", role: "Director", imageUrl: "/about/Placeholder.png" },
    ],
  },
  {
    teamName: "Events Team",
    description: "Planning and executing memorable student workshops, cram sessions, and campus-wide community events.",
    members: [
      { name: "Layan Kanaa Alhalabi", role: "VP Events", imageUrl: "/about/Layan-Headshot.png" },
      { name: "Anya Watson", role: "VP Events", imageUrl: "/about/Anya-Headshot.png" },
    ],
  },
  {
    teamName: "Outreach Team",
    description: "Building partnerships with university faculties, student associations, and external academic communities.",
    members: [
      { name: "Nujen Jaffer", role: "VP Outreach", imageUrl: "/about/Nujen-Headshot.png" },
      { name: "Laura Jensen", role: "VP Outreach", imageUrl: "/about/Placeholder.png" },
    ],
  },
  {
    teamName: "Design Team",
    description: "Crafting clean visual brand assets, engaging graphics, and user-friendly visual layouts.",
    members: [
      { name: "Erica Laou", role: "VP Design", imageUrl: "/about/Erica-Headshot.png" },
      { name: "Hadeel Srour", role: "Director", imageUrl: "/about/Hadeel-Headshot.png" },
    ],
  },
  {
    teamName: "Website Developers",
    description: "Architecting the high-performance code that powers the UONotes platform.",
    members: [
      { name: "Jack Mackenzie", role: "VP Web Dev", imageUrl: "/about/Placeholder.png" },
      { name: "Kwabena Asante", role: "VP Web Dev", imageUrl: "/about/Placeholder.png" },
      { name: "Elias Mikrojyan", role: "Director", imageUrl: "/about/Placeholder.png" },
      { name: "Roheen Ghafuri", role: "Director", imageUrl: "/about/Placeholder.png" },
    ],
  },
  {
    teamName: "Media Production Team",
    description: "Producing high-quality photography, video content, and multimedia media assets for events and platforms.",
    members: [
      { name: "Omid Yeganeh", role: "VP Media", imageUrl: "/about/Omid-Headshot.png" },
      { name: "Ayesha Ahmed", role: "Director", imageUrl: "/about/Placeholder.png" },
    ],
  }
];