import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const db = tursoUrl ? createClient({
  url: tursoUrl,
  authToken: tursoToken,
}) : null;

async function initDb() {
  if (!db) {
    throw new Error("TURSO_DATABASE_URL is not set.");
  }
  await db.execute(`
    CREATE TABLE IF NOT EXISTS likes (
      slug TEXT PRIMARY KEY,
      likes_count INTEGER DEFAULT 0
    )
  `);
}
async function getLikesMap(): Promise<Record<string, number>> {
  await initDb();
  const res = await db!.execute("SELECT slug, likes_count FROM likes");
  const map: Record<string, number> = {};
  for (const row of res.rows) {
    map[row.slug as string] = Number(row.likes_count);
  }
  return map;
}

async function saveLikesMap(data: Record<string, number>) {
  await initDb();
  for (const [slug, count] of Object.entries(data)) {
    await db!.execute({
      sql: `INSERT INTO likes (slug, likes_count) VALUES (?, ?)
            ON CONFLICT(slug) DO UPDATE SET likes_count = excluded.likes_count`,
      args: [slug, count]
    });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const likesMap = await getLikesMap();

    if (slug) {
      return NextResponse.json({ slug, likes: likesMap[slug] || 0 });
    }

    return NextResponse.json(likesMap);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, action } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required." },
        { status: 400 }
      );
    }

    if (action !== "like" && action !== "unlike") {
      return NextResponse.json(
        { error: "Action must be 'like' or 'unlike'." },
        { status: 400 }
      );
    }

    const likesMap = await getLikesMap();
    const currentLikes = likesMap[slug] || 0;

    let newLikes = currentLikes;
    if (action === "like") {
      newLikes = currentLikes + 1;
    } else if (action === "unlike") {
      newLikes = Math.max(0, currentLikes - 1);
    }

    likesMap[slug] = newLikes;
    await saveLikesMap(likesMap);

    return NextResponse.json({ slug, likes: newLikes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update like counter." },
      { status: 500 }
    );
  }
}
