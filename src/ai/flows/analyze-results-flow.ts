
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Participant } from '@/lib/types';

export const AnalyzeTournamentResultsInputSchema = z.object({
  tournamentName: z.string().describe('The name of the tournament.'),
  gameName: z.string().describe('The name of the game played.'),
  participants: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).describe('A list of all registered participants in the tournament.'),
  screenshotDataUri: z.string().describe("A screenshot of the final tournament results, as a data URI including MIME type and Base64 encoding. E.g., 'data:image/png;base64,...'."),
});

export const AnalyzeTournamentResultsOutputSchema = z.object({
  winners: z.array(z.object({
    rank: z.number().int().min(1).max(3),
    id: z.string().describe("The participant's unique ID from the input list."),
    name: z.string().describe("The participant's name."),
  })).describe('An array of the top 3 winners, identified from the participants list. The array should be sorted by rank.'),
});

export type AnalyzeTournamentResultsInput = z.infer<typeof AnalyzeTournamentResultsInputSchema>;
export type AnalyzeTournamentResultsOutput = z.infer<typeof AnalyzeTournamentResultsOutputSchema>;

export async function analyzeTournamentResults(input: AnalyzeTournamentResultsInput): Promise<AnalyzeTournamentResultsOutput> {
    return analyzeResultsFlow(input);
}


const analyzeResultsFlow = ai.defineFlow(
  {
    name: 'analyzeResultsFlow',
    inputSchema: AnalyzeTournamentResultsInputSchema,
    outputSchema: AnalyzeTournamentResultsOutputSchema,
  },
  async (input) => {
    const prompt = `
        You are an expert at analyzing esports tournament result screenshots.
        Your task is to identify the top 3 winners from the provided screenshot and match them to the list of registered participants.

        Tournament Name: "${input.tournamentName}"
        Game: "${input.gameName}"

        Registered Participants:
        ${input.participants.map(p => `- ${p.name} (ID: ${p.id})`).join('\n')}

        Analyze the following screenshot of the final results:
        {{media url=screenshotDataUri}}

        Based on the screenshot, identify the players who came in 1st, 2nd, and 3rd place.
        Match their in-game names from the screenshot to the names in the "Registered Participants" list.

        You MUST return a JSON object with a "winners" array containing exactly three objects, one for each of the top 3 ranks.
        Each object in the array must include the 'rank', the participant's 'id' from the provided list, and their 'name'.
        The output must be sorted by rank, from 1 to 3.
        If you cannot clearly determine a winner for a specific rank, do your best to make an educated guess based on the visual evidence.
    `;

    const { output } = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        format: 'json',
        schema: AnalyzeTournamentResultsOutputSchema,
      },
      context: [{ screenshotDataUri: input.screenshotDataUri }],
    });

    return output || { winners: [] };
  }
);
