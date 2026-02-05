import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const WORKSPACE_ROOT = "/Users/jakobbakken/clawd-fresh";

// Helper to validate path is within workspace
function validatePath(relativePath: string): string | null {
  // Normalize the path
  const normalizedPath = path.normalize(relativePath);
  
  // Check for path traversal attacks
  if (normalizedPath.startsWith("..") || normalizedPath.includes("/../")) {
    return null;
  }
  
  // Ensure file is .md
  if (!normalizedPath.endsWith(".md")) {
    return null;
  }
  
  return normalizedPath;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const relativePath = pathSegments.join("/");
    const safePath = validatePath(relativePath);
    
    if (!safePath) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }
    
    const fullPath = path.join(WORKSPACE_ROOT, safePath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    const content = await fs.readFile(fullPath, "utf-8");
    const stats = await fs.stat(fullPath);
    
    return NextResponse.json({
      path: safePath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const relativePath = pathSegments.join("/");
    const safePath = validatePath(relativePath);
    
    if (!safePath) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }
    
    const { content } = await request.json();
    
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }
    
    const fullPath = path.join(WORKSPACE_ROOT, safePath);
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content, "utf-8");
    
    return NextResponse.json({
      success: true,
      path: safePath,
      message: "File saved successfully",
    });
  } catch (error) {
    console.error("Error writing file:", error);
    return NextResponse.json(
      { error: "Failed to write file" },
      { status: 500 }
    );
  }
}
