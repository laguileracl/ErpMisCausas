import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building, FileText, Clock, AlertTriangle, Gavel, TrendingUp, Plus, Upload, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
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
