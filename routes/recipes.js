import express from "express";
import supabase from "../supabaseClient.js";
import { decodeUser } from "../middleware/auth.js";

const router = express.Router();
router.use(decodeUser);

router.get("/", async (req, res) => {
    const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", req.user.sub)

    if (error) {
        console.error("GET recipes error:", error);
        return res.status(400).json(error);
    }
/*  */
    res.json(data);
});

router.post("/", async (req, res) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ message: "Title is required" });
    }

    const newRecipe = {
        id: `rec_${Date.now()}`,
        title,
        image: null,
        category: "Uncategorized",
        tags: [],
        cooking_time: null,
        added_at: new Date().toISOString(),
        last_cooked_at: null,
        is_favorite: false,
        steps: [],
        user_id: req.user.sub
    };

    const { data, error } = await supabase
        .from("recipes")
        .insert([newRecipe])
        .select()
        .single();

    if (error) {
        console.error("POST recipe error:", error);
        return res.status(400).json(error);
    }

    res.status(201).json(data);
});

router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
        .from("recipes")
        .update(updates)
        .eq("id", id)
        .eq("user_id", req.user.sub)
        .select()
        .single();

    if (error) {
        console.error("PATCH recipe error:", error);
        return res.status(400).json(error);
    }

    res.json(data);
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id)
        .eq("user_id", req.user.sub)

    if (error) {
        console.error("DELETE recipe error:", error);
        return res.status(400).json(error);
    }

    res.json({ message: "Recipe deleted successfully" });
});

export default router;