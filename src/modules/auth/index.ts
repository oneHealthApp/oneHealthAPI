import { Router } from "express";
import registerRoutes from "./register/register.routes";

const authRouter = Router();

// Add sub-routes here
authRouter.use("/auth", registerRoutes);

export default authRouter;
