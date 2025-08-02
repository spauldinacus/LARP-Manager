import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChapterSchema, type Chapter } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Hash, Menu, Eye } from "lucide-react";
import { z } from "zod";

const chapterFormSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(2).transform(val => val.toUpperCase()),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ChapterFormData = z.infer<typeof chapterFormSchema>;

export default function ChaptersPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedChapterForMembers, setSelectedChapterForMembers] = useState<any>(null);
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  // No need to redirect non-admin users - chapters are viewable by all

  const { data: chapters = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/chapters"],
  });

  const { data: chapterMembers = [], isLoading: membersLoading } = useQuery<any[]>({
    queryKey: ["/api/chapters", selectedChapterForMembers?.id, "members"],
    enabled: !!selectedChapterForMembers?.id && showMembersModal,
  });

  const createChapterMutation = useMutation({
    mutationFn: (data: ChapterFormData) => apiRequest("POST", "/api/chapters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Chapter created",
        description: "The chapter has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create chapter",
        variant: "destructive",
      });
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChapterFormData> }) =>
      apiRequest("PATCH", `/api/chapters/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      setEditingChapter(null);
      toast({
        title: "Chapter updated",
        description: "The chapter has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update chapter",
        variant: "destructive",
      });
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/chapters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      toast({
        title: "Chapter deactivated",
        description: "The chapter has been deactivated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate chapter",
        variant: "destructive",
      });
    },
  });

  const generatePlayerNumberMutation = useMutation({
    mutationFn: (chapterId: string) => apiRequest("POST", `/api/chapters/${chapterId}/generate-player-number`),
    onSuccess: (data: any) => {
      toast({
        title: "Player number generated",
        description: `New player number: ${data.playerNumber}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate player number",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<ChapterFormData>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  const editForm = useForm<ChapterFormData>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  const onCreateSubmit = (data: ChapterFormData) => {
    createChapterMutation.mutate(data);
    createForm.reset();
  };

  const onEditSubmit = (data: ChapterFormData) => {
    if (editingChapter) {
      updateChapterMutation.mutate({ id: editingChapter.id, data });
      editForm.reset();
    }
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    editForm.reset({
      name: chapter.name,
      code: chapter.code,
      description: chapter.description || "",
      isActive: chapter.isActive,
    });
  };

  const handleDelete = (chapterId: string) => {
    if (confirm("Are you sure you want to deactivate this chapter? This action will make it unavailable for new registrations.")) {
      deleteChapterMutation.mutate(chapterId);
    }
  };

  const handleReactivate = (chapterId: string) => {
    if (confirm("Are you sure you want to reactivate this chapter? This will make it available for new registrations again.")) {
      updateChapterMutation.mutate({ id: chapterId, data: { isActive: true } });
    }
  };

  const handleGeneratePlayerNumber = (chapterId: string) => {
    if (confirm("Generate a new player number for this chapter?")) {
      generatePlayerNumberMutation.mutate(chapterId);
    }
  };

  const handleViewMembers = (chapter: any) => {
    setSelectedChapterForMembers(chapter);
    setShowMembersModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        {!isMobile && user && (
          <Sidebar 
            user={user} 
            currentPath="/chapters"
          />
        )}

        {/* Mobile Navigation */}
        {isMobile && user && (
          <MobileNav
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
            user={user}
            currentPath="/chapters"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          {isMobile && (
            <div className="border-b border-border bg-background p-4 flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-semibold">Chapter Management</h1>
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

          <div className="flex-1 overflow-auto">
            <div className="container mx-auto py-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
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
      {!isMobile && user && (
        <Sidebar 
          user={user} 
          currentPath="/chapters"
        />
      )}

      {/* Mobile Navigation */}
      {isMobile && user && (
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          user={user}
          currentPath="/chapters"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <div className="border-b border-border bg-background p-4 flex items-center justify-between lg:hidden">
            <h1 className="text-xl font-semibold">Chapter Management</h1>
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
                <h1 className="text-3xl font-bold">{user?.isAdmin ? "Chapter Management" : "Chapters"}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {user?.isAdmin ? "Manage LARP chapters and player registration codes" : "View LARP chapters and member information"}
                </p>
              </div>
              {user?.isAdmin && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Chapter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Chapter</DialogTitle>
              <DialogDescription>
                Create a new LARP chapter. The chapter code will be used for generating player numbers.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Florida Chapter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="FL" 
                          maxLength={2}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Chapter description..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Chapter</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Allow new player registrations for this chapter
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createChapterMutation.isPending}
                  >
                    {createChapterMutation.isPending ? "Creating..." : "Create Chapter"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
              )}
            </div>

            {chapters.filter((chapter: any) => user?.isAdmin || chapter.isActive).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No chapters found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {user?.isAdmin ? "Create your first chapter to start managing player registrations." : "No chapters are currently available."}
                  </p>
                  {user?.isAdmin && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Chapter
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {chapters
                  .filter((chapter: any) => user?.isAdmin || chapter.isActive)
                  .map((chapter: any) => (
                  <Card key={chapter.id} className={!chapter.isActive ? "opacity-50" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{chapter.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {chapter.code}
                          </span>
                          {!chapter.isActive && (
                            <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        {chapter.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Members:</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => handleViewMembers(chapter)}
                        >
                          {chapter.memberCount || 0} players
                        </Button>
                      </div>
                      {user?.isAdmin && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(chapter)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePlayerNumber(chapter.id)}
                            disabled={generatePlayerNumberMutation.isPending}
                          >
                            <Hash className="w-4 h-4 mr-1" />
                            Generate #
                          </Button>
                          {chapter.isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(chapter.id)}
                              disabled={deleteChapterMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReactivate(chapter.id)}
                              disabled={updateChapterMutation.isPending}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Reactivate
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members Modal */}
      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedChapterForMembers?.name} Members
            </DialogTitle>
            <DialogDescription>
              Players registered to the {selectedChapterForMembers?.name} chapter
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            ) : chapterMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No members found in this chapter
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {chapterMembers.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.playerName || member.username}</span>
                        {member.title && (
                          <Badge variant="secondary" className="text-xs">
                            {member.title}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        @{member.username}
                      </div>
                    </div>
                    <div className="text-right">
                      {member.playerNumber && (
                        <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          #{member.playerNumber}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingChapter} onOpenChange={() => setEditingChapter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>
              Update chapter information and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Florida Chapter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="FL" 
                        maxLength={2}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Chapter description..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Chapter</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow new player registrations for this chapter
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingChapter(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateChapterMutation.isPending}
                >
                  {updateChapterMutation.isPending ? "Updating..." : "Update Chapter"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}