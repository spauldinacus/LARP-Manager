import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Plus, MapPin, Clock, Menu, Eye, Edit } from "lucide-react";
import { insertEventSchema, insertEventRsvpSchema, type Event, type Character, type EventRsvp, type Chapter } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const eventFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string(),
  chapterId: z.string().min(1),
  createdBy: z.string().min(1),
});
const rsvpFormSchema = insertEventRsvpSchema.omit({ eventId: true, userId: true });

type EventFormData = z.infer<typeof eventFormSchema>;
type RsvpFormData = z.infer<typeof rsvpFormSchema>;

export default function EventsPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [isRsvpListModalOpen, setIsRsvpListModalOpen] = useState(false);
  const [isEditRsvpModalOpen, setIsEditRsvpModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRsvp, setSelectedRsvp] = useState<EventRsvp | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Load public character data for RSVP displays
  const { data: publicCharacters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters/public"],
    enabled: !!user,
  });

  // Load chapters for the chapter filter dropdown
  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/chapters"],
    enabled: !!user,
  });

  // Fetch RSVPs for all events at once
  const { data: allEventRsvps = {} } = useQuery({
    queryKey: ["/api/events/rsvps"],
    queryFn: async () => {
      const rsvpData: Record<string, EventRsvp[]> = {};
      
      // Fetch RSVPs for each event
      for (const event of events) {
        try {
          const response = await fetch(`/api/events/${event.id}/rsvps`);
          if (response.ok) {
            rsvpData[event.id] = await response.json();
          } else {
            rsvpData[event.id] = [];
          }
        } catch (error) {
          rsvpData[event.id] = [];
        }
      }
      
      return rsvpData;
    },
    enabled: events.length > 0,
  });

  // Function to get RSVP count for an event
  const getRsvpCount = (eventId: string) => {
    return allEventRsvps[eventId]?.length || 0;
  };

  // Function to get RSVP data for an event
  const getRsvpData = (eventId: string) => {
    return allEventRsvps[eventId] || [];
  };

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: (data: EventFormData) =>
      apiRequest("POST", "/api/events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsCreateModalOpen(false);
      createForm.reset();
      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Partial<Event> }) =>
      apiRequest("PATCH", `/api/events/${eventId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsEditEventModalOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const toggleEventStatusMutation = useMutation({
    mutationFn: ({ eventId, isActive }: { eventId: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/events/${eventId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event status updated",
        description: "The event status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Error",
        description: error.message || "Failed to update event status",
        variant: "destructive",
      });
    },
  });

  const createRsvpMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: RsvpFormData }) =>
      apiRequest("POST", `/api/events/${eventId}/rsvp`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/rsvps"] });
      setIsRsvpModalOpen(false);
      setSelectedEvent(null);
      rsvpForm.reset();
      toast({
        title: "RSVP created",
        description: "Your RSVP has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "RSVP Error",
        description: error.message || "Failed to create RSVP",
        variant: "destructive",
      });
    },
  });

  // Admin RSVP modification mutations
  const updateRsvpMutation = useMutation({
    mutationFn: ({ rsvpId, data }: { rsvpId: string; data: Partial<EventRsvp> }) =>
      apiRequest("PATCH", `/api/events/rsvps/${rsvpId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"], exact: false });
      toast({
        title: "RSVP Updated",
        description: "RSVP has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Error",
        description: error.message || "Failed to update RSVP",
        variant: "destructive",
      });
    },
  });

  const deleteRsvpMutation = useMutation({
    mutationFn: (rsvpId: string) =>
      apiRequest("DELETE", `/api/events/rsvps/${rsvpId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "RSVP Removed",
        description: "Character has been removed from the event.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Removal Error",
        description: error.message || "Failed to remove RSVP",
        variant: "destructive",
      });
    },
  });

  // Admin attendance marking mutation
  const markAttendanceMutation = useMutation({
    mutationFn: ({ rsvpId, attended }: { rsvpId: string; attended: boolean }) =>
      apiRequest("POST", `/api/events/rsvps/${rsvpId}/attendance`, { attended }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "Attendance Updated",
        description: "RSVP attendance has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Attendance Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive",
      });
    },
  });

  // Form configurations
  const createForm = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      eventDate: new Date().toISOString().slice(0, 16),
      chapterId: user?.chapterId || "",
      createdBy: user?.id || "",
    },
  });

  const rsvpForm = useForm({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: {
      characterId: "",
      xpPurchases: 0,
      xpCandlePurchases: 0,
    },
  });

  const editRsvpForm = useForm({
    resolver: zodResolver(rsvpFormSchema.omit({ characterId: true })),
    defaultValues: {
      xpPurchases: 0,
      xpCandlePurchases: 0,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      eventDate: new Date().toISOString().slice(0, 16),
      chapterId: "",
      createdBy: user?.id || "",
    },
  });

  // Event handlers
  const onCreateSubmit = (data: any) => {
    createEventMutation.mutate({
      ...data,
      eventDate: new Date(data.eventDate),
      createdBy: user?.id || "",
    });
  };

  const onRsvpSubmit = (data: RsvpFormData) => {
    if (selectedEvent) {
      createRsvpMutation.mutate({
        eventId: selectedEvent.id,
        data,
      });
    }
  };

  const onEditRsvpSubmit = (data: any) => {
    if (selectedRsvp) {
      updateRsvpMutation.mutate({
        rsvpId: selectedRsvp.id,
        data,
      });
      setIsEditRsvpModalOpen(false);
      setSelectedRsvp(null);
    }
  };

  const onEditSubmit = (data: any) => {
    if (selectedEvent) {
      updateEventMutation.mutate({
        eventId: selectedEvent.id,
        data: {
          ...data,
          eventDate: new Date(data.eventDate),
        },
      });
    }
  };

  const handleDeleteRsvp = (rsvp: EventRsvp) => {
    if (window.confirm(`Remove ${publicCharacters.find(c => c.id === rsvp.characterId)?.name || 'this character'} from the event?`)) {
      deleteRsvpMutation.mutate(rsvp.id);
    }
  };

  const handleRsvp = (event: Event) => {
    setSelectedEvent(event);
    setIsRsvpModalOpen(true);
  };

  const handleViewRsvps = (event: Event) => {
    setSelectedEvent(event);
    setIsRsvpListModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    editForm.reset({
      name: event.name,
      description: event.description || "",
      eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
      chapterId: event.chapterId || "",
      createdBy: event.createdBy,
    });
    setIsEditEventModalOpen(true);
  };

  const handleEditRsvp = (rsvp: EventRsvp) => {
    setSelectedRsvp(rsvp);
    editRsvpForm.reset({
      xpPurchases: rsvp.xpPurchases,
      xpCandlePurchases: rsvp.xpCandlePurchases,
    });
    setIsEditRsvpModalOpen(true);
  };

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        {!isMobile && (
          <Sidebar 
            user={user} 
            currentPath="/events"
          />
        )}

        {isMobile && (
          <MobileNav
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
            user={user}
            currentPath="/events"
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {isMobile && (
            <div className="border-b border-border bg-background p-4 flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-semibold">Events</h1>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {!isMobile && (
        <Sidebar 
          user={user} 
          currentPath="/events"
        />
      )}

      {isMobile && (
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          user={user}
          currentPath="/events"
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {isMobile && (
          <div className="border-b border-border bg-background p-4 flex items-center justify-between lg:hidden">
            <h1 className="text-xl font-semibold">Events</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Events</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  LARP events and RSVP management with XP purchases
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="chapter-filter" className="text-sm font-medium">
                    Chapter:
                  </Label>
                  <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chapters</SelectItem>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-all-events"
                    checked={showAllEvents}
                    onCheckedChange={setShowAllEvents}
                  />
                  <Label htmlFor="show-all-events" className="text-sm font-medium">
                    {showAllEvents ? "All Events" : "Active Events Only"}
                  </Label>
                </div>
                {user?.isAdmin && (
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                        <DialogDescription>
                          Create a new LARP event for players to RSVP to.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                          <FormField
                            control={createForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Winter Solstice Gathering" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Event description..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="eventDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="chapterId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chapter</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a chapter" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {chapters.map((chapter) => (
                                      <SelectItem key={chapter.id} value={chapter.id}>
                                        {chapter.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createEventMutation.isPending}>
                              {createEventMutation.isPending ? "Creating..." : "Create Event"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events
                .filter(event => showAllEvents || event.isActive)
                .filter(event => selectedChapterId === "all" || event.chapterId === selectedChapterId)
                .map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="flex-1">{event.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant={event.isActive ? "default" : "secondary"}>
                            {event.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {user?.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEventStatusMutation.mutate({ 
                                eventId: event.id, 
                                isActive: !event.isActive 
                              })}
                              disabled={toggleEventStatusMutation.isPending}
                              className="text-xs h-6"
                            >
                              {event.isActive ? "Mark Inactive" : "Reactivate"}
                            </Button>
                          )}
                        </div>
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.eventDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {event.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event.description}
                        </p>
                      )}
                      {event.chapterId && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mr-1" />
                          {chapters.find(c => c.id === event.chapterId)?.name || 'Unknown Chapter'}
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-4">
                        <button
                          onClick={() => handleViewRsvps(event)}
                          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          {event.isActive ? (
                            <>
                              <span>{getRsvpCount(event.id)} RSVPs</span>
                              {getRsvpCount(event.id) > 0 && <Eye className="w-3 h-3 ml-1" />}
                            </>
                          ) : (
                            <>
                              <span>{getRsvpData(event.id).filter(rsvp => rsvp.attended === true).length} Attended</span>
                              {getRsvpData(event.id).filter(rsvp => rsvp.attended === true).length > 0 && <Eye className="w-3 h-3 ml-1" />}
                            </>
                          )}
                        </button>
                        <div className="flex items-center space-x-2">
                          {user?.isAdmin && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {user && event.isActive && (
                            <Button 
                              size="sm" 
                              onClick={() => handleRsvp(event)}
                            >
                              RSVP
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {events.filter(event => showAllEvents || event.isActive).filter(event => selectedChapterId === "all" || event.chapterId === selectedChapterId).length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {showAllEvents ? "No events yet" : "No active events"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {showAllEvents 
                    ? (user?.isAdmin ? "Create your first event to get started." : "Check back later for upcoming events.")
                    : "All events are currently inactive. Toggle to view all events or check back later."
                  }
                </p>
              </div>
            )}

            {/* RSVP Modal */}
            <Dialog open={isRsvpModalOpen} onOpenChange={setIsRsvpModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>RSVP to {selectedEvent?.name}</DialogTitle>
                  <DialogDescription>
                    Reserve your spot and purchase additional XP for the event.
                  </DialogDescription>
                </DialogHeader>
                <Form {...rsvpForm}>
                  <form onSubmit={rsvpForm.handleSubmit(onRsvpSubmit)} className="space-y-4">
                    <FormField
                      control={rsvpForm.control}
                      name="characterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Character</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a character" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {characters.filter(c => c.isActive && !c.isRetired).map((character) => (
                                <SelectItem key={character.id} value={character.id}>
                                  {character.name} ({character.heritage} {character.archetype})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={rsvpForm.control}
                      name="xpPurchases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>XP Purchases (Max 2)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={2}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Purchase additional experience points for your character ($10 each).
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={rsvpForm.control}
                      name="xpCandlePurchases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>XP Candle Purchases (Max 2)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={Math.min(2, Math.floor((user?.candles || 0) / 10))}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Purchase additional experience points for your character (10 candles each).
                            </p>
                            <p className="text-sm font-medium text-orange-600">
                              Available Candles: {user?.candles || 0} | Cost: {(field.value || 0) * 10} candles
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsRsvpModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRsvpMutation.isPending}>
                        {createRsvpMutation.isPending ? "Creating RSVP..." : "Submit RSVP"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* RSVP List Modal */}
            <Dialog open={isRsvpListModalOpen} onOpenChange={setIsRsvpListModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedEvent?.isActive ? "RSVPs" : "Attendees"} for {selectedEvent?.name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedEvent?.isActive 
                      ? "Players who have RSVPed to this event"
                      : "Characters who attended this past event"
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  {selectedEvent && (
                    <div className="space-y-3">
                      {(() => {
                        const filteredRsvps = selectedEvent.isActive 
                          ? getRsvpData(selectedEvent.id)
                          : getRsvpData(selectedEvent.id).filter(rsvp => rsvp.attended === true);
                        
                        return filteredRsvps.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">
                            {selectedEvent.isActive ? "No RSVPs yet" : "No attendees recorded"}
                          </p>
                        ) : (
                          filteredRsvps.map((rsvp) => {
                            const character = publicCharacters.find(c => c.id === rsvp.characterId);
                            return (
                              <div key={rsvp.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{character?.name || 'Unknown Character'}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {character?.heritage && character?.culture && character?.archetype 
                                        ? `${character.heritage.charAt(0).toUpperCase() + character.heritage.slice(1).replace('-', ' ')} ${character.culture.charAt(0).toUpperCase() + character.culture.slice(1).replace('-', ' ')} ${character.archetype.charAt(0).toUpperCase() + character.archetype.slice(1).replace('-', ' ')}`
                                        : 'Character details unavailable'
                                      }
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={rsvp.attended === true ? "default" : rsvp.attended === false ? "destructive" : "secondary"}>
                                      {rsvp.attended === true ? "Attended" : rsvp.attended === false ? "No-Show" : "RSVPed"}
                                    </Badge>
                                    {user?.isAdmin && (
                                      <div className="flex space-x-1">
                                        <Button
                                          size="sm"
                                          variant={rsvp.attended === true ? "default" : "outline"}
                                          onClick={() => markAttendanceMutation.mutate({ rsvpId: rsvp.id, attended: true })}
                                          disabled={markAttendanceMutation.isPending}
                                          className="text-xs px-2 py-1"
                                        >
                                          ✓ Attended
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={rsvp.attended === false ? "destructive" : "outline"}
                                          onClick={() => markAttendanceMutation.mutate({ rsvpId: rsvp.id, attended: false })}
                                          disabled={markAttendanceMutation.isPending}
                                          className="text-xs px-2 py-1"
                                        >
                                          ✗ No-Show
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(rsvp.xpPurchases > 0 || rsvp.xpCandlePurchases > 0) && (user?.isAdmin || character?.userId === user?.id) && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>
                                      XP Purchases: {rsvp.xpPurchases} | XP Candle Purchases: {rsvp.xpCandlePurchases}
                                    </p>
                                  </div>
                                )}
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-gray-500">
                                    RSVPed on {new Date(rsvp.createdAt).toLocaleDateString()}
                                  </p>
                                  {user?.isAdmin && (
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditRsvp(rsvp)}
                                        className="text-xs px-2 py-1"
                                      >
                                        Edit XP
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteRsvp(rsvp)}
                                        className="text-xs px-2 py-1"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        );
                      })()}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRsvpListModalOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit RSVP Modal */}
            <Dialog open={isEditRsvpModalOpen} onOpenChange={setIsEditRsvpModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit RSVP XP Purchases</DialogTitle>
                  <DialogDescription>
                    Modify the XP purchases for this character's RSVP
                  </DialogDescription>
                </DialogHeader>
                <Form {...editRsvpForm}>
                  <form onSubmit={editRsvpForm.handleSubmit(onEditRsvpSubmit)} className="space-y-4">
                    <FormField
                      control={editRsvpForm.control}
                      name="xpPurchases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>XP Purchases (Max 2)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="2"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editRsvpForm.control}
                      name="xpCandlePurchases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>XP Candle Purchases (Max 2)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="2"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditRsvpModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateRsvpMutation.isPending}>
                        {updateRsvpMutation.isPending ? "Updating..." : "Update RSVP"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit Event Modal */}
            <Dialog open={isEditEventModalOpen} onOpenChange={setIsEditEventModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Event</DialogTitle>
                  <DialogDescription>
                    Update the event details below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event name..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Event description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="chapterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chapter</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a chapter" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {chapters.map((chapter) => (
                                <SelectItem key={chapter.id} value={chapter.id}>
                                  {chapter.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditEventModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateEventMutation.isPending}>
                        {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}