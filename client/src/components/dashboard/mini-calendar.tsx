import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentMonth = currentDate.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const hasEvent = (day: number | null) => {
    // Mock events for demonstration
    return day === 15 || day === 22;
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-secondary-900">
          Calendario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="p-1 text-secondary-400 hover:text-secondary-600"
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            <h4 className="text-sm font-semibold text-secondary-900">
              {capitalizeFirst(currentMonth)}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              className="p-1 text-secondary-400 hover:text-secondary-600"
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-secondary-500 mb-2">
          <div>Dom</div>
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-sm">
          {days.map((day, index) => (
            <div
              key={index}
              className={`p-2 text-center cursor-pointer rounded relative ${
                day === null
                  ? "text-transparent"
                  : isToday(day)
                  ? "text-white bg-primary-500 font-medium"
                  : "text-secondary-900 hover:bg-gray-100"
              }`}
            >
              {day}
              {hasEvent(day) && (
                <div
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                    day === 15 ? "bg-red-500" : "bg-yellow-500"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary-500 hover:text-primary-600 font-medium"
          >
            Ver calendario completo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
