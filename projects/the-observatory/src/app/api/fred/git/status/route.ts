import { NextResponse } from "next/server";
import { execSync } from "child_process";

const WORKSPACE_ROOT = "/Users/jakobbakken/clawd-fresh";

export async function GET() {
  try {
    // Get git status
    const statusOutput = execSync("git status --porcelain", {
      cwd: WORKSPACE_ROOT,
      encoding: "utf-8",
    });
    
    // Get last commit
    let lastCommit = "Unknown";
    try {
      lastCommit = execSync("git log -1 --format=%h", {
        cwd: WORKSPACE_ROOT,
        encoding: "utf-8",
      }).trim();
    } catch {
      // No commits yet
    }
    
    // Get current branch
    let branch = "main";
    try {
      branch = execSync("git branch --show-current", {
        cwd: WORKSPACE_ROOT,
        encoding: "utf-8",
      }).trim();
    } catch {
      // Not on a branch
    }
    
    const isClean = statusOutput.trim() === "";
    const changedFiles = statusOutput
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.slice(3)); // Remove status prefix
    
    return NextResponse.json({
      clean: isClean,
      branch,
      lastCommit,
      changedFiles,
      changedCount: changedFiles.length,
    });
  } catch (error) {
    console.error("Error getting git status:", error);
    return NextResponse.json(
      { 
        clean: true, // Assume clean on error
        branch: "unknown",
        lastCommit: "unknown",
        changedFiles: [],
        changedCount: 0,
        error: "Failed to get git status",
      },
      { status: 500 }
    );
  }
}
