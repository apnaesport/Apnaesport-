
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Upload } from "lucide-react";
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
import { getGames, addGame, updateGameInStore, deleteGameFromStore, subscribe } from "@/lib/tournamentStore";


const gameSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Game name must be at least 2 characters."),
  iconUrl: z.string().url("Must be a valid URL for the icon.").or(z.literal('')).optional(), // Optional if file is provided
  bannerUrl: z.string().url("Must be a valid URL for the banner.").optional().or(z.literal('')),
  iconFile: z.custom<FileList>().optional(),
  bannerFile: z.custom<FileList>().optional(),
});
type GameFormData = z.infer<typeof gameSchema>;

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);


  useEffect(() => {
    setGames(getGames());
    setIsLoading(false);
    const unsubscribe = subscribe(() => {
      setGames(getGames());
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: { name: "", iconUrl: "", bannerUrl: "" },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'icon') {
          setIconPreview(reader.result as string);
          form.setValue('iconUrl', reader.result as string); // Store as data URL
        } else {
          setBannerPreview(reader.result as string);
          form.setValue('bannerUrl', reader.result as string); // Store as data URL
        }
      };
      reader.readAsDataURL(file);
    } else {
       if (type === 'icon') setIconPreview(null);
       else setBannerPreview(null);
    }
  };


  const onSubmit: SubmitHandler<GameFormData> = async (data) => {
    form.clearErrors();
    
    let finalIconUrl = data.iconUrl;
    let finalBannerUrl = data.bannerUrl;

    if (form.getValues('iconFile')?.[0] && iconPreview) {
        finalIconUrl = iconPreview; // Use data URL from preview
    } else if (!finalIconUrl && !editingGame?.iconUrl) {
         finalIconUrl = `https://placehold.co/40x40.png?text=${data.name.substring(0,2)}`;
    }


    if (form.getValues('bannerFile')?.[0] && bannerPreview) {
        finalBannerUrl = bannerPreview;
    } else if (!finalBannerUrl && !editingGame?.bannerUrl) {
        finalBannerUrl = `https://placehold.co/400x300.png?text=${encodeURIComponent(data.name)}`;
    }
    
    // Validate URLs if they are not data URLs
    if (finalIconUrl && !finalIconUrl.startsWith('data:image') && !finalIconUrl.startsWith('https://placehold.co') && !finalIconUrl.startsWith('http')) {
      form.setError("iconUrl", { type: "manual", message: "Icon URL must be a valid URL or a placehold.co URL." });
    }
     if (finalBannerUrl && !finalBannerUrl.startsWith('data:image') && !finalBannerUrl.startsWith('https://placehold.co') && !finalBannerUrl.startsWith('http')) {
      form.setError("bannerUrl", { type: "manual", message: "Banner URL must be a valid URL or a placehold.co URL." });
    }

    if (form.formState.errors.name || form.formState.errors.iconUrl || form.formState.errors.bannerUrl) return;

    setIsLoading(true);
    try {
      const gameDataToSave: Game = {
        id: editingGame ? editingGame.id : `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: data.name,
        iconUrl: finalIconUrl || "https://placehold.co/40x40.png", // Fallback
        bannerUrl: finalBannerUrl || "https://placehold.co/400x300.png", // Fallback
      };

      if (editingGame) {
        updateGameInStore(gameDataToSave);
        toast({ title: "Game Updated", description: `${data.name} has been updated.` });
      } else {
        addGame(gameDataToSave);
        toast({ title: "Game Added", description: `${data.name} has been added.` });
      }
      form.reset();
      setIconPreview(null);
      setBannerPreview(null);
      setIsDialogOpen(false);
      setEditingGame(null);
    } catch (error) {
      console.error("Error saving game:", error);
      toast({ title: "Error", description: "Could not save game.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    form.reset({ name: game.name, iconUrl: game.iconUrl, bannerUrl: game.bannerUrl || "" });
    setIconPreview(game.iconUrl);
    setBannerPreview(game.bannerUrl || null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (gameId: string) => {
    if (confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
      setIsLoading(true);
      try {
        deleteGameFromStore(gameId);
        toast({ title: "Game Deleted", description: "The game has been removed.", variant: "destructive" });
      } catch (error) {
        console.error("Error deleting game:", error);
        toast({ title: "Error", description: "Could not delete game.", variant: "destructive" });
      }
      setIsLoading(false);
    }
  };

  const openNewGameDialog = () => {
    setEditingGame(null);
    form.reset({ name: "", iconUrl: "", bannerUrl: "" });
    setIconPreview(null);
    setBannerPreview(null);
    setIsDialogOpen(true);
  };
  
  if (isLoading && games.length === 0) return <p>Loading games...</p>;

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Games"
        subtitle="Add, edit, or remove games supported on the platform."
        actions={
          <Button onClick={openNewGameDialog} disabled={form.formState.isSubmitting || isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Game
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          form.reset();
          setIconPreview(null);
          setBannerPreview(null);
        }
      }}>
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
            
            {/* Icon Upload/URL */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="iconFile" className="text-right">Icon</Label>
              <Input id="iconFile" type="file" {...form.register("iconFile")} className="col-span-3 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" accept="image/*" onChange={(e) => handleFileChange(e, 'icon')}/>
            </div>
            {iconPreview && <Image src={iconPreview} alt="Icon preview" width={40} height={40} className="col-start-2 col-span-3 rounded-md border data-ai-hint='game icon preview'"/>}
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="iconUrl" className="text-right">Or Icon URL</Label>
                 <Input id="iconUrl" {...form.register("iconUrl")} className="col-span-3" placeholder="https://placehold.co/40x40.png"/>
                 {form.formState.errors.iconUrl && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.iconUrl.message}</p>}
            </div>


            {/* Banner Upload/URL */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bannerFile" className="text-right">Banner</Label>
              <Input id="bannerFile" type="file" {...form.register("bannerFile")} className="col-span-3 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
            </div>
            {bannerPreview && <Image src={bannerPreview} alt="Banner preview" width={200} height={150} className="col-start-2 col-span-3 rounded-md border data-ai-hint='game banner preview'"/>}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bannerUrl" className="text-right">Or Banner URL</Label>
                <Input id="bannerUrl" {...form.register("bannerUrl")} className="col-span-3" placeholder="https://placehold.co/400x300.png"/>
                {form.formState.errors.bannerUrl && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.bannerUrl.message}</p>}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={form.formState.isSubmitting || isLoading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting || isLoading ? "Saving..." : "Save changes"}
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
                    onError={(e) => (e.currentTarget.src = `https://placehold.co/40x40.png?text=${game.name.substring(0,2)}`)} />
                </TableCell>
                <TableCell className="font-medium">{game.name}</TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(game)} disabled={form.formState.isSubmitting || isLoading}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(game.id)} disabled={form.formState.isSubmitting || isLoading}>
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
