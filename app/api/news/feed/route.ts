import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeCaseNews } from "@/lib/newsScraper";

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
              in: ["ENTITY_PERSON", "ENTITY_ORG", "ENTITY_LOCATION"]
            }
          },
          take: 10
        }
      }
    });

    if (!currentCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Construct keywords: Case Title + short Entity Labels (< 40 chars)
    const keywords = [
      currentCase.title,
      ...currentCase.nodes
        .map(n => n.label)
        .filter(label => label.length > 2 && label.length < 40)
    ].filter((v, i, a) => a.indexOf(v) === i); 

    console.log(`[API] Fetching intelligence for case: "${currentCase.title}" (${caseId})`);
    console.log(`[API] Refined keywords: ${keywords.join(', ')}`);

    // 2. Scrape news
    const scrapedNews = await scrapeCaseNews(keywords);
    console.log(`[API] Ingested ${scrapedNews.length} news items from signal feed.`);

    // 3. Store in database (Upsert based on CaseID + URL to allow same article in different cases)
    if (scrapedNews.length > 0) {
      for (const item of scrapedNews) {
        // Deterministic ID derived from CaseID and URL Hash
        const urlHash = Buffer.from(item.url).toString('base64').slice(-20);
        const newsId = `news-${caseId.slice(0, 8)}-${urlHash}`;
        
        await prisma.news.upsert({
          where: { id: newsId },
          update: {
            summary: item.summary,
            publishedAt: item.publishedAt,
            imageUrl: item.imageUrl,
            sentiment: 0,
          },
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
          }
        });
      }
    }

    // 4. Return latest 20 articles for this specific case
    const latestNews = await prisma.news.findMany({
      where: { caseId },
      orderBy: { publishedAt: "desc" },
      take: 20
    });

    console.log(`[API] Returning ${latestNews.length} news items for UI.`);
    return NextResponse.json(latestNews);
  } catch (error) {
    console.error("API News Feed Error:", error);
    return NextResponse.json({ error: "Failed to process news feed" }, { status: 500 });
  }
}
