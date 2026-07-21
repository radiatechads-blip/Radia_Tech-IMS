import { jsonError, logServerError } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return jsonError("Seed configuration is incomplete.", 500);
  }

  try {
    // Create admin user
    const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD);
    await prisma.adminUser.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {},
      create: {
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        name: "Admin",
      },
    });

    // Seed categories
    const categoryData = [
      { slug: "ppr-pipes", name: "PPR Pipes", description: "Premium quality PPR-C pipes available in sizes from 20MM to 615 mm with pressure ratings from PN 6 to PN 20.", image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.27 PM.jpeg", sortOrder: 1 },
      { slug: "ppr-pipe-fittings", name: "PPR Pipe Fittings", description: "Complete range of PPR pipe fittings including elbows, tees, couplers, clamps, and reducers.", image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM.jpeg", sortOrder: 2 },
      { slug: "pprc-fittings", name: "PPRC Fittings", description: "Industrial-grade PPRC fittings for large diameter piping systems in process industries.", image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (1).jpeg", sortOrder: 3 },
      { slug: "pipes-fittings", name: "Pipes & Fittings", description: "General-purpose pipes and fittings for construction and plumbing applications.", image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (2).jpeg", sortOrder: 4 },
      { slug: "compressed-air-pipe-fittings", name: "Compressed Air Pipe Fittings", description: "Specialized piping solutions for compressed air, nitrogen, oxygen, and vacuum line applications.", image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.24 PM.jpeg", sortOrder: 5 },
      { slug: "industrial-piping-services", name: "Industrial Piping Services", description: "End-to-end industrial piping installation, lining, and maintenance services.", image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.21 PM (1).jpeg", sortOrder: 6 },
    ];

    const categories: Record<string, string> = {};
    for (const cat of categoryData) {
      const created = await prisma.productCategory.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, description: cat.description, image: cat.image, sortOrder: cat.sortOrder },
        create: cat,
      });
      categories[cat.slug] = created.id;
    }

    // Seed products
    const productData = [
      { slug: "fusion-ppr-pipes", name: "Fusion PPR Pipes", catSlug: "ppr-pipes", description: "High-quality Fusion PPR pipes designed for industrial and commercial applications.", specs: { Material: "PPR-C (Polypropylene Random Copolymer Type 3)", "Size Range": "20MM to 615 mm", "Pressure Rating": "PN 6 to PN 20", Standard: "DIN 16962", "Temperature Range": "Up to 95°C", "Service Life": "50+ years", Color: "Green / White" }, apps: ["Hot/Cold Water Supply", "Chemical Plants", "Cooling Towers", "Condensor Lines"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.27 PM.jpeg", featured: true },
      { slug: "fusion-ppr-pipe-pn16", name: "Fusion PPR Pipe PN 16 Waterline Special", catSlug: "ppr-pipes", description: "Specialized PN 16 rated PPR pipes designed specifically for waterline applications.", specs: { Material: "PPR-C Type 3", "Pressure Rating": "PN 16", Standard: "DIN 16962", "Temperature Range": "Up to 95°C", "Inner Layer": "Anti-microbial", "Outer Layer": "UV Stabilized", "Service Life": "50+ years" }, apps: ["Drinking Water Supply", "Plumbing", "DM Water Lines", "Liquid Food Supply"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.27 PM.jpeg", featured: true },
      { slug: "green-therm-ppr-pipes", name: "Green Therm PPR Pipes", catSlug: "ppr-pipes", description: "Premium Green Therm PPR pipes with enhanced thermal properties.", specs: { Material: "PPR-C Type 3 with UV Stabilizer", "Size Range": "20mm to 160mm", "Pressure Rating": "PN 10 to PN 20", Standard: "DIN 16962", "UV Protection": "Yes", "Anti-microbial": "Yes", "Service Life": "50+ years" }, apps: ["Solar Water Heater", "Hot Water Supply", "Industrial Cooling", "Process Lines"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.28 PM.jpeg", featured: true },
      { slug: "fusion-ppr-pipes-standard", name: "Fusion PPR Pipes - Standard Range", catSlug: "ppr-pipes", description: "Standard range Fusion PPR pipes for general-purpose industrial piping.", specs: { Material: "PPR-C", "Friction Factor": "1.5 Ft/100 Ft", "Chemical Resistance": "Excellent", "Sound Insulation": "Yes", "Frost Proof": "Yes", "Leak Proof": "Yes" }, apps: ["Chilled Water Supply", "Pharmaceutical Industries", "RO Plants", "Fire Applications"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.27 PM.jpeg" },
      { slug: "ppr-reducing-tee", name: "PPR Reducing Tee 63MM x 50MM", catSlug: "ppr-pipe-fittings", description: "High-quality PPR reducing tee fitting for transitioning between different pipe sizes.", specs: { Size: "63MM x 50MM", Material: "PPR-C", Type: "Reducing Tee", Connection: "Fusion Welding", Standard: "DIN 16962" }, apps: ["Pipeline Branching", "Size Reduction", "Industrial Piping"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM.jpeg" },
      { slug: "fusion-pprc-elbow-50mm", name: "Fusion PPRC Elbow 50MM", catSlug: "ppr-pipe-fittings", description: "50MM PPRC elbow fitting for directional changes in piping systems.", specs: { Size: "50MM", Material: "PPRC", Angle: "90°", Connection: "Fusion Welding" }, apps: ["Direction Change", "Pipeline Routing", "Industrial Systems"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (1).jpeg" },
      { slug: "fusion-ppr-coupler", name: "Fusion PPR Coupler", catSlug: "ppr-pipe-fittings", description: "Standard PPR coupler for joining two pipes of the same diameter.", specs: { "Size Range": "20MM to 110MM", Material: "PPR-C", Connection: "Fusion Welding", Standard: "DIN 16962" }, apps: ["Pipe Joining", "Extension", "Repair"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (2).jpeg" },
      { slug: "ppr-tee-blue", name: "PPR Tee Blue", catSlug: "ppr-pipe-fittings", description: "Blue PPR tee fitting for creating three-way junctions in pipeline systems.", specs: { Material: "PPR-C", Color: "Blue", Type: "Equal Tee", Connection: "Fusion Welding" }, apps: ["Cold Water Systems", "Pipeline Branching", "Distribution Networks"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM.jpeg" },
      { slug: "fusion-ppr-clamp", name: "Fusion PPR Clamp 20MM to 63MM", catSlug: "ppr-pipe-fittings", description: "PPR pipe clamps for secure pipe mounting and support.", specs: { "Size Range": "20MM to 63MM", Material: "PPR-C", Type: "Pipe Clamp / Support" }, apps: ["Pipe Mounting", "Wall Support", "Overhead Piping"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.21 PM.jpeg" },
      { slug: "pprc-coupler", name: "PPRC Coupler", catSlug: "pprc-fittings", description: "Premium PPRC coupler for joining PPRC pipes.", specs: { Material: "PPRC", Connection: "Fusion Welding", Standard: "DIN 16962" }, apps: ["Industrial Piping", "Water Supply", "Chemical Lines"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (2).jpeg" },
      { slug: "pprc-pipe-fittings-6inch", name: "PPRC Pipe Fittings 6 inch Elbow", catSlug: "pprc-fittings", description: "6-inch PPRC elbow fitting for large-diameter piping systems.", specs: { Size: "6 inch", Type: "Elbow", Material: "PPRC", Application: "Water / Industrial" }, apps: ["Water Supply", "Industrial Piping", "Construction"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (1).jpeg" },
      { slug: "pprc-pipe-fittings-34", name: "3/4 inch PPRC Pipe & Fittings", catSlug: "pprc-fittings", description: "3/4 inch PPRC pipe and fittings for construction and plumbing.", specs: { Size: "3/4 inch", Type: "Pipe & Elbow", Material: "PPRC", Use: "Construction" }, apps: ["Construction", "Plumbing", "Residential"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM.jpeg" },
      { slug: "pprc-flange-fusion", name: "PPRC Flange (Fusion)", catSlug: "pprc-fittings", description: "Fusion-type PPRC flange for connecting PPRC piping to metal piping.", specs: { Material: "PPRC", Type: "Fusion Flange", Connection: "Fusion + Bolted" }, apps: ["Equipment Connection", "System Integration", "Maintenance Points"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.21 PM (1).jpeg" },
      { slug: "fusion-pprc-reducer", name: "Fusion PPRC Reducer", catSlug: "pprc-fittings", description: "PPRC reducer for transitioning between different pipe diameters.", specs: { Material: "PPRC", Type: "Reducer", Connection: "Fusion Welding" }, apps: ["Size Transition", "Flow Management", "Industrial Piping"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (2).jpeg" },
      { slug: "industrial-piping-work", name: "Industrial Piping Work for Air/Chemical/Vacuum Line", catSlug: "compressed-air-pipe-fittings", description: "Complete industrial piping solutions for compressed air lines, chemical supply lines, vacuum lines.", specs: { Service: "Turnkey Piping Installation", Applications: "Air / Chemical / Vacuum Lines", Material: "PPR-C / PPRC", Standards: "DIN 16962" }, apps: ["Compressed Air", "Nitrogen Air", "Oxygen Air", "Vacuum Lines", "Chemical Plants"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.24 PM.jpeg", featured: true },
      { slug: "pprc-ball-valve", name: "PPRC Ball Valve", catSlug: "pprc-fittings", description: "High-quality PPRC ball valve for flow control in piping systems.", specs: { Material: "PPRC", Type: "Ball Valve", Operation: "Manual", Bore: "Full Bore" }, apps: ["Flow Control", "Shut-off", "Process Control"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.25 PM.jpeg", isNew: true },
      { slug: "mta-male-threaded-adaptor", name: "MTA Male Threaded Adaptor", catSlug: "pprc-fittings", description: "Male threaded adaptor for connecting PPRC piping to threaded metal fittings.", specs: { Material: "PPRC + Brass Insert", Type: "Male Threaded Adaptor (MTA)", Connection: "Fusion + Threaded" }, apps: ["Metal-to-PPRC Transition", "Equipment Connection", "Valve Installation"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM.jpeg", isNew: true },
      { slug: "pprc-fta-50", name: "PPRC FTA 50", catSlug: "pprc-fittings", description: "50MM Female Threaded Adaptor (FTA) for connecting PPRC piping to threaded components.", specs: { Size: "50MM", Material: "PPRC + Brass Insert", Type: "Female Threaded Adaptor (FTA)", Connection: "Fusion + Threaded" }, apps: ["Threaded Connection", "Equipment Interface", "System Integration"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (1).jpeg", isNew: true },
      { slug: "pprc-tank-nipple", name: "PPRC Tank Nipple", catSlug: "pprc-fittings", description: "PPRC tank nipple for connecting piping systems to tanks and vessels.", specs: { Material: "PPRC", Type: "Tank Nipple", Seal: "Waterproof" }, apps: ["Tank Connection", "Vessel Interface", "Water Storage"], image: "/images/projects/WhatsApp Image 2026-04-17 at 12.17.20 PM (2).jpeg", isNew: true },
    ];

    for (const p of productData) {
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: {},
        create: {
          slug: p.slug,
          name: p.name,
          sku: `${p.slug}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, ""),
          description: p.description,
          specifications: JSON.stringify(p.specs),
          applications: JSON.stringify(p.apps),
          image: p.image,
          isNewArrival: "isNew" in p ? p.isNew : false,
          isFeatured: "featured" in p ? p.featured : false,
          categoryId: categories[p.catSlug],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: {
        categories: categoryData.length,
        products: productData.length,
      },
    });
  } catch (error) {
    logServerError("api.seed.POST", error);
    return jsonError("Seed failed.", 500);
  }
}
