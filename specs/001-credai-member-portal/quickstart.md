# Quickstart: CREDAI Pune Digital Member Portal

**Target audience:** Backend + frontend developers implementing this feature.

**Time to productive first task:** 30 minutes (setup) + 15 minutes (architecture orientation).

---

## Setup (30 min)

### Prerequisites

- Node.js 20 LTS (or later)
- pnpm (recommended for Vercel deploys)
- PostgreSQL 15+ (local dev or Docker)
- AWS account (for KMS / S3 / SES / RDS in production; local dev can use Postgres + file storage)
- Git

### Installation Steps

1. **Initialize project from T3 starter:**
   ```bash
   cd ~/projects
   pnpm create t3-app@latest credai \
     --CI \
     --nextAuth \
     --tailwind \
     --trpc \
     --prisma \
     --appRouter \
     --dbProvider postgres
   cd credai
   ```

2. **Add shadcn/ui:**
   ```bash
   pnpm dlx shadcn@latest init
   # Accept all defaults
   ```

3. **Upgrade core dependencies:**
   ```bash
   pnpm add -u tailwindcss@4 zod@4 prisma@7
   pnpm add -D @types/node@latest
   ```

4. **Add project dependencies:**
   ```bash
   # Authentication & validation
   pnpm add @next-auth/prisma-adapter otplib qrcode
   
   # External integrations & background jobs
   pnpm add pg-boss axios
   
   # File storage & PDF
   pnpm add @vercel/blob @react-pdf/renderer @signpdf/signpdf
   
   # Logging & observability
   pnpm add pino pino-pretty @opentelemetry/api
   
   # Utilities
   pnpm add framer-motion sonner clsx
   
   # Testing
   pnpm add -D @testing-library/react @testing-library/jest-dom vitest playwright
   ```

5. **Set up local PostgreSQL:**
   ```bash
   # Option A: Docker (recommended)
   docker run -d \
     --name credai-postgres \
     -e POSTGRES_USER=credai \
     -e POSTGRES_PASSWORD=dev123 \
     -e POSTGRES_DB=credai \
     -p 5432:5432 \
     postgres:15
   
   # Option B: Homebrew (macOS)
   brew install postgresql
   brew services start postgresql
   createdb credai
   ```

6. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://credai:dev123@localhost:5432/credai"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<openssl rand -base64 32>"
   
   # Auth providers (for staff MFA testing)
   AUTH_GITHUB_ID="<your-github-oauth-app-id>"
   AUTH_GITHUB_SECRET="<your-github-oauth-app-secret>"
   
   # File storage (Vercel Blob for prod; filesystem for dev)
   BLOB_STORE_TYPE="filesystem" # or "vercel"
   BLOB_STORE_PATH="./public/uploads"
   
   # Email (dev: log to console)
   EMAIL_PROVIDER="console" # or "ses", "sendgrid"
   
   # Optional: AWS KMS for envelope keys (not needed for MVP local dev)
   AWS_REGION="ap-south-1"
   ```

7. **Migrate database & seed test data:**
   ```bash
   pnpm prisma migrate dev --name init
   pnpm node scripts/seed.ts
   ```

8. **Start dev server:**
   ```bash
   pnpm dev
   ```
   Open http://localhost:3000

---

## Architecture Orientation (15 min)

### Project Structure at a Glance

```
src/
├── app/              # Next.js pages (App Router)
│   ├── (auth)/       # OTP login (public)
│   ├── (apply)/      # Wizard (authenticated applicant)
│   ├── (member)/     # Dashboard + renewal (authenticated member)
│   ├── (admin)/      # Staff approval workflow (TOTP protected)
│   └── public/       # Public certificate verification
│
├── server/
│   ├── api/routers/  # tRPC procedures (wizard, approval, payment, renewal)
│   ├── services/     # Business logic (validation, state machine, external integrations)
│   └── db.ts         # Prisma client
│
├── components/       # React components (wizard, staff review, common UI)
├── schemas/          # Zod validation schemas
└── lib/              # Utilities (auth, RBAC, encryption, logging)
```

### Key Concepts

1. **Zod Schemas (Form Validation)**
   - All wizard step inputs validated via Zod (src/schemas/wizard.ts).
   - Conditional fields defined in schema using `.refine()` (e.g., Partnership must have ≥ 2 partners).
   - tRPC procedures use same schema (client + server validation).

2. **State Machine (Approval Workflow)**
   - 4-stage workflow: Scrutiniser → Convenor → DG → Secretary.
   - Implemented as TypeScript union type + middleware enforcing allowed transitions.
   - One decision record per stage per application (immutable once decided).

3. **Queue & Retry (External Integrations)**
   - pg-boss: Postgres-backed job queue.
   - All external calls (GST verify, PAN verify, email, payment webhooks) queued + retried.
   - Non-blocking: app submission proceeds even if verification pending.

4. **Audit Log (Compliance)**
   - Append-only, write-only table (INSERT only, no UPDATE/DELETE).
   - Middleware logs every state transition, staff action, document access.
   - Audit entries immutable; forms the compliance trail.

5. **RBAC (Authorization)**
   - 7 roles: Applicant, Member, Scrutiniser, Convenor, DirectorGeneral, Secretary, PaymentOfficer, Admin.
   - Enforced server-side in tRPC middleware (client-side UI hiding is supplementary).
   - Scrutiniser-only privilege: inline edit on application (triggers re-verification if GST/PAN edited).

---

## Your First Task: Implement `wizard.getApplicationDraft()`

**Objective:** Load an in-progress application and return all steps + documents.

**Files you'll touch:**

1. **`src/server/api/routers/wizard.router.ts`** (new)
   ```typescript
   import { protectedProcedure, router } from "@/server/api/trpc";
   import { z } from "zod";
   import { TRPCError } from "@trpc/server";

   export const wizardRouter = router({
     getApplicationDraft: protectedProcedure
       .input(z.object({ applicationId: z.string().uuid() }))
       .query(async ({ ctx, input }) => {
         const app = await ctx.db.application.findUnique({
           where: { id: input.applicationId },
           include: {
             steps: true,
             documents: true,
             verifications: true,
           },
         });

         if (!app) {
           throw new TRPCError({ code: "NOT_FOUND" });
         }

         // Check: only applicant who owns this app can retrieve
         if (app.applicantId !== ctx.session.user.id) {
           throw new TRPCError({ code: "FORBIDDEN" });
         }

         return {
           applicationId: app.id,
           membershipType: app.membershipType,
           firmType: app.firmType,
           currentStep: app.currentStepNumber,
           steps: app.steps.map((s) => ({
             number: s.stepNumber,
             isComplete: s.isComplete,
             data: s.data,
             validationStatus: s.validationStatus,
             validationErrors: s.validationErrors,
           })),
           documents: app.documents.map((d) => ({
             id: d.id,
             type: d.documentType,
             fileName: d.fileName,
             status: d.status,
             size: d.fileSize,
           })),
           autoSavedAt: app.updatedAt,
         };
       }),
   });
   ```

2. **`src/server/api/root.ts`** (update)
   ```typescript
   import { wizardRouter } from "./routers/wizard.router";

   export const appRouter = router({
     wizard: wizardRouter,
     // ... other routers
   });
   ```

3. **`src/server/db.ts`** (already exists)
   - Prisma client is exported here; used by all routers.

4. **`prisma/schema.prisma`** (create tables for Application, ApplicationStep, Document)
   ```prisma
   model Application {
     id                  String   @id @default(cuid())
     applicantId         String
     applicant           Applicant @relation(fields: [applicantId], references: [id])
     applicationNumber   String   @unique
     membershipType      String
     firmType            String
     currentStepNumber   Int
     status              String   @default("Draft")
     steps               ApplicationStep[]
     documents           Document[]
     createdAt           DateTime @default(now())
     updatedAt           DateTime @updatedAt

     @@index([applicantId])
   }

   model ApplicationStep {
     id                  String   @id @default(cuid())
     applicationId       String
     application         Application @relation(fields: [applicationId], references: [id])
     stepNumber          Int
     data                Json
     isComplete          Boolean  @default(false)
     validationStatus    String   @default("Invalid")
     validationErrors    Json     @default("[]")
     createdAt           DateTime @default(now())
     updatedAt           DateTime @updatedAt

     @@unique([applicationId, stepNumber])
   }

   model Document {
     id                  String   @id @default(cuid())
     applicationId       String
     application         Application @relation(fields: [applicationId], references: [id])
     documentType        String
     fileName            String
     fileSize            Int
     mimeType            String
     storageKey          String
     status              String   @default("Uploaded")
     uploadedAt          DateTime @default(now())
     createdAt           DateTime @default(now())
   }
   ```

5. **Create/update migration:**
   ```bash
   pnpm prisma migrate dev --name add_wizard_tables
   ```

6. **Test in tRPC DevTools:**
   - Open http://localhost:3000/api/trpc/wizard.getApplicationDraft?input={"applicationId":"<id>"}
   - Verify response matches contract.

---

## Common Workflows

### Adding a New Wizard Step

1. **Define Zod schema** in `src/schemas/wizard.ts`
   ```typescript
   const step6Schema = z.object({
     directors: z.array(directorSchema).min(2), // Example: ≥ 2 directors for Pvt Ltd
   });
   ```

2. **Create tRPC procedure** in `src/server/api/routers/wizard.router.ts`
   ```typescript
   submitStep: publicProcedure
     .input(z.object({
       applicationId: z.string().uuid(),
       stepNumber: z.literal(6),
       data: step6Schema,
     }))
     .mutation(async ({ ctx, input }) => {
       // Validate, save to DB, auto-save
     }),
   ```

3. **Create React component** in `src/components/wizard/Step6.tsx`
   ```typescript
   export function Step6({ applicationId, initialData }) {
     const form = useForm({ resolver: zodResolver(step6Schema) });
     const { mutate: submitStep } = trpc.wizard.submitStep.useMutation();
     
     return (
       <form onSubmit={form.handleSubmit((data) => submitStep({ applicationId, stepNumber: 6, data }))}>
         {/* Form fields */}
       </form>
     );
   }
   ```

### Adding a Staff Review Checklist Item

1. **Update Prisma** (`prisma/schema.prisma`)
   ```prisma
   model ReviewChecklistItem {
     id              String @id @default(cuid())
     applicationId   String
     category        String // 'Firm Details', 'Documents', etc.
     label           String
     status          String @default("Unchecked") // 'Unchecked', 'Passed', 'Flagged', 'Failed'
     relatedDocId    String? // Link to specific document
   }
   ```

2. **Update approval router** (`src/server/api/routers/approval.router.ts`)
   ```typescript
   getApplicationDetail: staffProcedure
     .input(z.object({ applicationId: z.string().uuid() }))
     .query(async ({ ctx, input }) => {
       const app = await ctx.db.application.findUnique({
         include: { checklist: true, documents: true },
       });
       // Build checklist response
     }),
   ```

3. **Build React component** (`src/components/staff/ReviewChecklistPanel.tsx`)
   ```typescript
   export function ReviewChecklistPanel({ checklist }) {
     return (
       <div>
         {checklist.map((item) => (
           <ChecklistItem
             key={item.id}
             label={item.label}
             status={item.status}
             onToggle={(newStatus) => updateChecklistItem(item.id, newStatus)}
           />
         ))}
       </div>
     );
   }
   ```

---

## Testing Checklist

Before marking a feature complete:

- [ ] **Unit tests** pass: `pnpm test --run`
- [ ] **E2E tests** pass: `pnpm exec playwright test`
- [ ] **Type checking** passes: `pnpm tsc --noEmit`
- [ ] **Linting** passes: `pnpm lint`
- [ ] **Accessibility** (axe-core): `pnpm test:a11y`
- [ ] **Manual testing** on at least one user journey (e.g., create app draft → submit step → auto-save confirms)

---

## Debugging Tips

### View tRPC DevTools
http://localhost:3000 → Open React DevTools → tRPC tab

### Check Database State
```bash
pnpm prisma studio
# Opens Prisma UI on http://localhost:5555
```

### View Logs with Trace ID
```bash
# All logs emitted via pino include trace ID for tracing across requests
pnpm dev 2>&1 | jq '.traceId'
```

### Test External Integrations (Mock)
- `src/services/external/gst/mock.ts` provides fake GST API responses for dev.
- Set `GST_PROVIDER=mock` in `.env.local` to use mock instead of real API.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `TypeError: Cannot find module '@/server/api/trpc'` | Run `pnpm install` and ensure T3 starter completed successfully. |
| `error: relation "Application" does not exist` | Run `pnpm prisma migrate dev` to create tables. |
| `NEXTAUTH_SECRET not set` | Add `NEXTAUTH_SECRET="<openssl rand -base64 32>"` to `.env.local`. |
| OTP not sending | Set `EMAIL_PROVIDER="console"` in `.env.local` to log emails to console instead of sending. |
| Port 3000 already in use | Kill existing process: `lsof -i :3000 | kill -9 <PID>` or use `PORT=3001 pnpm dev`. |

---

## Next Steps After Setup

1. **Read the full implementation plan** (`specs/001-credai-member-portal/plan.md`)
2. **Review data model** (`specs/001-credai-member-portal/data-model.md`)
3. **Check procedure contracts** (`specs/001-credai-member-portal/contracts/CONTRACTS.md`)
4. **Pick a task from** `specs/001-credai-member-portal/tasks.md` (generated by `/speckit-tasks`)
5. **Run the E2E test for that task** to verify your implementation.

---

## Resources

- **T3 Stack Docs:** https://create.t3.gg/
- **Next.js App Router:** https://nextjs.org/docs/app
- **tRPC:** https://trpc.io/
- **Prisma:** https://www.prisma.io/docs/
- **shadcn/ui:** https://ui.shadcn.com/
- **Zod:** https://zod.dev/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

**Happy coding! 🚀**

If you get stuck, check the test files (`tests/`) for examples of how similar features are tested.
