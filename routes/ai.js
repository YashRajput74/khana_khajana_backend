import express from "express";
import { OpenAI } from "openai";
import supabase from "../supabaseClient.js";
import { decodeUser } from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";
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

        /* -------------------------
           1. Ask AI for intent
        --------------------------*/

        const intentPrompt = `
User said: "${query}"

You are an assistant inside a personal recipe manager app.

Determine the user's intent.

Possible intents:

1. suggest
User wants meal ideas.

Examples:
"what should I cook"
"something spicy"

2. open_recipe
User asked for a specific recipe.

Examples:
"paneer butter masala"
"show dal makhani"
"how to make kadhi chawal"
"recipe for ramen"

3. create_recipe
User wants to add a new recipe.

Examples:
"add a recipe"
"create new dish"
"add a new recipe"

4. explain_app
User asked something unrelated.

Respond ONLY in JSON format:

{
  "intent": "suggest" | "open_recipe" | "create_recipe" | "explain_app",
  "recipeTitle": "optional"
}
`;

        const aiResponse = await client.responses.create({
            model: "openai/gpt-oss-20b",
            input: intentPrompt
        });

        let intentResult;

        try {
            intentResult = JSON.parse(aiResponse.output_text);
        } catch {
            return res.json({
                type: "message",
                text: "Sorry, I didn't understand that."
            });
        }

        /* -------------------------
           2. Load user recipes
        --------------------------*/

        const { data: recipes, error } = await supabase
            .from("recipes")
            .select("id, title, category, tags, cooking_time, last_cooked_at")
            .eq("user_id", req.user.sub);

        if (error) {
            console.error("Recipe fetch error:", error);
            return res.status(500).json({ message: "Failed to load recipes" });
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

        /* -------------------------
           3. Handle intents
        --------------------------*/

        /* ---- Suggest dishes ---- */

        if (intentResult.intent === "suggest") {

            const shuffled = filteredRecipes.sort(() => 0.5 - Math.random());

            const suggestions = shuffled.slice(0, 5).map(r => ({
                id: r.id
            }));

            return res.json({
                type: "suggestions",
                suggestions
            });
        }

        /* ---- Open recipe ---- */

        if (intentResult.intent === "open_recipe") {

            const title = (intentResult.recipeTitle || query).toLowerCase();

            const found = recipes.find(r =>
                r.title.toLowerCase().includes(title)
            );

            if (!found) {
                return res.json({
                    type: "message",
                    text: `No recipe found for "${intentResult.recipeTitle || query}".`
                });
            }

            return res.json({
                type: "open_recipe",
                recipeId: found.id
            });
        }

        /* ---- Create recipe ---- */

        if (intentResult.intent === "create_recipe") {

            const newRecipe = {
                id: uuidv4(),
                title: "New Recipe",
                image: null,
                category: "Uncategorized",
                tags: [],
                cooking_time: null,
                added_at: new Date().toISOString(),
                last_cooked_at: null,
                is_favorite: false,
                is_safe_repeat: false,
                steps: [],
                user_id: req.user.sub
            };

            const { data, error } = await supabase
                .from("recipes")
                .insert(newRecipe)
                .select()
                .single();

            if (error) {
                console.error("Recipe creation error:", error);
                return res.status(500).json({
                    message: "Failed to create recipe",
                    error: error.message
                });
            }

            return res.json({
                type: "create_recipe",
                recipeId: data.id
            });
        }

        /* ---- Explain app ---- */

        return res.json({
            type: "message",
            text: "You can ask me for meal ideas or manage your saved recipes."
        });

    } catch (error) {
        console.error("AI route error:", error);
        res.status(500).json({ message: "AI failed" });
    }
});

export default router;