export interface EventItem {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    registrationUrl?: string;
  }
  
  export const upcomingEvents: EventItem[] = [
    // Empty array to test the placeholder state
  ];
  
  export const pastEvents: EventItem[] = [
    {
      id: "past-1",
      title: "Winter Finals Among Us",
      date: "Apr 10, 2026",
      time: "5:00 PM - 8:00 PM",
      location: "CRX C0140",
      image: "/events/past-events/event1.png"
    },
    {
      id: "past-2",
      title: "Intro to WebDev & Next.js Workshop",
      date: "Mar 18, 2026",
      time: "6:30 PM - 8:00 PM",
      location: "SITE Building",
      image: "/events/past-events/event2.png"
    },
    {
      id: "past-3",
      title: "Rojvan's Amog Us Birthday Bash",
      date: "Sep 12, 2025",
      time: "4:00 PM - 6:00 PM",
      location: "UCU Student Lounge",
      image: "/events/past-events/event3.png"
    }
  ];