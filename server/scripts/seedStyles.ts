import { db } from "../db";
import { designStyles, roomTypes } from "../../shared/schema";
import type { InsertDesignStyle, InsertRoomType } from "../../shared/schema";

/**
 * Seed Design Styles
 * 10 styles covering free, basic, and professional tiers
 */
const stylesToSeed: InsertDesignStyle[] = [
  // Free Tier Styles (4 styles)
  {
    name: "Modern Minimalist",
    description: "Clean lines, neutral colors, and functional furniture. Less is more with an emphasis on simplicity and form.",
    tier: "free",
    thumbnailUrl: "/images/styles/modern-minimalist.jpg",
    promptModifiers: [
      "clean lines",
      "neutral color palette",
      "minimal decor",
      "functional furniture",
      "open space",
      "natural light",
    ],
    isActive: true,
  },
  {
    name: "Scandinavian",
    description: "Light, airy spaces with natural wood, white walls, and cozy textiles. Nordic simplicity meets warmth.",
    tier: "free",
    thumbnailUrl: "/images/styles/scandinavian.jpg",
    promptModifiers: [
      "light wood furniture",
      "white walls",
      "natural textures",
      "hygge atmosphere",
      "plants",
      "simple patterns",
    ],
    isActive: true,
  },
  {
    name: "Industrial",
    description: "Exposed brick, metal fixtures, and raw materials. Urban loft aesthetic with vintage charm.",
    tier: "free",
    thumbnailUrl: "/images/styles/industrial.jpg",
    promptModifiers: [
      "exposed brick",
      "metal accents",
      "concrete floors",
      "Edison bulbs",
      "leather furniture",
      "vintage elements",
    ],
    isActive: true,
  },
  {
    name: "Traditional",
    description: "Classic elegance with ornate details, rich colors, and timeless furniture pieces.",
    tier: "free",
    thumbnailUrl: "/images/styles/traditional.jpg",
    promptModifiers: [
      "ornate details",
      "rich colors",
      "classic furniture",
      "decorative molding",
      "symmetry",
      "layered textiles",
    ],
    isActive: true,
  },

  // Basic Tier Styles (4 styles)
  {
    name: "Bohemian",
    description: "Eclectic mix of patterns, textures, and colors. Free-spirited with global influences and vintage finds.",
    tier: "basic",
    thumbnailUrl: "/images/styles/bohemian.jpg",
    promptModifiers: [
      "mixed patterns",
      "vibrant colors",
      "layered textiles",
      "plants and greenery",
      "vintage pieces",
      "global influences",
    ],
    isActive: true,
  },
  {
    name: "Mid-Century Modern",
    description: "1950s-60s inspired design with organic curves, tapered legs, and iconic furniture pieces.",
    tier: "basic",
    thumbnailUrl: "/images/styles/mid-century-modern.jpg",
    promptModifiers: [
      "organic shapes",
      "tapered legs",
      "warm wood tones",
      "iconic furniture",
      "geometric patterns",
      "retro colors",
    ],
    isActive: true,
  },
  {
    name: "Coastal",
    description: "Beach-inspired with light blues, sandy neutrals, and natural materials. Relaxed and breezy atmosphere.",
    tier: "basic",
    thumbnailUrl: "/images/styles/coastal.jpg",
    promptModifiers: [
      "light blue accents",
      "sandy neutrals",
      "natural fibers",
      "nautical elements",
      "whitewashed wood",
      "airy fabrics",
    ],
    isActive: true,
  },
  {
    name: "Farmhouse",
    description: "Rustic charm with distressed wood, vintage accents, and a cozy, lived-in feel.",
    tier: "basic",
    thumbnailUrl: "/images/styles/farmhouse.jpg",
    promptModifiers: [
      "distressed wood",
      "shiplap walls",
      "vintage accessories",
      "neutral palette",
      "cozy textiles",
      "rustic elements",
    ],
    isActive: true,
  },

  // Professional Tier Styles (2 styles)
  {
    name: "Contemporary Luxury",
    description: "High-end modern design with premium materials, statement pieces, and sophisticated color palettes.",
    tier: "professional",
    thumbnailUrl: "/images/styles/contemporary-luxury.jpg",
    promptModifiers: [
      "premium materials",
      "statement lighting",
      "sophisticated palette",
      "custom furniture",
      "architectural details",
      "designer pieces",
    ],
    isActive: true,
  },
  {
    name: "Japanese Zen",
    description: "Minimalist tranquility with natural materials, low furniture, and a connection to nature.",
    tier: "professional",
    thumbnailUrl: "/images/styles/japanese-zen.jpg",
    promptModifiers: [
      "natural materials",
      "low furniture",
      "sliding screens",
      "neutral tones",
      "minimal decor",
      "indoor plants",
      "tatami mats",
    ],
    isActive: true,
  },
];

