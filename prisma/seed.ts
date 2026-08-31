import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.inquiry.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: "manager@n5deal.demo",
      name: "Olena Marchenko",
      companyName: "N5Deal",
      role: "MANAGER",
    },
  });

  const sellers = await Promise.all(
    [
      ["Andrii Kovalenko", "Vertex Holding", "ACTIVE"],
      ["Maria Bondar", "Bondar Capital", "ACTIVE"],
      ["Taras Shevchuk", "Dnipro Industrial Group", "ACTIVE"],
      ["Iryna Lysenko", "Lysenko & Partners", "ACTIVE"],
      ["Serhii Danylko", "Quickflip Assets", "SUSPENDED"],
    ].map(([name, companyName, status], i) =>
      prisma.user.create({
        data: {
          email: `seller${i + 1}@n5deal.demo`,
          name,
          companyName,
          role: "SELLER",
          status: status as "ACTIVE" | "SUSPENDED",
          suspensionReason:
            status === "SUSPENDED"
              ? "Repeated listings with unverifiable financials"
              : null,
          statusChangedAt: status === "SUSPENDED" ? new Date() : null,
        },
      })
    )
  );

  const assets = [
    ["B2B SaaS platform for logistics", "TECHNOLOGY", "MAJORITY_STAKE", "UKRAINE", 2_400_000, 890_000, 240_000, 60],
    ["Regional cold storage network", "LOGISTICS", "FULL_ACQUISITION", "UKRAINE", 5_800_000, 2_100_000, 640_000, 100],
    ["Private dental clinic chain", "HEALTHCARE", "FULL_ACQUISITION", "EUROPE", 3_200_000, 1_450_000, 410_000, 100],
    ["Organic dairy producer", "AGRICULTURE", "MAJORITY_STAKE", "UKRAINE", 1_900_000, 980_000, null, 75],
    ["E-commerce home goods brand", "RETAIL", "FULL_ACQUISITION", "EUROPE", 850_000, 1_200_000, 190_000, 100],
    ["Solar farm, 12 MW", "ENERGY", "ASSET_PURCHASE", "EUROPE", 9_500_000, null, null, null],
    ["Precision metal components plant", "MANUFACTURING", "MAJORITY_STAKE", "UKRAINE", 4_100_000, 3_300_000, 720_000, 51],
    ["Payment processing startup", "FINANCIAL_SERVICES", "MINORITY_STAKE", "UK", 6_000_000, 1_100_000, null, 25],
    ["Last-mile delivery operator", "LOGISTICS", "FULL_ACQUISITION", "UKRAINE", 2_750_000, 1_800_000, 320_000, 100],
    ["Specialty coffee roastery", "RETAIL", "FULL_ACQUISITION", "EUROPE", 640_000, 720_000, 145_000, 100],
    ["Medical laboratory network", "HEALTHCARE", "MAJORITY_STAKE", "UKRAINE", 3_900_000, 2_400_000, 580_000, 70],
    ["Packaging materials factory", "MANUFACTURING", "FULL_ACQUISITION", "UKRAINE", 7_200_000, 5_100_000, 1_150_000, 100],
    ["HR tech platform", "TECHNOLOGY", "MINORITY_STAKE", "NORTH_AMERICA", 12_000_000, 2_800_000, null, 20],
    ["Grain elevator complex", "AGRICULTURE", "ASSET_PURCHASE", "UKRAINE", 4_600_000, null, null, null],
    ["Fintech lending portfolio", "FINANCIAL_SERVICES", "ASSET_PURCHASE", "MIDDLE_EAST", 15_000_000, 3_600_000, 890_000, null],
  ];

  await Promise.all(
    assets.map(([title, industry, dealType, region, price, revenue, ebitda, stake], i) =>
      prisma.asset.create({
        data: {
          sellerId: sellers[i % sellers.length].id,
          title: title as string,
          description: `${title}. Established operations with documented financials. Owner is exiting to focus on other ventures. Full data room available after NDA.`,
          industry: industry as never,
          dealType: dealType as never,
          region: region as never,
          askingPrice: price as number,
          annualRevenue: revenue as number | null,
          ebitda: ebitda as number | null,
          stakePercent: stake as number | null,
          status: i === 4 ? "SUSPENDED" : "PUBLISHED",
          suspensionReason: i === 4 ? "Asking price inconsistent with disclosed revenue" : null,
          statusChangedAt: i === 4 ? new Date() : null,
        },
      })
    )
  );

  const buyers = [
    ["Viktor Hrytsenko", "Hrytsenko Family Office", "Buy-and-hold investor in Ukrainian industrials", ["MANUFACTURING", "LOGISTICS"], ["FULL_ACQUISITION", "MAJORITY_STAKE"], ["UKRAINE"], 1_000_000, 8_000_000, "ACTIVE"],
    ["Anna Melnyk", "Melnyk Ventures", "Early-stage tech, minority positions only", ["TECHNOLOGY"], ["MINORITY_STAKE"], ["UKRAINE", "EUROPE"], 500_000, 3_000_000, "ACTIVE"],
    ["Pavlo Rudenko", "Agrimax", "Consolidating agricultural assets", ["AGRICULTURE"], ["FULL_ACQUISITION", "ASSET_PURCHASE"], ["UKRAINE"], 2_000_000, 12_000_000, "ACTIVE"],
    ["Sofia Kravets", "Northline Capital", "Healthcare roll-up strategy across CEE", ["HEALTHCARE"], ["MAJORITY_STAKE", "FULL_ACQUISITION"], ["UKRAINE", "EUROPE"], 3_000_000, 20_000_000, "ACTIVE"],
    ["Dmytro Savchenko", null, "First-time buyer looking for a small retail business", ["RETAIL"], ["FULL_ACQUISITION"], ["EUROPE"], 200_000, 1_000_000, "ACTIVE"],
    ["Kateryna Boiko", "Boiko Energy", "Renewables and grid infrastructure", ["ENERGY"], ["ASSET_PURCHASE", "MAJORITY_STAKE"], ["EUROPE", "MIDDLE_EAST"], 5_000_000, 40_000_000, "ACTIVE"],
    ["Oleh Tkachenko", "Meridian PE", "Mid-market buyouts, cash-generative only", ["MANUFACTURING", "LOGISTICS", "RETAIL"], ["FULL_ACQUISITION"], ["UKRAINE", "EUROPE", "UK"], 2_000_000, 15_000_000, "ACTIVE"],
    ["Nataliia Zhuk", "Zhuk Capital", "Fintech and payments infrastructure", ["FINANCIAL_SERVICES", "TECHNOLOGY"], ["MINORITY_STAKE", "MAJORITY_STAKE"], ["UK", "NORTH_AMERICA"], 1_000_000, 10_000_000, "ACTIVE"],
    ["Roman Petriv", "Petriv Group", "Opportunistic, wide mandate", ["MANUFACTURING", "ENERGY", "AGRICULTURE"], ["FULL_ACQUISITION", "MAJORITY_STAKE", "ASSET_PURCHASE"], ["UKRAINE"], 500_000, 25_000_000, "ACTIVE"],
    ["Yurii Havryliuk", null, "Undisclosed mandate", ["TECHNOLOGY"], ["FULL_ACQUISITION"], ["UKRAINE"], 100_000, 500_000, "SUSPENDED"],
  ];

  for (const [name, companyName, headline, industries, dealTypes, regions, min, max, status] of buyers) {
    await prisma.user.create({
      data: {
        email: `${(name as string).split(" ")[0].toLowerCase()}@n5deal.demo`,
        name: name as string,
        companyName: companyName as string | null,
        role: "BUYER",
        status: status as "ACTIVE" | "SUSPENDED",
        suspensionReason:
          status === "SUSPENDED" ? "Unresponsive after multiple accepted introductions" : null,
        statusChangedAt: status === "SUSPENDED" ? new Date() : null,
        buyerProfile: {
          create: {
            headline: headline as string,
            description: `${headline}. Decisions within 4-6 weeks. Prefers sellers with clean reporting and a clear reason for exit.`,
            industries: industries as never,
            dealTypes: dealTypes as never,
            regions: regions as never,
            budgetMin: min as number,
            budgetMax: max as number,
          },
        },
      },
    });
  }

  console.log("Seeded:", {
    users: await prisma.user.count(),
    assets: await prisma.asset.count(),
    profiles: await prisma.buyerProfile.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());