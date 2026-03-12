
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { scrapeCaseNews } from "@/lib/newsScraper";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { caseId } = await req.json();

    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }

    // 1. Fetch case keywords (title + entities)
    const currentCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        nodes: {
          where: {
            type: {
              in: ["ENTITY_PERSON", "ENTITY_ORG"]
            }
          }
        }
      }
    });

    if (!currentCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Construct keywords: Case Title + Entity Labels
    const keywords = [
      currentCase.title,
      ...currentCase.nodes.map(n => n.label)
    ].filter((v, i, a) => a.indexOf(v) === i); // Unique only

    console.log(`[API] Fetching intelligence for case: "${currentCase.title}" (${caseId})`);
    console.log(`[API] Extracted keywords: ${keywords.join(', ')}`);

    // 2. Scrape news
    const scrapedNews = await scrapeCaseNews(keywords);
    console.log(`[API] Ingested ${scrapedNews.length} news items from signal feed.`);

    // 3. Store in database (Upsert based on URL to avoid duplicates)
    if (scrapedNews.length > 0) {
      for (const item of scrapedNews) {
        // Use a deterministic ID based on URL to prevent duplicates without unique constraint
        const newsId = Buffer.from(item.url).toString('base64').slice(0, 30);
        
        await prisma.news.upsert({
          where: { id: newsId },
          update: {
            summary: item.summary,
            publishedAt: item.publishedAt,
            imageUrl: item.imageUrl,
            sentiment: 0,
          } as any,
          create: {
            id: newsId,
            caseId: currentCase.id,
            title: item.title,
            summary: item.summary,
            source: item.source,
            url: item.url,
            imageUrl: item.imageUrl,
            publishedAt: item.publishedAt,
            sentiment: 0
          } as any
        });
      }
    }

    // 4. Return latest 20 articles
    const latestNews = await prisma.news.findMany({
      where: { caseId },
      orderBy: { publishedAt: "desc" },
      take: 20
    });

    return NextResponse.json(latestNews);
  } catch (error) {
    console.error("API News Feed Error:", error);
    return NextResponse.json({ error: "Failed to process news feed" }, { status: 500 });
  }
}
