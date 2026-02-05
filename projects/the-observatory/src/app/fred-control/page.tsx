import { Metadata } from "next";
import { FileTree } from "./components/FileTree";
import { StatusPanel } from "./components/StatusPanel";
import { QuickActions } from "./components/QuickActions";

export const metadata: Metadata = {
  title: "Fred Control Panel | Observatory",
  description: "Manage Fred's workspace files and configuration",
};

export default function FredControlPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🎛️ Fred Control Panel</h1>
        <p className="text-muted-foreground mt-1">
          Manage workspace files, configuration, and system status
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - File Tree */}
        <div className="lg:col-span-1">
          <FileTree />
        </div>

        {/* Right side - Status and Actions */}
        <div className="lg:col-span-2 space-y-6">
          <StatusPanel />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
