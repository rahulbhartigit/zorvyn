import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import recordsRoutes from "./routes/records.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

const file = fs.readFileSync("./openapi.yaml", "utf8");
const swaggerDocument = YAML.load("./openapi.yaml");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
});
