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
    image: "/events/PathwaysDML/1st.jpg", // Using first image as primary
    images: [
      "/events/PathwaysDML/1st.jpg",
      "/events/PathwaysDML/2nd.jpg",
      "/events/PathwaysDML/3rd.jpg",
      "/events/PathwaysDML/4th.jpg",
      "/events/PathwaysDML/5th.jpg",
      "/events/PathwaysDML/6th.jpg",
      "/events/PathwaysDML/7th.jpg",
      "/events/PathwaysDML/8th.jpg",
      "/events/PathwaysDML/9th.jpg",
      "/events/PathwaysDML/10th.jpg"
    ]
  },
  {
    id: "trivia-night",
    title: "Trivia Night",
    date: "October 20, 2025", // Replace with your actual date
    time: "7:00 PM - 10:00 PM", // Replace with your actual time
    location: "Campus Pub", // Replace with your actual location
    image: "/events/Trivia/1.jpg", // Using first image as primary
    images: [
      "/events/Trivia/1.jpg",
      "/events/Trivia/2.jpg",
      "/events/Trivia/3.jpg",
      "/events/Trivia/4.jpg",
      "/events/Trivia/5.jpg",
      "/events/Trivia/6.jpg",
      "/events/Trivia/7.jpg",
      "/events/Trivia/8.jpg",
      "/events/Trivia/9.jpg"
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
      "/events/past-events/event1.png",
    ]
  }
];