import express from "express";
import {
  createRecord,
  deleteRecordController,
  getRecords,
  updateRecord,
} from "../controllers/records.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createRecordSchema,
  updateRecordSchema,
} from "../validators/records.validator.js";

const router = express.Router();

router.post("/", authMiddleware, authorizePermission("RECORDS", "CREATE"), validate(createRecordSchema), createRecord);
router.get("/", authMiddleware, authorizePermission("RECORDS", "READ"), getRecords);
router.put(
  "/:id",
  authMiddleware,
  authorizePermission("RECORDS", "UPDATE"),
  validate(updateRecordSchema),
  updateRecord,
);
router.delete(
  "/:id",
  authMiddleware,
  authorizePermission("RECORDS", "DELETE"),
  deleteRecordController,
);

export default router;
