"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Folder, FolderOpen, RefreshCw } from "lucide-react";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  modified?: string;
}

export function FileTree() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fred/files");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const selectFile = (path: string) => {
    setSelectedFile(path);
    // TODO: Open file editor
    window.open(`/api/fred/files/${encodeURIComponent(path)}`, "_blank");
  };

  const renderNode = (node: FileNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile === node.path;
    const paddingLeft = depth * 16;

    if (node.type === "directory") {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleDir(node.path)}
            className={`w-full flex items-center gap-2 py-1 px-2 hover:bg-accent rounded text-left transition-colors ${
              isSelected ? "bg-accent" : ""
            }`}
            style={{ paddingLeft: `${paddingLeft + 8}px` }}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-500" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-sm font-medium">{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={node.path}
        onClick={() => selectFile(node.path)}
        className={`w-full flex items-center gap-2 py-1 px-2 hover:bg-accent rounded text-left transition-colors ${
          isSelected ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <FileText className="h-4 w-4 text-blue-500" />
        <span className="text-sm">{node.name}</span>
        {node.size && (
          <span className="text-xs text-muted-foreground ml-auto">
            {(node.size / 1024).toFixed(1)} KB
          </span>
        )}
      </button>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">📁 Workspace Files</CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchFiles} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((node) => renderNode(node))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
