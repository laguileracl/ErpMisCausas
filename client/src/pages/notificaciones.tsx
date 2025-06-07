import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Settings, Mail, Smartphone, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreference {
  id: number;
  userId: number;
  notificationType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  daysBeforeDue?: number;
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  isRead: boolean;
  isEmailSent: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  readAt?: string;
}

export default function NotificacionesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get notification preferences
  const { data: preferences = [], isLoading: preferencesLoading } = useQuery({
    queryKey: ["/api/notification-preferences"],
  });

  // Get all notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: ({ type, data }: { type: string; data: Partial<NotificationPreference> }) =>
      apiRequest(`/api/notification-preferences/${type}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
      toast({
        title: "Preferencias actualizadas",
        description: "Las preferencias de notificación se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las preferencias.",
        variant: "destructive",
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/notifications/read-all", {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificaciones marcadas",
        description: "Todas las notificaciones han sido marcadas como leídas.",
      });
    },
  });

  const getPreferenceByType = (type: string) => {
    return preferences.find((p: NotificationPreference) => p.notificationType === type);
  };

  const updatePreference = (type: string, field: keyof NotificationPreference, value: any) => {
    const currentPref = getPreferenceByType(type);
    updatePreferencesMutation.mutate({
      type,
      data: { [field]: value },
    });
  };

  const notificationTypes = [
    {
      type: "task_due",
      title: "Tareas próximas a vencer",
      description: "Recordatorios de tareas que están por vencer",
      icon: Clock,
      supportsDays: true,
    },
    {
      type: "case_update",
      title: "Actualizaciones de causas",
      description: "Cambios en el estado de las causas asignadas",
      icon: Bell,
      supportsDays: false,
    },
    {
      type: "activity_added",
      title: "Nuevas actividades",
      description: "Actividades agregadas a las causas en las que participas",
      icon: CheckCircle,
      supportsDays: false,
    },
    {
      type: "document_uploaded",
      title: "Documentos subidos",
      description: "Nuevos documentos agregados a las causas",
      icon: Settings,
      supportsDays: false,
    },
  ];

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Ahora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-500 bg-red-50 dark:bg-red-950";
      case "high":
        return "border-orange-500 bg-orange-50 dark:bg-orange-950";
      case "normal":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950";
      case "low":
        return "border-gray-500 bg-gray-50 dark:bg-gray-950";
      default:
        return "border-gray-500 bg-gray-50 dark:bg-gray-950";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona tus notificaciones y preferencias de alertas
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Todas las notificaciones</CardTitle>
                  <CardDescription>
                    {notifications.length} notificaciones, {unreadCount} sin leer
                  </CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar todas como leídas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {notificationsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando notificaciones...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay notificaciones
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification: Notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          !notification.isRead
                            ? getPriorityColor(notification.priority)
                            : "border-gray-200 bg-gray-50 dark:bg-gray-900"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              )}
                              {notification.priority !== "normal" && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.priority === "urgent" && "Urgente"}
                                  {notification.priority === "high" && "Alta"}
                                  {notification.priority === "low" && "Baja"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Tipo: {notification.type}</span>
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                              {notification.isEmailSent && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  Email enviado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de notificaciones</CardTitle>
              <CardDescription>
                Personaliza qué notificaciones deseas recibir y cómo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preferencesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando preferencias...
                </div>
              ) : (
                <div className="space-y-6">
                  {notificationTypes.map(({ type, title, description, icon: Icon, supportsDays }) => {
                    const preference = getPreferenceByType(type);
                    
                    return (
                      <div key={type} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-medium">{title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {description}
                            </p>
                            
                            <div className="space-y-3">
                              {/* In-app notifications toggle */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                                  <Label htmlFor={`${type}-inapp`}>
                                    Notificaciones en la aplicación
                                  </Label>
                                </div>
                                <Switch
                                  id={`${type}-inapp`}
                                  checked={preference?.inAppEnabled ?? true}
                                  onCheckedChange={(checked) =>
                                    updatePreference(type, "inAppEnabled", checked)
                                  }
                                  disabled={updatePreferencesMutation.isPending}
                                />
                              </div>

                              {/* Email notifications toggle */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <Label htmlFor={`${type}-email`}>
                                    Notificaciones por email
                                  </Label>
                                </div>
                                <Switch
                                  id={`${type}-email`}
                                  checked={preference?.emailEnabled ?? false}
                                  onCheckedChange={(checked) =>
                                    updatePreference(type, "emailEnabled", checked)
                                  }
                                  disabled={updatePreferencesMutation.isPending}
                                />
                              </div>

                              {/* Days before due (only for task_due) */}
                              {supportsDays && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Label htmlFor={`${type}-days`}>
                                      Días de anticipación
                                    </Label>
                                  </div>
                                  <Input
                                    id={`${type}-days`}
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={preference?.daysBeforeDue ?? 3}
                                    onChange={(e) =>
                                      updatePreference(type, "daysBeforeDue", parseInt(e.target.value))
                                    }
                                    className="w-20"
                                    disabled={updatePreferencesMutation.isPending}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}