import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UrgentTasks } from "@/components/dashboard/urgent-tasks";
import { RecentCases } from "@/components/dashboard/recent-cases";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SystemStatus } from "@/components/dashboard/system-status";
import { NewCaseModal } from "@/components/modals/new-case-modal";
import { useState } from "react";

export default function Dashboard() {
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Sidebar />
      
      <div className="ml-64">
        <TopBar onNewCase={() => setIsNewCaseModalOpen(true)} />
        
        <main className="p-6 space-y-6">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <UrgentTasks />
              <RecentCases />
            </div>
            
            <div className="space-y-6">
              <MiniCalendar />
              <QuickActions onNewCase={() => setIsNewCaseModalOpen(true)} />
              <SystemStatus />
            </div>
          </div>
        </main>
      </div>

      <NewCaseModal 
        isOpen={isNewCaseModalOpen} 
        onClose={() => setIsNewCaseModalOpen(false)} 
      />
    </div>
  );
}
