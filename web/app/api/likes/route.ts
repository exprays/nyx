import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "likes.json");

// Helper to safely load likes count
async function getLikesMap(): Promise<Record<string, number>> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const fileContent = await fs.readFile(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    return {};
  }
}

// Helper to safely write likes count
async function saveLikesMap(data: Record<string, number>) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
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
