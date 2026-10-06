import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mentorbridgeRouter from "./mentorbridge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mentorbridgeRouter);

export default router;