/**
 * Seed Room Types
 * 8 common room types
 */
const roomTypesToSeed: InsertRoomType[] = [
  {
    name: "Living Room",
    description: "Main gathering space for relaxation and entertainment",
    iconName: "sofa",
    promptContext:
      "Spacious living area with comfortable seating, coffee table, and entertainment center. Well-lit with both natural and ambient lighting.",
    isActive: true,
  },
  {
    name: "Bedroom",
    description: "Personal sanctuary for rest and relaxation",
    iconName: "bed",
    promptContext:
      "Peaceful bedroom with a comfortable bed as focal point, nightstands, and soft lighting. Creates a calm, restful atmosphere.",
    isActive: true,
  },
  {
    name: "Kitchen",
    description: "Functional cooking and dining preparation space",
    iconName: "chef-hat",
    promptContext:
      "Modern kitchen with cabinets, countertops, appliances, and island or dining area. Functional layout with good lighting.",
    isActive: true,
  },
  {
    name: "Bathroom",
    description: "Personal care and relaxation space",
    iconName: "bath",
    promptContext:
      "Clean, modern bathroom with vanity, shower or bathtub, and storage. Bright, spa-like atmosphere with quality finishes.",
    isActive: true,
  },
  {
    name: "Dining Room",
    description: "Dedicated space for meals and gatherings",
    iconName: "utensils",
    promptContext:
      "Elegant dining area with table, chairs, and statement lighting. Accommodates family meals and entertaining guests.",
    isActive: true,
  },
  {
    name: "Home Office",
    description: "Productive workspace for remote work and study",
    iconName: "desk",
    promptContext:
      "Functional office with desk, ergonomic chair, storage, and good lighting. Professional yet comfortable atmosphere.",
    isActive: true,
  },
  {
    name: "Kids Room",
    description: "Playful and functional space for children",
    iconName: "baby",
    promptContext:
      "Colorful, fun children's room with bed, play area, and storage. Safe, stimulating environment for play and rest.",
    isActive: true,
  },
  {
    name: "Outdoor Patio",
    description: "Exterior living space for relaxation and entertaining",
    iconName: "sun",
    promptContext:
      "Inviting outdoor space with seating, dining area, and landscaping. Comfortable atmosphere for outdoor living.",
    isActive: true,
  },
];

/**
 * Main seed function
 */
async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // Check if styles already exist
    const existingStyles = await db.select().from(designStyles).limit(1);
    if (existingStyles.length > 0) {
      console.log("⚠️  Database already seeded. Skipping...");
      console.log("   To re-seed, manually delete existing records first.");
      return;
    }

    // Seed design styles
    console.log("📝 Seeding design styles...");
    const insertedStyles = await db.insert(designStyles).values(stylesToSeed).returning();
    console.log(`✅ Inserted ${insertedStyles.length} design styles`);

    // Seed room types
    console.log("📝 Seeding room types...");
    const insertedRoomTypes = await db.insert(roomTypes).values(roomTypesToSeed).returning();
    console.log(`✅ Inserted ${insertedRoomTypes.length} room types`);

    console.log("\n🎉 Database seed completed successfully!");
    console.log("\nSeeded Data Summary:");
    console.log(`  - Design Styles: ${insertedStyles.length}`);
    console.log(`    - Free tier: ${insertedStyles.filter((s) => s.tier === "free").length}`);
    console.log(`    - Basic tier: ${insertedStyles.filter((s) => s.tier === "basic").length}`);
    console.log(
      `    - Professional tier: ${insertedStyles.filter((s) => s.tier === "professional").length}`
    );
    console.log(`  - Room Types: ${insertedRoomTypes.length}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("\n✅ Seed script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Seed script failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
