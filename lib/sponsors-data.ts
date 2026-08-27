// lib/sponsors-data.ts

export interface Sponsor {
    name: string;
    imageUrl: string;
  }
  
  export const SPONSORS: Sponsor[] = [
    { name: "Pure Yoga", imageUrl: "/sponsors/Pure-Yoga-Logo.png" },
    { name: "Pizza Pizza", imageUrl: "/sponsors/PizzaPizza-Logo.png" },
    { name: "Crumbl Cookies", imageUrl: "/sponsors/Crumbl-Cookies-Logo.png" },
    { name: "Metcalfe", imageUrl: "/sponsors/Metcalfe-Logo.png" },
    { name: "Red Bull", imageUrl: "/sponsors/RedBull-Logo.png" },
    { name: "Haunted Walk", imageUrl: "/sponsors/Haunted-Walk-Logo.png" },
  ];