import express from "express";
import supabase from "../supabaseClient.js";
import { decodeUser } from "../middleware/auth.js";

const router = express.Router();
router.use(decodeUser);

const starterRecipes = [
    {
        id: "paneer-butter-masala",
        title: "Paneer Butter Masala",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAe0iVWSKEZ-GE2ewFL-maWJ8TPyqeQAH2Mzm7OOnhsBXtqJnW4Eu_Dr9GF_DHKHwN1sQY7R4h3-ian5ZjBNzAJL9wIu0UxNg0ov09EALn5V-FzKT8AOP-c4b2IpsrrQrx5bxiu1mmZLDoU5cyb125QvnV0hCloFbujX_YJd-t-3T-8U7HBjtnxKAYL0JeIL0DfslOBTKYmnhIZxzYvLRi1Iuyo7CXJNSdOuXXaQfzJo_mvUFJ-FyZLIhQM4vWOqZz1MpFfpS5Zn9k",
        category: "Main Course"
    },
    {
        id: "aloo-gobi",
        title: "Aloo Gobi Dry",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAc4vRS_qZTAqUUMyNMLjtUxetkQTaoGQCzV3V-OY1RPDSqJdxmwVXvILNss3e88R3_A4WVdyrw-uCYZsrFZCYkOR7DmCp6H0ssa3ey0niGIKKmDG8s8aTorpsima1No3LNwKzNmPGoVrq_n5AESS2IECLLQrZpMpYY7V8MkEvtGzSEWL19ozS_ND2GF4KafD5K8kD1GfVFn457KOH4QaSudy-8qcnR-1kGoOEjDS2xs18e0x3w4XdQOUvl9kEKGn2t2w78NqOxiYk",
        category: "Main Course"
    },
    {
        id: "hyderabadi-veg-biryani",
        title: "Hyderabadi Veg Biryani",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPP217iCXKw29XABMLwjh-e79Y1MrSZD7E55fn7aNl4t5z7bTuZ848fRhLLbAPLh0PZ2o6IBaOfKWReY7dMPqzJT7TFOvlW2sCgaVWOO82EVdQKjAnnS5UN5cLVD1wtZq51sAhze5VRhIcTfDWIqWzEuk6sZr28rH5iSS1hiOlJRdtSXvSKJaj6I1Owb44mxLbf4d4MQxLVyt9qQnN28O2kAGlG1NJHNoUvdZC-rcEf7buCVZNa6Gfl9OYL-38ZvT9ODxz1h3Fu-c",
        category: "Main Course"
    },
    {
        id: "dal-makhani",
        title: "Dal Makhani",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAN1Tmkz2AbOQVkaeV8_bwDqOSNJ9glhqldxYVeGIf3jRGJzMwikdEO3IfKr4GCIWOYUTnspZzO7-Hd8sMg8zI57LCwRfHy66ss9lchGMCdThtNaow3QBnJtnLwmCmUpFKKjkWs1TM4MSN0rbLDHB-qWMcdh10VrevYiSBO0fYcOMMwOG8OZ4vL1s1cw6LBcqFE3aJHRwOcvdC0m9zufVbH2FCteuIhdYtQBABCo-6J_X6mBLSbwrmdRdzJtg4Hn5niA89127aL13A",
        category: "Main Course"
    },
    {
        id: "palak-paneer",
        title: "Palak Paneer",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBisNL31wXja84sEXRrupJ-CQoscoECZGBeLtVFNG80wP-54SJjYIg7sPYdgd5MvZmJJy_8cQCk6sg1WkcU0hqwqKnd-SBNZFvD4gjQCKGTACQ3NwAHWRTPhAR6smNkNmd0evKT7ACbxBX_5ooVNH0t7LlEjpA1OhtKaOw1BxdYP6t8nR2NQHn8xnPALVnFtsj0YVMXtkDWVf3iqAbe0t0b-CttljuvdbwqGK7UYVTGZVjg0Ey60D57pzfy3YnVIvU7wARVzh7aLfE",
        category: "Main Course"
    }
];

router.get("/", async (req, res) => {

    const userId = req.user.sub;

    const { data: recipes, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", userId);

    if (error) {
        console.error("GET recipes error:", error);
        return res.status(400).json(error);
    }

    if (recipes.length === 0) {

        const starterData = starterRecipes.map(r => ({
            id: r.id,
            title: r.title,
            image: r.image,
            category: r.category,
            tags: [],
            cooking_time: null,
            added_at: new Date().toISOString(),
            last_cooked_at: null,
            is_favorite: false,
            is_safe_repeat: false,
            steps: [],
            user_id: userId
        }));

        await supabase
            .from("recipes")
            .insert(starterData);
    }

    const { data: finalRecipes } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", userId);

    res.json(finalRecipes);

});

router.post("/", async (req, res) => {
    const title = req.body.title?.trim();

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
        is_safe_repeat: false,
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
print('hello world')
