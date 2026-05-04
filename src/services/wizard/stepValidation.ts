import { WIZARD_STEP_SCHEMAS, createStep4Schema } from "@/schemas/wizard";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

export async function validateStep(
  step: number,
  data: unknown,
  context?: { firmType?: string },
): Promise<ValidationResult> {
  let schema = WIZARD_STEP_SCHEMAS[step as keyof typeof WIZARD_STEP_SCHEMAS];

  if (step === 4 && context?.firmType) {
    schema = createStep4Schema(context.firmType) as typeof schema;
  }

  if (!schema) {
    return { valid: false, errors: { _: ["Unknown step"] } };
  }

  const result = await schema.safeParseAsync(data);

  if (result.success) {
    return { valid: true, errors: {} };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "_";
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }

  return { valid: false, errors };
}

export function getCompletedSteps(stepData: Record<number, unknown>): Set<number> {
  return new Set(Object.keys(stepData).map(Number).filter((n) => !isNaN(n)));
}
