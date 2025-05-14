
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
// For a real backend, you would import Firebase functions e.g.:
// import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query } from "firebase/firestore";
// import { db } from "@/lib/firebase"; // Assuming db is your Firestore instance

const initialGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png" },
];

const gameSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Game name must be at least 2 characters."),
  iconUrl: z.string().url("Must be a valid URL for the icon.").or(z.literal('')),
  bannerUrl: z.string().url("Must be a valid URL for the banner.").optional().or(z.literal('')),
});
type GameFormData = z.infer<typeof gameSchema>;

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const { toast } = useToast();
  // const [isLoading, setIsLoading] = useState(true); // For real data fetching

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: { name: "", iconUrl: "", bannerUrl: "" },
  });

  // Example: Fetch games from Firestore (uncomment and adapt for real backend)
  // useEffect(() => {
  //   const fetchGames = async () => {
  //     setIsLoading(true);
  //     try {
  //       const q = query(collection(db, "games"));
  //       const querySnapshot = await getDocs(q);
  //       const fetchedGames: Game[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
  //       setGames(fetchedGames);
  //     } catch (error) {
  //       console.error("Error fetching games:", error);
  //       toast({ title: "Error", description: "Could not fetch games.", variant: "destructive" });
  //     }
  //     setIsLoading(false);
  //   };
  //   fetchGames();
  // }, [toast]);

  const onSubmit: SubmitHandler<GameFormData> = async (data) => {
    form.clearErrors(); // Clear previous errors
    if (!data.iconUrl) {
      form.setError("iconUrl", { type: "manual", message: "Icon URL is required."});
      // return; // Keep dialog open if icon URL is missing
    }
    if (data.iconUrl && !data.iconUrl.startsWith('https://placehold.co') && !data.iconUrl.startsWith('http')) {
         form.setError("iconUrl", { type: "manual", message: "Icon URL must be a valid http/https URL or a placehold.co URL."});
    }
     if (data.bannerUrl && !data.bannerUrl.startsWith('https://placehold.co') && !data.bannerUrl.startsWith('http')) {
         form.setError("bannerUrl", { type: "manual", message: "Banner URL must be a valid http/https URL or a placehold.co URL."});
    }

    if (form.formState.errors.iconUrl || form.formState.errors.bannerUrl || form.formState.errors.name) return;


    // setIsLoading(true); // For real backend operations
    try {
      if (editingGame) {
        // Example: Update game in Firestore
        // await updateDoc(doc(db, "games", editingGame.id), data);
        setGames(games.map(g => g.id === editingGame.id ? { ...g, ...data, id: editingGame.id } : g));
        toast({ title: "Game Updated", description: `${data.name} has been updated.` });
      } else {
        const newGameWithId = { ...data, id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
        // Example: Add new game to Firestore
        // const docRef = await addDoc(collection(db, "games"), data);
        // newGameWithId.id = docRef.id; // Assign Firestore-generated ID
        setGames([...games, newGameWithId as Game]);
        toast({ title: "Game Added", description: `${data.name} has been added.` });
      }
      form.reset();
      setIsDialogOpen(false);
      setEditingGame(null);
    } catch (error) {
      console.error("Error saving game:", error);
      toast({ title: "Error", description: "Could not save game.", variant: "destructive" });
    }
    // setIsLoading(false);
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    form.reset({ name: game.name, iconUrl: game.iconUrl, bannerUrl: game.bannerUrl || "" });
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (gameId: string) => {
    if (confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
      // setIsLoading(true);
      try {
        // Example: Delete game from Firestore
        // await deleteDoc(doc(db, "games", gameId));
        setGames(games.filter(g => g.id !== gameId));
        toast({ title: "Game Deleted", description: "The game has been removed.", variant: "destructive" });
      } catch (error) {
        console.error("Error deleting game:", error);
        toast({ title: "Error", description: "Could not delete game.", variant: "destructive" });
      }
      // setIsLoading(false);
    }
  };

  const openNewGameDialog = () => {
    setEditingGame(null);
    form.reset({ name: "", iconUrl: "", bannerUrl: "" });
    setIsDialogOpen(true);
  };
  
  // if (isLoading && games.length === 0) return <p>Loading games...</p>; // Initial loading state

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Games"
        subtitle="Add, edit, or remove games supported on the platform."
        actions={
          <Button onClick={openNewGameDialog} disabled={form.formState.isSubmitting}>
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
              {form.formState.errors.name && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="iconUrl" className="text-right">Icon URL</Label>
              <Input id="iconUrl" {...form.register("iconUrl")} className="col-span-3" placeholder="https://placehold.co/40x40.png"/>
              {form.formState.errors.iconUrl && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.iconUrl.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bannerUrl" className="text-right">Banner URL</Label>
              <Input id="bannerUrl" {...form.register("bannerUrl")} className="col-span-3" placeholder="https://placehold.co/400x300.png (Optional)"/>
              {form.formState.errors.bannerUrl && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.bannerUrl.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={form.formState.isSubmitting}>Cancel</Button>
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
                  <Image 
                    src={game.iconUrl || "https://placehold.co/40x40.png"} 
                    alt={game.name} 
                    width={40} 
                    height={40} 
                    className="rounded-md" 
                    data-ai-hint="game logo"
                    onError={(e) => e.currentTarget.src = "https://placehold.co/40x40.png"} />
                </TableCell>
                <TableCell className="font-medium">{game.name}</TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(game)} disabled={form.formState.isSubmitting}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(game.id)} disabled={form.formState.isSubmitting}>
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
