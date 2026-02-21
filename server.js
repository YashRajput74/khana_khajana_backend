import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import recipesRoute from "./routes/recipes.js";
import plannerRoute from "./routes/planner.js";
import aiRoute from "./routes/ai.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "API running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.use("/api/recipes", recipesRoute);
app.use("/api/planner", plannerRoute);
app.use("/api/ai", aiRoute);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

