import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const WORKSPACE_ROOT = "/Users/jakobbakken/clawd-fresh";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  modified?: string;
}

async function scanDirectory(dirPath: string, relativePath: string = ""): Promise<FileNode[]> {
  const nodes: FileNode[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip hidden files, node_modules, etc.
      if (entry.name.startsWith(".") || 
          entry.name === "node_modules" || 
          entry.name === ".git" ||
          entry.name === ".next" ||
          entry.name === "venv" ||
          entry.name === "__pycache__") {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        const children = await scanDirectory(fullPath, entryRelativePath);
        // Only add directory if it has children or we want empty dirs
        nodes.push({
          name: entry.name,
          path: entryRelativePath,
          type: "directory",
          children: children.length > 0 ? children : undefined,
        });
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const stats = await fs.stat(fullPath);
        nodes.push({
          name: entry.name,
          path: entryRelativePath,
          type: "file",
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error);
  }
  
  return nodes.sort((a, b) => {
    // Directories first, then alphabetical
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET() {
  try {
    // Get root-level MD files
    const rootEntries = await fs.readdir(WORKSPACE_ROOT, { withFileTypes: true });
    const rootFiles: FileNode[] = [];
    
    for (const entry of rootEntries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const fullPath = path.join(WORKSPACE_ROOT, entry.name);
        const stats = await fs.stat(fullPath);
        rootFiles.push({
          name: entry.name,
          path: entry.name,
          type: "file",
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
      }
    }
    
    // Get key directories
    const keyDirs = ["memory", "projects", "skills", "research"];
    const directories: FileNode[] = [];
    
    for (const dirName of keyDirs) {
      const dirPath = path.join(WORKSPACE_ROOT, dirName);
      try {
        const children = await scanDirectory(dirPath, dirName);
        if (children.length > 0) {
          directories.push({
            name: dirName,
            path: dirName,
            type: "directory",
            children,
          });
        }
      } catch (error) {
        // Directory might not exist
        console.log(`Directory ${dirName} not found or error scanning`);
      }
    }
    
    const files = [...rootFiles, ...directories].sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files", files: [] },
      { status: 500 }
    );
  }
}
