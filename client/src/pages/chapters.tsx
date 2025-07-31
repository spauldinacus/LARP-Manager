import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChapterSchema, type Chapter } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Hash } from "lucide-react";
import { z } from "zod";

const chapterFormSchema = insertChapterSchema.extend({
  code: z.string().min(2).max(2).transform(val => val.toUpperCase()),
});

type ChapterFormData = z.infer<typeof chapterFormSchema>;

export default function ChaptersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const { toast } = useToast();

  const { data: chapters = [], isLoading } = useQuery<Chapter[]>({
    queryKey: ["/api/chapters"],
  });

  const createChapterMutation = useMutation({
    mutationFn: (data: ChapterFormData) => apiRequest("/api/chapters", "POST", data),
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
      apiRequest(`/api/chapters/${id}`, "PATCH", data),
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
    mutationFn: (id: string) => apiRequest(`/api/chapters/${id}`, "DELETE"),
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
    mutationFn: (chapterId: string) => apiRequest(`/api/chapters/${chapterId}/generate-player-number`, "POST"),
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
  };

  const onEditSubmit = (data: ChapterFormData) => {
    if (editingChapter) {
      updateChapterMutation.mutate({ id: editingChapter.id, data });
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

  const handleGeneratePlayerNumber = (chapterId: string) => {
    if (confirm("Generate a new player number for this chapter?")) {
      generatePlayerNumberMutation.mutate(chapterId);
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Chapter Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage LARP chapters and player registration codes
          </p>
        </div>
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
      </div>

      {chapters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No chapters found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first chapter to start managing player registrations.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Chapter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter: Chapter) => (
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
                  {chapter.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(chapter.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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