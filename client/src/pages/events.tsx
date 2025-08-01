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
import { Calendar, Users, Plus, MapPin, Clock, Menu, Eye, Edit } from "lucide-react";
import { insertEventSchema, insertEventRsvpSchema, type Event, type Character, type EventRsvp } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const eventFormSchema = insertEventSchema.extend({
  eventDate: z.string().transform(val => new Date(val))
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

  const createEventMutation = useMutation({
    mutationFn: (data: EventFormData) => apiRequest("POST", "/api/events", data),
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
        title: "Error",
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
      editForm.reset();
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

  const createForm = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      eventDate: new Date().toISOString().slice(0, 16),
      location: "",
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
      location: "",
      createdBy: user?.id || "",
    },
  });

  const onCreateSubmit = (data: any) => {
    createEventMutation.mutate({
      ...data,
      eventDate: new Date(data.eventDate),
      createdBy: user?.id || "",
    });
  };

  const onRsvpSubmit = (data: any) => {
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
      editRsvpForm.reset();
    }
  };

  const handleEditRsvp = (rsvp: EventRsvp) => {
    setSelectedRsvp(rsvp);
    editRsvpForm.reset({
      xpPurchases: rsvp.xpPurchases,
      xpCandlePurchases: rsvp.xpCandlePurchases,
    });
    setIsEditRsvpModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    editForm.reset({
      name: event.name,
      description: event.description || "",
      eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
      location: event.location || "",
      createdBy: event.createdBy,
    });
    setIsEditEventModalOpen(true);
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
    if (window.confirm(`Remove ${characters.find(c => c.id === rsvp.characterId)?.name || 'this character'} from the event?`)) {
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

  // Admin attendance marking mutation
  const markAttendanceMutation = useMutation({
    mutationFn: ({ rsvpId, attended }: { rsvpId: string; attended: boolean }) =>
      apiRequest("POST", `/api/rsvps/${rsvpId}/attendance`, { attended }),
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

  // Admin RSVP modification mutations
  const updateRsvpMutation = useMutation({
    mutationFn: ({ rsvpId, data }: { rsvpId: string; data: Partial<EventRsvp> }) =>
      apiRequest("PATCH", `/api/rsvps/${rsvpId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      // Invalidate all character-specific queries
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
      apiRequest("DELETE", `/api/rsvps/${rsvpId}`),
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

  // Admin event status toggle mutation
  const toggleEventStatusMutation = useMutation({
    mutationFn: ({ eventId, isActive }: { eventId: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/events/${eventId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Status Updated",
        description: "Event status has been updated successfully.",
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar 
            user={user} 
            currentPath="/events"
          />
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileNav
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
            user={user}
            currentPath="/events"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
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
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          user={user} 
          currentPath="/events"
        />
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          user={user}
          currentPath="/events"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
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
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Event location..." {...field} />
                        </FormControl>
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

      {/* Events Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
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
              {event.location && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-1" />
                  {event.location}
                </div>
              )}
              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => handleViewRsvps(event)}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Users className="w-4 h-4 mr-1" />
                  <span>{getRsvpCount(event.id)} RSVPs</span>
                  {getRsvpCount(event.id) > 0 && <Eye className="w-3 h-3 ml-1" />}
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
                  {user && (
                    <Button 
                      size="sm" 
                      onClick={() => handleRsvp(event)}
                      disabled={!event.isActive}
                      title={!event.isActive ? "Event is not accepting RSVPs" : ""}
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

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No events yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.isAdmin ? "Create your first event to get started." : "Check back later for upcoming events."}
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
          </div>
        </div>

        {/* RSVP List Modal */}
        <Dialog open={isRsvpListModalOpen} onOpenChange={setIsRsvpListModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>RSVPs for {selectedEvent?.name}</DialogTitle>
              <DialogDescription>
                Players who have RSVPed to this event
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {selectedEvent && (
                <div className="space-y-3">
                  {getRsvpData(selectedEvent.id).length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No RSVPs yet</p>
                  ) : (
                    getRsvpData(selectedEvent.id).map((rsvp) => {
                      const character = characters.find(c => c.id === rsvp.characterId);
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
                          {(rsvp.xpPurchases > 0 || rsvp.xpCandlePurchases > 0) && (
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
                  )}
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
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Purchase additional experience points for this character (10 candles each).
                        </p>
                        <p className="text-sm font-medium text-orange-600">
                          Cost: {(field.value || 0) * 10} candles
                        </p>
                      </div>
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Event location..." {...field} />
                      </FormControl>
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
  );
}