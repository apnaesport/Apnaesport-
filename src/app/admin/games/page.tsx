
"use client"; // Required for form handling state

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Game } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

// Placeholder data
const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://picsum.photos/seed/lol-icon/40/40", bannerUrl: "" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://picsum.photos/seed/valo-icon/40/40", bannerUrl: "" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://picsum.photos/seed/cs-icon/40/40", bannerUrl: "" },
];

const gameSchema = z.object({
  id: z.string().optional(), // Optional for new games, present for editing
  name: z.string().min(2, "Game name must be at least 2 characters."),
  iconUrl: z.string().url("Must be a valid URL for the icon."),
  bannerUrl: z.string().url("Must be a valid URL for the banner.").optional().or(z.literal('')),
});
type GameFormData = z.infer<typeof gameSchema>;

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>(placeholderGames); // Manage games state locally for now
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const { toast } = useToast();

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: { name: "", iconUrl: "", bannerUrl: "" },
  });

  const onSubmit: SubmitHandler<GameFormData> = (data) => {
    if (editingGame) {
      // Update game
      setGames(games.map(g => g.id === editingGame.id ? { ...g, ...data, id: editingGame.id } : g));
      toast({ title: "Game Updated", description: `${data.name} has been updated.` });
    } else {
      // Add new game
      const newGame: Game = { ...data, id: `game-${Date.now()}` }; // Simple ID generation
      setGames([...games, newGame]);
      toast({ title: "Game Added", description: `${data.name} has been added.` });
    }
    form.reset();
    setIsDialogOpen(false);
    setEditingGame(null);
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    form.reset({ name: game.name, iconUrl: game.iconUrl, bannerUrl: game.bannerUrl || "" });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (gameId: string) => {
    if (confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
        setGames(games.filter(g => g.id !== gameId));
        toast({ title: "Game Deleted", description: "The game has been removed.", variant: "destructive" });
    }
  };

  const openNewGameDialog = () => {
    setEditingGame(null);
    form.reset({ name: "", iconUrl: "", bannerUrl: "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Games"
        subtitle="Add, edit, or remove games supported on the platform."
        actions={
          <Button onClick={openNewGameDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Game
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingGame ? "Edit Game" : "Add New Game"}</DialogTitle>
            <DialogDescription>
              {editingGame ? "Update the details for this game." : "Enter the details for the new game."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" {...form.register("name")} className="col-span-3" />
              {form.formState.errors.name && <p className="col-span-4 text-destructive text-xs text-right">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="iconUrl" className="text-right">Icon URL</Label>
              <Input id="iconUrl" {...form.register("iconUrl")} className="col-span-3" placeholder="https://example.com/icon.png"/>
              {form.formState.errors.iconUrl && <p className="col-span-4 text-destructive text-xs text-right">{form.formState.errors.iconUrl.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bannerUrl" className="text-right">Banner URL</Label>
              <Input id="bannerUrl" {...form.register("bannerUrl")} className="col-span-3" placeholder="https://example.com/banner.png (Optional)"/>
              {form.formState.errors.bannerUrl && <p className="col-span-4 text-destructive text-xs text-right">{form.formState.errors.bannerUrl.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.length > 0 ? games.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  <Image src={game.iconUrl} alt={game.name} width={40} height={40} className="rounded-md" data-ai-hint="game logo"/>
                </TableCell>
                <TableCell className="font-medium">{game.name}</TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(game)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(game.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  No games added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
