import express from "express";
import supabase from "../supabaseClient.js";

const router = express.Router();
const DEMO_USER_ID = "user_001";

router.get("/", async (req, res) => {
    const { data, error } = await supabase
        .from("planner")
        .select("*")
        .eq("user_id", DEMO_USER_ID);

    if (error) {
        console.error("GET planner error:", error);
        return res.status(400).json(error);
    }

    res.json(data);
});

router.patch("/:date", async (req, res) => {
    const { date } = req.params;
    const { recipe_id } = req.body;

    const { data, error } = await supabase
        .from("planner")
        .upsert(
            {
                date,
                recipe_id,
                user_id: DEMO_USER_ID
            },
            { onConflict: "date,user_id" }
        )
        .select()
        .single();

    if (error) {
        console.error("PATCH planner error:", error);
        return res.status(400).json(error);
    }

    res.json(data);
});

export default router;