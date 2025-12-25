import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { queryRequestSchema } from "../middleware/validation";
import { ragService } from "../services/RAGService";
import logger from "../utils/logger";

export const queryRepository = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedData = queryRequestSchema.parse(req.body);

    logger.info(
      {
        repoId: validatedData.repoId,
        query: validatedData.query,
        scope: validatedData.scope,
      },
      "Query requested",
    );

    const result = await ragService.query(validatedData);

    res.json(result);
  },
);
