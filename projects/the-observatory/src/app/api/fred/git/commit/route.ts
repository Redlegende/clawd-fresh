import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

const WORKSPACE_ROOT = "/Users/jakobbakken/clawd-fresh";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const commitMessage = message || `Manual commit from Fred Control Panel - ${new Date().toISOString()}`;
    
    // Add all changes
    execSync("git add -A", {
      cwd: WORKSPACE_ROOT,
      encoding: "utf-8",
    });
    
    // Check if there are changes to commit
    const statusOutput = execSync("git status --porcelain", {
      cwd: WORKSPACE_ROOT,
      encoding: "utf-8",
    });
    
    if (statusOutput.trim() === "") {
      return NextResponse.json({
        success: false,
        message: "No changes to commit",
      });
    }
    
    // Commit
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      cwd: WORKSPACE_ROOT,
      encoding: "utf-8",
    });
    
    // Push
    try {
      execSync("git push", {
        cwd: WORKSPACE_ROOT,
        encoding: "utf-8",
      });
    } catch (pushError) {
      console.log("Push may have failed or no remote configured:", pushError);
    }
    
    return NextResponse.json({
      success: true,
      message: commitMessage,
    });
  } catch (error) {
    console.error("Error committing:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to commit",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
