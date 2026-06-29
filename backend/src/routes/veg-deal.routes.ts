import { Router, Request, Response, NextFunction } from "express";
import { vegDealService } from "../services/veg-deal.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import { vegEventBus } from "../services/veg-events.service.js";
import { createVegDealSchema, updateVegDealSchema, listVegDealQuerySchema } from "../validation/veg.schema.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"]));

/**
 * @openapi
 * /veg-deals:
 *   get:
 *     tags: [VEG Deals]
 *     summary: List VEG deals with pagination and filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: businessLine
 *         schema: { type: string }
 *       - in: query
 *         name: decision
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated VEG deal list
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listVegDealQuerySchema.parse(req.query);
    const result = await vegDealService.list(query);
    res.json({ data: result.data, total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid query", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg-deals/stats:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Get aggregate statistics for VEG deals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: VEG deal statistics
 */
router.get("/stats", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await vegDealService.getStats();
    res.json({ data: stats });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/dashboard:
 *   get:
 *     tags: [VEG Deals]
 *     summary: COMEX VEG Governance Dashboard data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: businessLine
 *         schema: { type: string }
 *       - in: query
 *         name: decision
 *         schema: { type: string }
 *       - in: query
 *         name: salesStatus
 *         schema: { type: string }
 *       - in: query
 *         name: dealType
 *         schema: { type: string }
 *       - in: query
 *         name: vegDateFrom
 *         schema: { type: string }
 *       - in: query
 *         name: vegDateTo
 *         schema: { type: string }
 *       - in: query
 *         name: tcvMin
 *         schema: { type: number }
 *       - in: query
 *         name: tcvMax
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get("/dashboard", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      client: req.query.client as string | undefined,
      opportunityCrm: req.query.opportunityCrm as string | undefined,
      businessOwner: req.query.businessOwner as string | undefined,
      region: req.query.region as string | undefined,
      businessLine: req.query.businessLine as string | undefined,
      products: req.query.products as string | undefined,
      committeeType: req.query.committeeType as string | undefined,
      decision: req.query.decision as string | undefined,
      salesStatus: req.query.salesStatus as string | undefined,
      dealType: req.query.dealType as string | undefined,
      duplicateCheck: req.query.duplicateCheck !== undefined ? req.query.duplicateCheck === "true" : undefined,
      vegDateFrom: req.query.vegDateFrom as string | undefined,
      vegDateTo: req.query.vegDateTo as string | undefined,
      closingDateFrom: req.query.closingDateFrom as string | undefined,
      closingDateTo: req.query.closingDateTo as string | undefined,
      tcvMin: req.query.tcvMin ? parseFloat(req.query.tcvMin as string) : undefined,
      tcvMax: req.query.tcvMax ? parseFloat(req.query.tcvMax as string) : undefined,
      wlMin: req.query.wlMin ? parseFloat(req.query.wlMin as string) : undefined,
      wlMax: req.query.wlMax ? parseFloat(req.query.wlMax as string) : undefined,
    };
    const data = await vegDealService.getDashboardData(filters);
    res.json({ data });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/import:
 *   post:
 *     tags: [VEG Deals]
 *     summary: Bulk import VEG deals from array of records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Import result
 */
router.post("/import", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vegDealService.importFromExcel(req.body.rows || []);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/decisions:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Get decision overview statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Decision overview
 */
router.get("/decisions", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await vegDealService.getDecisionsOverview();
    res.json({ data });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/business-lines:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Get business line overview statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business line overview
 */
router.get("/business-lines", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await vegDealService.getBusinessLinesOverview();
    res.json({ data });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/regions:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Get region overview statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Region overview
 */
router.get("/regions", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await vegDealService.getRegionOverview();
    res.json({ data });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/trends/monthly:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Monthly TCV trend data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly TCV and count by month
 */
router.get("/trends/monthly", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await vegDealService.getMonthlyTCVTrend();
    res.json({ data });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/trends/year-over-year:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Year-over-year comparison
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: YOY TCV and count by year
 */
router.get("/trends/year-over-year", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await vegDealService.getYearOverYear();
    res.json({ data });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/export:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Export VEG deals as CSV
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: businessLine
 *         schema: { type: string }
 *       - in: query
 *         name: decision
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get("/export", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = listVegDealQuerySchema.parse(req.query);
    const csv = await vegDealService.exportCsv(filters);
    const date = new Date().toISOString().slice(0, 10);
    const filtersLabel = filters.search ? `-${filters.search.slice(0, 20)}` : "";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="veg-deals-${date}${filtersLabel}.csv"`);
    res.send(csv);
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid query", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg-deals/{id}:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Get VEG deal by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: VEG deal details
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vegDealService.getById(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals:
 *   post:
 *     tags: [VEG Deals]
 *     summary: Create a new VEG deal
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: VEG deal created
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createVegDealSchema.parse(req.body);
    const result = await vegDealService.create(parsed);
    vegEventBus.emitVegEvent({ type: "veg:deal:created", dealId: result.id, userId: (req as any).user?.id, timestamp: new Date().toISOString() });
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg-deals/by-veg-id/{vegId}:
 *   get:
 *     tags: [VEG Deals]
 *     summary: Get VEG deal by veg_id string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: VEG deal details
 */
router.get("/by-veg-id/:vegId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vegDealService.getByVegId(req.params.vegId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg-deals/{id}:
 *   patch:
 *     tags: [VEG Deals]
 *     summary: Update a VEG deal
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: VEG deal updated
 */
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateVegDealSchema.parse(req.body);
    const result = await vegDealService.update(req.params.id, parsed);
    vegEventBus.emitVegEvent({ type: "veg:deal:updated", dealId: req.params.id, userId: (req as any).user?.id, timestamp: new Date().toISOString() });
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg-deals/{id}:
 *   delete:
 *     tags: [VEG Deals]
 *     summary: Delete a VEG deal
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: VEG deal deleted
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vegDealService.delete(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
