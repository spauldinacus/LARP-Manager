import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CharacterSheetModal from "@/components/modals/character-sheet-modal";
import { Eye, Calendar } from "lucide-react";

interface Character {
  id: string;
  name: string;
  playerName: string;
  heritage: string;
  culture: string;
  archetype: string;
  body: number;
  stamina: number;
  experience: number;
  totalXpSpent: number;
  isActive: boolean;
  createdAt: string;
}

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{character.name}</h3>
              <p className="text-sm text-muted-foreground">
                Played by {character.playerName}
              </p>
            </div>
            <Badge variant={character.isActive ? "default" : "secondary"}>
              {character.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{character.heritage.charAt(0).toUpperCase() + character.heritage.slice(1).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
              <Badge variant="outline">{character.culture.charAt(0).toUpperCase() + character.culture.slice(1).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
              <Badge variant="outline">{character.archetype.charAt(0).toUpperCase() + character.archetype.slice(1).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-sm font-medium text-primary">{character.body}</p>
                <p className="text-xs text-muted-foreground">Body</p>
              </div>
              <div>
                <p className="text-sm font-medium text-accent">{character.stamina}</p>
                <p className="text-xs text-muted-foreground">Stamina</p>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600">{character.experience}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">{character.totalXpSpent || 25}</p>
                <p className="text-xs text-muted-foreground">XP Spent</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Created {new Date(character.createdAt).toLocaleDateString()}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSheetOpen(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CharacterSheetModal
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        characterId={character.id}
      />
    </>
  );
}
