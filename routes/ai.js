import express from "express";
import { OpenAI } from "openai";
import supabase from "../supabaseClient.js";
import { decodeUser } from "../middleware/auth.js";

const router = express.Router();

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

router.use(decodeUser);

router.post("/suggest", async (req, res) => {
    try {
        const { query, excludedIds = [] } = req.body;

        if (!query) {
            return res.status(400).json({ message: "Query is required" });
        }

        const { data: recipes, error } = await supabase
            .from("recipes")
            .select("id, title, category, tags, cooking_time, last_cooked_at")
            .eq("user_id", req.user.sub);

        if (error) {
            console.error("Recipe fetch error:", error);
            return res.status(500).json({ message: "Failed to load recipes" });
        }

        if (!recipes || recipes.length === 0) {
            return res.json({ noMore: true, message: "No saved recipes found." });
        }

        const today = new Date().toISOString().split("T")[0];

        const filteredRecipes = recipes.filter(r => {
            if (excludedIds.includes(r.id)) return false;

            if (r.last_cooked_at) {
                const cookedDate = new Date(r.last_cooked_at)
                    .toISOString()
                    .split("T")[0];

                if (cookedDate === today) return false;
            }

            return true;
        });

        if (filteredRecipes.length === 0) {
            return res.json({
                noMore: true,
                message: `No more matching dishes left for "${query}".`
            });
        }

        const recipeList = filteredRecipes.map(r => `
ID: ${r.id}
Title: ${r.title}
Category: ${r.category}
Tags: ${r.tags?.join(", ")}
Cooking Time: ${r.cooking_time ?? "Unknown"} mins
        `).join("\n");

        const prompt = `
User wants: "${query}"

Here are their saved recipes:

${recipeList}

Choose ONE matching recipe at random from the list.
If multiple recipes match well, rotate fairly.

Respond ONLY in valid JSON format:
{
  "recipeId": "...",
  "title": "...",
  "description": "...",
  "badge": "Quick" | "Healthy" | "Comfort" | "Spicy"
}
Do NOT include explanations.
        `;

        const response = await client.responses.create({
            model: "openai/gpt-oss-20b",
            input: prompt
        });

        let parsed;
        try {
            parsed = JSON.parse(response.output_text);
        } catch {
            console.error("AI returned invalid JSON:", response.output_text);
            return res.json(null);
        }

        res.json(parsed);

    } catch (error) {
        console.error("Groq error:", error);
        res.status(500).json({ message: "AI failed" });
    }
});

export default router;