
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { getGamesFromFirestore, addGameToFirestore, updateGameInFirestore, deleteGameFromFirestore } from "@/lib/tournamentStore";

const gameSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Game name must be at least 2 characters."),
  iconUrl: z.string().url("Must be a valid URL for the icon.").or(z.literal('')).optional(),
  bannerUrl: z.string().url("Must be a valid URL for the banner.").optional().or(z.literal('')),
  iconFile: z.custom<FileList>().optional(),
  bannerFile: z.custom<FileList>().optional(),
  dataAiHint: z.string().max(30, "AI Hint too long (max 2 words recommended)").optional(),
});
type GameFormData = z.infer<typeof gameSchema>;

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedGames = await getGamesFromFirestore();
      setGames(fetchedGames);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast({ title: "Error", description: "Could not fetch games.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: { name: "", iconUrl: "", bannerUrl: "", dataAiHint: "" },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'icon') {
          setIconPreview(result);
          form.setValue('iconUrl', result); 
        } else {
          setBannerPreview(result);
          form.setValue('bannerUrl', result); 
        }
      };
      reader.readAsDataURL(file);
    } else {
       if (type === 'icon') {
        setIconPreview(editingGame?.iconUrl || null);
        form.setValue('iconUrl', editingGame?.iconUrl || "");
       } else {
        setBannerPreview(editingGame?.bannerUrl || null);
        form.setValue('bannerUrl', editingGame?.bannerUrl || "");
       }
    }
  };

  const onSubmit: SubmitHandler<GameFormData> = async (data) => {
    setIsSubmitting(true);
    form.clearErrors();
    
    let finalIconUrl = data.iconUrl;
    let finalBannerUrl = data.bannerUrl;

    if (iconPreview && iconPreview.startsWith('data:image')) { 
        finalIconUrl = iconPreview;
    } else if (!finalIconUrl && !editingGame?.iconUrl) { // Only set placeholder if no URL and no existing icon
         finalIconUrl = `https://placehold.co/40x40.png?text=${data.name.substring(0,2)}`;
    }

    if (bannerPreview && bannerPreview.startsWith('data:image')) {
        finalBannerUrl = bannerPreview;
    } else if (!finalBannerUrl && !editingGame?.bannerUrl) { // Only set placeholder if no URL and no existing banner
        finalBannerUrl = `https://placehold.co/400x300.png?text=${encodeURIComponent(data.name)}`;
    }
    
    // Validate URLs if they are not Data URIs or known placeholder service
    if (finalIconUrl && !finalIconUrl.startsWith('data:image') && !finalIconUrl.startsWith('https://placehold.co') && !z.string().url().safeParse(finalIconUrl).success) {
      form.setError("iconUrl", { type: "manual", message: "Icon URL must be a valid URL." });
    }
    if (finalBannerUrl && !finalBannerUrl.startsWith('data:image') && !finalBannerUrl.startsWith('https://placehold.co') && !z.string().url().safeParse(finalBannerUrl).success) {
      form.setError("bannerUrl", { type: "manual", message: "Banner URL must be a valid URL." });
    }

    if (Object.keys(form.formState.errors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      const gameDataToSave: Omit<Game, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        iconUrl: finalIconUrl || `https://placehold.co/40x40.png?text=${data.name.substring(0,2)}`,
        bannerUrl: finalBannerUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(data.name)}`,
        dataAiHint: data.dataAiHint || data.name.toLowerCase().split(" ").slice(0,2).join(" "),
      };

      if (editingGame && editingGame.id) {
        await updateGameInFirestore(editingGame.id, gameDataToSave);
        toast({ title: "Game Updated", description: `${data.name} has been updated.` });
      } else {
        await addGameToFirestore(gameDataToSave);
        toast({ title: "Game Added", description: `${data.name} has been added.` });
      }
      await fetchGames();
      form.reset();
      setIconPreview(null);
      setBannerPreview(null);
      setIsDialogOpen(false);
      setEditingGame(null);
    } catch (error) {
      console.error("Error saving game:", error);
      toast({ title: "Error", description: "Could not save game.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    form.reset({ 
      name: game.name, 
      iconUrl: game.iconUrl,
      bannerUrl: game.bannerUrl || "",
      dataAiHint: game.dataAiHint || ""
    });
    setIconPreview(game.iconUrl);
    setBannerPreview(game.bannerUrl || null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (gameId: string, gameName: string) => {
    setIsDeleting(gameId); 
    try {
      await deleteGameFromFirestore(gameId);
      toast({ title: "Game Deleted", description: `"${gameName}" has been removed.`, variant: "destructive" });
      await fetchGames(); 
    } catch (error) {
      console.error("Error deleting game:", error);
      toast({ title: "Error", description: `Could not delete "${gameName}".`, variant: "destructive" });
    }
    setIsDeleting(null);
  };

  const openNewGameDialog = () => {
    setEditingGame(null);
    form.reset({ name: "", iconUrl: "", bannerUrl: "", dataAiHint:"" });
    setIconPreview(null);
    setBannerPreview(null);
    setIsDialogOpen(true);
  };
  
  if (isLoading && games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Games"
        subtitle="Add, edit, or remove games supported on the platform."
        actions={
          <Button onClick={openNewGameDialog} disabled={isSubmitting || isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Game
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (isSubmitting) return; 
        setIsDialogOpen(open);
        if (!open) {
          form.reset();
          setIconPreview(null);
          setBannerPreview(null);
          setEditingGame(null);
          form.clearErrors(); // Clear errors when dialog closes
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingGame ? "Edit Game" : "Add New Game"}</DialogTitle>
            <DialogDescription>
              {editingGame ? "Update the details for this game." : "Enter the details for the new game."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" {...form.register("name")} className="col-span-3" disabled={isSubmitting} />
              {form.formState.errors.name && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="iconFile" className="text-right">Icon</Label>
              <Input id="iconFile" type="file" {...form.register("iconFile")} className="col-span-3 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" accept="image/*" onChange={(e) => handleFileChange(e, 'icon')} disabled={isSubmitting}/>
            </div>
            {iconPreview && <div className="col-start-2 col-span-3"><Image src={iconPreview} alt="Icon preview" width={40} height={40} className="rounded-md border object-cover" data-ai-hint='game icon preview' unoptimized={iconPreview.startsWith('data:image')}/></div>}
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="iconUrl" className="text-right">Or Icon URL</Label>
                 <Input id="iconUrl" {...form.register("iconUrl")} className="col-span-3" placeholder="https://example.com/icon.png" disabled={isSubmitting}/>
                 {form.formState.errors.iconUrl && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.iconUrl.message}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bannerFile" className="text-right">Banner</Label>
              <Input id="bannerFile" type="file" {...form.register("bannerFile")} className="col-span-3 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} disabled={isSubmitting}/>
            </div>
            {bannerPreview && <div className="col-start-2 col-span-3"><Image src={bannerPreview} alt="Banner preview" width={200} height={112} className="rounded-md border object-cover aspect-[16/9]" data-ai-hint='game banner preview' unoptimized={bannerPreview.startsWith('data:image')}/></div>}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bannerUrl" className="text-right">Or Banner URL</Label>
                <Input id="bannerUrl" {...form.register("bannerUrl")} className="col-span-3" placeholder="https://example.com/banner.png" disabled={isSubmitting}/>
                {form.formState.errors.bannerUrl && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.bannerUrl.message}</p>}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataAiHint" className="text-right">AI Hint</Label>
              <Input id="dataAiHint" {...form.register("dataAiHint")} className="col-span-3" placeholder="e.g. esports game, fps shooter" disabled={isSubmitting}/>
              <p className="col-start-2 col-span-3 text-xs text-muted-foreground">Keywords for AI image search (max 2 words).</p>
               {form.formState.errors.dataAiHint && <p className="col-span-4 text-destructive text-xs text-right mt-1">{form.formState.errors.dataAiHint.message}</p>}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">AI Hint</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.length > 0 ? games.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  <Image 
                    src={game.iconUrl || `https://placehold.co/40x40.png?text=${game.name.substring(0,1)}`} 
                    alt={game.name} 
                    width={40} 
                    height={40} 
                    className="rounded-md object-cover" 
                    data-ai-hint={game.dataAiHint || "game logo"}
                    unoptimized={game.iconUrl.startsWith('data:image')} 
                    onError={(e) => (e.currentTarget.src = `https://placehold.co/40x40.png?text=${game.name.substring(0,2)}`)} />
                </TableCell>
                <TableCell className="font-medium">{game.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{game.dataAiHint}</TableCell>
                <TableCell className="space-x-1 sm:space-x-2 whitespace-nowrap text-right">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(game)} disabled={isSubmitting || isDeleting === game.id}>
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isSubmitting || isDeleting === game.id}>
                        {isDeleting === game.id ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                        <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the game "{game.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(game.id, game.name)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No games added yet. Click "Add New Game" to start.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
