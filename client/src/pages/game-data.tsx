import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Link, Unlink, Settings, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";

// Form schemas
const skillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  prerequisiteSkillId: z.string().optional().nullable(),
});

const heritageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  body: z.number().min(1, "Body must be at least 1"),
  stamina: z.number().min(1, "Stamina must be at least 1"),
  icon: z.string().min(1, "Icon is required"),
  description: z.string().min(1, "Description is required"),
  costumeRequirements: z.string().min(1, "Costume requirements are required"),
  benefit: z.string().min(1, "Benefit is required"),
  weakness: z.string().min(1, "Weakness is required"),
});

const cultureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  heritageId: z.string().min(1, "Heritage is required"),
  description: z.string().optional(),
});

const archetypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export default function GameDataPage() {
  const [activeTab, setActiveTab] = useState("skills");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [skillManagementModal, setSkillManagementModal] = useState<{
    isOpen: boolean;
    itemId: string;
    itemType: 'heritage' | 'culture' | 'archetype';
    skillType: 'primary' | 'secondary';
  }>({ isOpen: false, itemId: '', itemType: 'heritage', skillType: 'secondary' });
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // XP Recalculation mutation
  const recalculateXpMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/recalculate-xp"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "XP recalculated for all characters successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to recalculate XP",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  // Queries
  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["/api/admin/skills"],
  });

  const { data: heritages = [], isLoading: heritagesLoading } = useQuery({
    queryKey: ["/api/admin/heritages"],
  });

  const { data: cultures = [], isLoading: culturesLoading } = useQuery({
    queryKey: ["/api/admin/cultures"],
  });

  const { data: archetypes = [], isLoading: archetypesLoading } = useQuery({
    queryKey: ["/api/admin/archetypes"],
  });

  // Mutations
  const createSkillMutation = useMutation({
    mutationFn: (data: z.infer<typeof skillSchema>) => apiRequest("POST", "/api/admin/skills", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skills"] });
      setSelectedItem(null);
      setIsCreateMode(false);
    },
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof skillSchema> }) => 
      apiRequest("PUT", `/api/admin/skills/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skills"] });
      setSelectedItem(null);
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skills"] });
    },
  });

  const createHeritageMutation = useMutation({
    mutationFn: (data: z.infer<typeof heritageSchema>) => apiRequest("POST", "/api/admin/heritages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/heritages"] });
      setSelectedItem(null);
      setIsCreateMode(false);
    },
  });

  const updateHeritageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof heritageSchema> }) => 
      apiRequest("PUT", `/api/admin/heritages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/heritages"] });
      setSelectedItem(null);
    },
  });

  const deleteHeritageMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/heritages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/heritages"] });
    },
  });

  const createCultureMutation = useMutation({
    mutationFn: (data: z.infer<typeof cultureSchema>) => apiRequest("POST", "/api/admin/cultures", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cultures"] });
      setSelectedItem(null);
      setIsCreateMode(false);
    },
  });

  const updateCultureMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof cultureSchema> }) => 
      apiRequest("PUT", `/api/admin/cultures/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cultures"] });
      setSelectedItem(null);
    },
  });

  const deleteCultureMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/cultures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cultures"] });
    },
  });

  const createArchetypeMutation = useMutation({
    mutationFn: (data: z.infer<typeof archetypeSchema>) => apiRequest("POST", "/api/admin/archetypes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/archetypes"] });
      setSelectedItem(null);
      setIsCreateMode(false);
    },
  });

  const updateArchetypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof archetypeSchema> }) => 
      apiRequest("PUT", `/api/admin/archetypes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/archetypes"] });
      setSelectedItem(null);
    },
  });

  const deleteArchetypeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/archetypes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/archetypes"] });
    },
  });

  // Skill relationship mutations
  const addSkillRelationshipMutation = useMutation({
    mutationFn: ({ itemId, skillId, itemType, skillType }: { 
      itemId: string; 
      skillId: string; 
      itemType: 'heritage' | 'culture' | 'archetype'; 
      skillType: 'primary' | 'secondary' 
    }) => {
      const endpoint = skillType === 'primary' 
        ? `/api/admin/${itemType}s/${itemId}/primary-skills`
        : `/api/admin/${itemType}s/${itemId}/secondary-skills`;
      return apiRequest("POST", endpoint, { skillId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${variables.itemType}s`] });
    },
  });

  const removeSkillRelationshipMutation = useMutation({
    mutationFn: ({ itemId, skillId, itemType, skillType }: { 
      itemId: string; 
      skillId: string; 
      itemType: 'heritage' | 'culture' | 'archetype'; 
      skillType: 'primary' | 'secondary' 
    }) => {
      const endpoint = skillType === 'primary' 
        ? `/api/admin/${itemType}s/${itemId}/primary-skills/${skillId}`
        : `/api/admin/${itemType}s/${itemId}/secondary-skills/${skillId}`;
      return apiRequest("DELETE", endpoint);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${variables.itemType}s`] });
    },
  });

  // Skill form
  const skillForm = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: "",
      description: "",
      prerequisiteSkillId: null,
    },
  });

  // Heritage form
  const heritageForm = useForm<z.infer<typeof heritageSchema>>({
    resolver: zodResolver(heritageSchema),
    defaultValues: {
      name: "",
      body: 10,
      stamina: 10,
      icon: "",
      description: "",
      costumeRequirements: "",
      benefit: "",
      weakness: "",
    },
  });

  // Culture form  
  const cultureForm = useForm<z.infer<typeof cultureSchema>>({
    resolver: zodResolver(cultureSchema),
    defaultValues: {
      name: "",
      heritageId: "",
      description: "",
    },
  });

  // Archetype form
  const archetypeForm = useForm<z.infer<typeof archetypeSchema>>({
    resolver: zodResolver(archetypeSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleCreate = (type: string) => {
    setIsCreateMode(true);
    setSelectedItem(null);
    
    // Reset forms
    skillForm.reset();
    heritageForm.reset();
    cultureForm.reset();
    archetypeForm.reset();
  };

  const openSkillManagement = (itemId: string, itemType: 'heritage' | 'culture' | 'archetype', skillType: 'primary' | 'secondary') => {
    setSkillManagementModal({ isOpen: true, itemId, itemType, skillType });
  };

  const handleAddSkillRelationship = (skillId: string) => {
    addSkillRelationshipMutation.mutate({
      itemId: skillManagementModal.itemId,
      skillId,
      itemType: skillManagementModal.itemType,
      skillType: skillManagementModal.skillType,
    });
  };

  const handleRemoveSkillRelationship = (skillId: string) => {
    removeSkillRelationshipMutation.mutate({
      itemId: skillManagementModal.itemId,
      skillId,
      itemType: skillManagementModal.itemType,
      skillType: skillManagementModal.skillType,
    });
  };

  const handleEdit = (item: any) => {
    setIsCreateMode(false);
    setSelectedItem(item);
    
    // Populate forms based on type
    if (activeTab === "skills") {
      skillForm.reset({
        name: item.name,
        description: item.description || "",
        prerequisiteSkillId: item.prerequisiteSkillId || "none",
      });
    } else if (activeTab === "heritages") {
      heritageForm.reset({
        name: item.name,
        body: item.body,
        stamina: item.stamina,
        icon: item.icon,
        description: item.description,
        costumeRequirements: item.costumeRequirements,
        benefit: item.benefit,
        weakness: item.weakness,
      });
    } else if (activeTab === "cultures") {
      cultureForm.reset({
        name: item.name,
        heritageId: item.heritageId,
        description: item.description || "",
      });
    } else if (activeTab === "archetypes") {
      archetypeForm.reset({
        name: item.name,
        description: item.description || "",
      });
    }
  };

  const handleDelete = (id: string, type: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      if (type === "skills") deleteSkillMutation.mutate(id);
      else if (type === "heritages") deleteHeritageMutation.mutate(id);
      else if (type === "cultures") deleteCultureMutation.mutate(id);
      else if (type === "archetypes") deleteArchetypeMutation.mutate(id);
    }
  };

  const onSkillSubmit = (data: z.infer<typeof skillSchema>) => {
    // Convert "none" back to null for the API
    const processedData = {
      ...data,
      prerequisiteSkillId: data.prerequisiteSkillId === "none" ? null : data.prerequisiteSkillId
    };
    
    if (isCreateMode) {
      createSkillMutation.mutate(processedData);
    } else if (selectedItem) {
      updateSkillMutation.mutate({ id: selectedItem.id, data: processedData });
    }
  };

  const onHeritageSubmit = (data: z.infer<typeof heritageSchema>) => {
    if (isCreateMode) {
      createHeritageMutation.mutate(data);
    } else if (selectedItem) {
      updateHeritageMutation.mutate({ id: selectedItem.id, data });
    }
  };

  const onCultureSubmit = (data: z.infer<typeof cultureSchema>) => {
    if (isCreateMode) {
      createCultureMutation.mutate(data);
    } else if (selectedItem) {
      updateCultureMutation.mutate({ id: selectedItem.id, data });
    }
  };

  const onArchetypeSubmit = (data: z.infer<typeof archetypeSchema>) => {
    if (isCreateMode) {
      createArchetypeMutation.mutate(data);
    } else if (selectedItem) {
      updateArchetypeMutation.mutate({ id: selectedItem.id, data });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {!isMobile && <Sidebar user={user} currentPath={location} />}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        user={user}
        currentPath={location}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        {isMobile && (
          <div className="lg:hidden bg-background border-b border-border p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold">Game Data</h1>
            <div className="w-10" />
          </div>
        )}

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Game Data Management</h1>
              <p className="text-muted-foreground">Manage dynamic game data including skills, heritages, cultures, and archetypes</p>
            </div>
            <Button
              onClick={() => recalculateXpMutation.mutate()}
              disabled={recalculateXpMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              {recalculateXpMutation.isPending ? "Recalculating..." : "Recalculate All XP"}
            </Button>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="heritages">Heritages</TabsTrigger>
          <TabsTrigger value="cultures">Cultures</TabsTrigger>
          <TabsTrigger value="archetypes">Archetypes</TabsTrigger>
        </TabsList>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Skills Management</h2>
            <Dialog open={isCreateMode || selectedItem !== null} onOpenChange={(open) => {
              if (!open) {
                setIsCreateMode(false);
                setSelectedItem(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCreate("skills")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Skill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isCreateMode ? "Create New Skill" : "Edit Skill"}</DialogTitle>
                  <DialogDescription>
                    {isCreateMode ? "Add a new skill to the game system." : "Modify the selected skill."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...skillForm}>
                  <form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="space-y-4">
                    <FormField
                      control={skillForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Skill name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={skillForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Skill description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={skillForm.control}
                      name="prerequisiteSkillId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prerequisite Skill</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select prerequisite skill (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No prerequisite</SelectItem>
                              {skills.map((skill: any) => (
                                <SelectItem key={skill.id} value={skill.id}>
                                  {skill.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCreateMode(false);
                        setSelectedItem(null);
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createSkillMutation.isPending || updateSkillMutation.isPending}>
                        {isCreateMode ? "Create" : "Update"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skillsLoading ? (
              <div className="col-span-full text-center py-8">Loading skills...</div>
            ) : (
              skills.map((skill: any) => (
                <Card key={skill.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(skill)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(skill.id, "skills")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {skill.description && (
                      <p className="text-sm text-muted-foreground mb-2">{skill.description}</p>
                    )}
                    {skill.prerequisiteSkillName && (
                      <Badge variant="secondary" className="text-xs">
                        Requires: {skill.prerequisiteSkillName}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Heritages Tab */}
        <TabsContent value="heritages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Heritages Management</h2>
            <Dialog open={isCreateMode || selectedItem !== null} onOpenChange={(open) => {
              if (!open) {
                setIsCreateMode(false);
                setSelectedItem(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCreate("heritages")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Heritage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isCreateMode ? "Create New Heritage" : "Edit Heritage"}</DialogTitle>
                  <DialogDescription>
                    {isCreateMode ? "Add a new heritage to the game system." : "Modify the selected heritage."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...heritageForm}>
                  <form onSubmit={heritageForm.handleSubmit(onHeritageSubmit)} className="space-y-4">
                    <FormField
                      control={heritageForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Heritage name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={heritageForm.control}
                        name="body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Body</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={heritageForm.control}
                        name="stamina"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stamina</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={heritageForm.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <FormControl>
                            <Input placeholder="Icon identifier" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={heritageForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Heritage description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={heritageForm.control}
                      name="costumeRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costume Requirements</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Costume requirements" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={heritageForm.control}
                      name="benefit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefit</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Heritage benefit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={heritageForm.control}
                      name="weakness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weakness</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Heritage weakness" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCreateMode(false);
                        setSelectedItem(null);
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createHeritageMutation.isPending || updateHeritageMutation.isPending}>
                        {isCreateMode ? "Create" : "Update"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {heritagesLoading ? (
              <div className="col-span-full text-center py-8">Loading heritages...</div>
            ) : (
              heritages.map((heritage: any) => (
                <Card key={heritage.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{heritage.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(heritage)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(heritage.id, "heritages")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4 mb-2">
                      <Badge>Body: {heritage.body}</Badge>
                      <Badge>Stamina: {heritage.stamina}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{heritage.description}</p>
                    
                    {/* Secondary Skills */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Secondary Skills</h4>
                        <Button size="sm" variant="outline" onClick={() => openSkillManagement(heritage.id, 'heritage', 'secondary')}>
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {heritage.secondarySkills?.map((skill: any) => (
                          <Badge key={skill.id} variant="secondary" className="text-xs">
                            {skill.name}
                          </Badge>
                        )) || <span className="text-xs text-muted-foreground">No secondary skills</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Cultures Tab */}
        <TabsContent value="cultures" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Cultures Management</h2>
            <Dialog open={isCreateMode || selectedItem !== null} onOpenChange={(open) => {
              if (!open) {
                setIsCreateMode(false);
                setSelectedItem(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCreate("cultures")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Culture
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isCreateMode ? "Create New Culture" : "Edit Culture"}</DialogTitle>
                  <DialogDescription>
                    {isCreateMode ? "Add a new culture to the game system." : "Modify the selected culture."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...cultureForm}>
                  <form onSubmit={cultureForm.handleSubmit(onCultureSubmit)} className="space-y-4">
                    <FormField
                      control={cultureForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Culture name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={cultureForm.control}
                      name="heritageId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heritage</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select heritage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {heritages.map((heritage: any) => (
                                <SelectItem key={heritage.id} value={heritage.id}>
                                  {heritage.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={cultureForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Culture description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCreateMode(false);
                        setSelectedItem(null);
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCultureMutation.isPending || updateCultureMutation.isPending}>
                        {isCreateMode ? "Create" : "Update"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {culturesLoading ? (
              <div className="col-span-full text-center py-8">Loading cultures...</div>
            ) : (
              cultures.map((culture: any) => (
                <Card key={culture.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{culture.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(culture)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(culture.id, "cultures")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="mb-2">
                      {culture.heritageName}
                    </Badge>
                    {culture.description && (
                      <p className="text-sm text-muted-foreground mb-3">{culture.description}</p>
                    )}
                    
                    {/* Secondary Skills */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Secondary Skills</h4>
                        <Button size="sm" variant="outline" onClick={() => openSkillManagement(culture.id, 'culture', 'secondary')}>
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {culture.secondarySkills?.map((skill: any) => (
                          <Badge key={skill.id} variant="secondary" className="text-xs">
                            {skill.name}
                          </Badge>
                        )) || <span className="text-xs text-muted-foreground">No secondary skills</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Archetypes Tab */}
        <TabsContent value="archetypes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Archetypes Management</h2>
            <Dialog open={isCreateMode || selectedItem !== null} onOpenChange={(open) => {
              if (!open) {
                setIsCreateMode(false);
                setSelectedItem(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCreate("archetypes")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Archetype
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isCreateMode ? "Create New Archetype" : "Edit Archetype"}</DialogTitle>
                  <DialogDescription>
                    {isCreateMode ? "Add a new archetype to the game system." : "Modify the selected archetype."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...archetypeForm}>
                  <form onSubmit={archetypeForm.handleSubmit(onArchetypeSubmit)} className="space-y-4">
                    <FormField
                      control={archetypeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Archetype name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={archetypeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Archetype description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCreateMode(false);
                        setSelectedItem(null);
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createArchetypeMutation.isPending || updateArchetypeMutation.isPending}>
                        {isCreateMode ? "Create" : "Update"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archetypesLoading ? (
              <div className="col-span-full text-center py-8">Loading archetypes...</div>
            ) : (
              archetypes.map((archetype: any) => (
                <Card key={archetype.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{archetype.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(archetype)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(archetype.id, "archetypes")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {archetype.description && (
                      <p className="text-sm text-muted-foreground mb-3">{archetype.description}</p>
                    )}
                    
                    {/* Primary Skills */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Primary Skills</h4>
                        <Button size="sm" variant="outline" onClick={() => openSkillManagement(archetype.id, 'archetype', 'primary')}>
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {archetype.primarySkills?.map((skill: any) => (
                          <Badge key={skill.id} variant="default" className="text-xs">
                            {skill.name}
                          </Badge>
                        )) || <span className="text-xs text-muted-foreground">No primary skills</span>}
                      </div>
                    </div>
                    
                    {/* Secondary Skills */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Secondary Skills</h4>
                        <Button size="sm" variant="outline" onClick={() => openSkillManagement(archetype.id, 'archetype', 'secondary')}>
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {archetype.secondarySkills?.map((skill: any) => (
                          <Badge key={skill.id} variant="secondary" className="text-xs">
                            {skill.name}
                          </Badge>
                        )) || <span className="text-xs text-muted-foreground">No secondary skills</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Skill Management Modal */}
      <Dialog open={skillManagementModal.isOpen} onOpenChange={(open) => setSkillManagementModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage {skillManagementModal.skillType === 'primary' ? 'Primary' : 'Secondary'} Skills
            </DialogTitle>
            <DialogDescription>
              Add or remove skills for this {skillManagementModal.itemType}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Available Skills</h4>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {skillsLoading ? (
                  <div className="text-center py-4">Loading skills...</div>
                ) : (
                  skills?.filter((skill: any) => {
                    // Get current item's skills to filter out already assigned ones
                    const currentItem = skillManagementModal.itemType === 'heritage' 
                      ? heritages?.find((h: any) => h.id === skillManagementModal.itemId)
                      : skillManagementModal.itemType === 'culture'
                      ? cultures?.find((c: any) => c.id === skillManagementModal.itemId)
                      : archetypes?.find((a: any) => a.id === skillManagementModal.itemId);
                    
                    const assignedSkills = skillManagementModal.skillType === 'primary' 
                      ? currentItem?.primarySkills || []
                      : currentItem?.secondarySkills || [];
                    
                    return !assignedSkills.some((s: any) => s.id === skill.id);
                  }).map((skill: any) => (
                    <div key={skill.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{skill.name}</span>
                        {skill.description && (
                          <p className="text-sm text-muted-foreground">{skill.description}</p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddSkillRelationship(skill.id)}
                        disabled={addSkillRelationshipMutation.isPending}
                      >
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Assigned Skills</h4>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {(() => {
                  const currentItem = skillManagementModal.itemType === 'heritage' 
                    ? heritages?.find((h: any) => h.id === skillManagementModal.itemId)
                    : skillManagementModal.itemType === 'culture'
                    ? cultures?.find((c: any) => c.id === skillManagementModal.itemId)
                    : archetypes?.find((a: any) => a.id === skillManagementModal.itemId);
                  
                  const assignedSkills = skillManagementModal.skillType === 'primary' 
                    ? currentItem?.primarySkills || []
                    : currentItem?.secondarySkills || [];
                  
                  return assignedSkills.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No skills assigned yet
                    </div>
                  ) : (
                    assignedSkills.map((skill: any) => (
                      <div key={skill.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{skill.name}</span>
                          {skill.description && (
                            <p className="text-sm text-muted-foreground">{skill.description}</p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleRemoveSkillRelationship(skill.id)}
                          disabled={removeSkillRelationshipMutation.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}