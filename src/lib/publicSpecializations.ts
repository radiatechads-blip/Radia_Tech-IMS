import { prisma } from "@/lib/db";
import { logServerError } from "@/lib/api";

export interface PublicServiceSpecialization {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fallbackServiceSpecializations: PublicServiceSpecialization[] = [
  {
    id: "fallback-specialization-1",
    title: "Fire Alarm & Detection Systems",
    shortDescription: "Advanced detection solutions designed for early warning, fast response, and dependable monitoring across critical facilities.",
    fullDescription: "We design and deliver fire alarm and detection systems that support early warning, rapid response, and reliable monitoring for commercial, industrial, and institutional facilities. Each solution is tailored to the building layout, occupancy profile, and compliance requirements of the project.",
    image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.21 PM.jpeg",
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "fallback-specialization-2",
    title: "Suppression & Protection Engineering",
    shortDescription: "End-to-end protection planning for sprinkler, hydrant, and suppression systems with strict quality control.",
    fullDescription: "Our protection engineering specialists support the planning and implementation of suppression systems, hydrants, and integrated safety infrastructure. The work focuses on dependable performance, installation quality, and long-term maintainability.",
    image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (1).jpeg",
    sortOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "fallback-specialization-3",
    title: "Project Support & Turnkey Delivery",
    shortDescription: "Hands-on project coordination from consultation and sourcing to installation and post-installation support.",
    fullDescription: "We provide project support that spans consultation, sourcing, implementation, and after-sales assistance so clients can rely on a single team for coordinated execution. This allows faster decisions, better consistency, and a smoother delivery experience.",
    image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (2).jpeg",
    sortOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function getPublicServiceSpecializations(): Promise<PublicServiceSpecialization[]> {
  try {
    const items = await prisma.serviceSpecialization.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (items.length > 0) {
      return items as unknown as PublicServiceSpecialization[];
    }
  } catch (error) {
    logServerError("lib.getPublicServiceSpecializations", error);
  }

  return fallbackServiceSpecializations;
}
