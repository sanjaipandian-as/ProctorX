const { z } = require("zod");
const config = require("./config");

// ─────────────────────────────────────────────
//  REQUEST VALIDATION SCHEMAS
// ─────────────────────────────────────────────

const SUPPORTED_LANGUAGES = ["python", "javascript", "node", "cpp", "c++", "java"];

const runSchema = z.object({
  language: z
    .string()
    .trim()
    .toLowerCase()
    .refine((val) => SUPPORTED_LANGUAGES.includes(val), {
      message: `Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`,
    }),

  code: z
    .string()
    .min(1, "Code cannot be empty")
    .max(config.maxCodeLength, `Code exceeds maximum length of ${config.maxCodeLength} characters`),

  tests: z
    .array(
      z.object({
        input: z.string().default(""),
      })
    )
    .min(1, "At least one test case is required")
    .max(config.maxTests, `Maximum ${config.maxTests} test cases allowed`)
    .default([{ input: "" }]),

  timeLimitMs: z
    .number()
    .int()
    .min(1000)
    .max(30000)
    .optional(),

  memoryMb: z
    .number()
    .int()
    .min(32)
    .max(512)
    .optional(),

  cpus: z
    .string()
    .optional(),
});

/**
 * Express middleware — validates request body against the run schema.
 * Returns 400 with detailed errors on failure.
 */
function validateRunRequest(req, res, next) {
  const result = runSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  req.validatedBody = result.data;
  next();
}

module.exports = { validateRunRequest, runSchema };
