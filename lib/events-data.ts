export type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string; // Main display image
  images?: Array<string>; // Additional images for the inline slideshow view
  registrationUrl?: string;
};

export const upcomingEvents: EventItem[] = [
  // Add upcoming events here if any
];

export const pastEvents: EventItem[] = [
  {
    id: "pathways-dentistry-medicine-law",
    title: "Pathways to Dentistry, Medicine and Law",
    date: "November 14, 2025",
    time: "6:00 PM - 8:30 PM",
    location: "CRX Hall, uOttawa",
    image: "/events/pathways-1.png",
    images: [
      "/events/pathways-1.png",
      "/events/pathways-2.png",
      "/events/pathways-3.png"
    ]
  },
  {
    id: "f1-night",
    title: "F1 Night & Social",
    date: "October 05, 2025",
    time: "7:00 PM - 10:00 PM",
    location: "University Centre",
    image: "/events/f1-1.png",
    images: [
      "/events/f1-1.png",
      "/events/f1-2.png"
    ]
  }
];