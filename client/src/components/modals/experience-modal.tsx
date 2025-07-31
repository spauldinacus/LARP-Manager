import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const experienceSchema = z.object({
  characterIds: z.array(z.string()).min(1, "Please select at least one character"),
  amount: z.number().min(1, "Experience amount must be at least 1"),
  reason: z.string().min(1, "Please provide a reason for the experience award"),
  eventId: z.string().optional(),
});

type ExperienceForm = z.infer<typeof experienceSchema>;

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExperienceModal({ isOpen, onClose }: ExperienceModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<ExperienceForm>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      characterIds: [],
      amount: 1,
      reason: "",
      eventId: "",
    },
  });

  // Fetch characters
  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: ["/api/characters"],
    enabled: isOpen,
  });

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    enabled: isOpen,
  });

  const createExperienceMutation = useMutation({
    mutationFn: async (data: ExperienceForm) => {
      // Create experience entries for each selected character
      const promises = data.characterIds.map((characterId) =>
        apiRequest("POST", "/api/experience", {
          characterId,
          amount: data.amount,
          reason: data.reason,
          eventId: data.eventId || null,
        })
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Experience awarded!",
        description: "Experience has been successfully awarded to selected characters.",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Award failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExperienceForm) => {
    createExperienceMutation.mutate(data);
  };

  const selectedCharacterIds = form.watch("characterIds");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Award Experience</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Character Selection */}
          <div>
            <Label className="text-base font-medium mb-2 block">Select Characters</Label>
            <div className="border border-border rounded-md">
              <ScrollArea className="max-h-48">
                {charactersLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading characters...</p>
                  </div>
                ) : characters && characters.length > 0 ? (
                  <div className="p-2">
                    {characters.map((character: any) => (
                      <label
                        key={character.id}
                        className="flex items-center space-x-3 p-3 hover:bg-accent/50 cursor-pointer rounded-md"
                      >
                        <Checkbox
                          checked={selectedCharacterIds.includes(character.id)}
                          onCheckedChange={(checked) => {
                            const currentIds = form.getValues("characterIds");
                            if (checked) {
                              form.setValue("characterIds", [...currentIds, character.id]);
                            } else {
                              form.setValue(
                                "characterIds",
                                currentIds.filter((id) => id !== character.id)
                              );
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{character.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {character.heritage} {character.archetype} • Current XP: {character.experience}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No characters available</p>
                  </div>
                )}
              </ScrollArea>
            </div>
            {form.formState.errors.characterIds && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.characterIds.message}
              </p>
            )}
          </div>

          {/* Experience Amount and Event */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="amount">Experience Points</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Enter XP amount"
                {...form.register("amount", { valueAsNumber: true })}
                className={form.formState.errors.amount ? "border-destructive" : ""}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="eventId">Related Event (Optional)</Label>
              <Select
                value={form.watch("eventId")}
                onValueChange={(value) => form.setValue("eventId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Event</SelectItem>
                  {events?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} • {new Date(event.eventDate).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Award</Label>
            <Textarea
              id="reason"
              placeholder="Describe why experience is being awarded..."
              rows={3}
              {...form.register("reason")}
              className={form.formState.errors.reason ? "border-destructive" : ""}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={createExperienceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createExperienceMutation.isPending}
            >
              {createExperienceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Awarding...
                </>
              ) : (
                "Award Experience"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
