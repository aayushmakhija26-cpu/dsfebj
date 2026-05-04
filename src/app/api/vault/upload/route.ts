import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { uploadDocument } from "@/services/vault/documentUpload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const documentType = formData.get("documentType");
  const applicationId = formData.get("applicationId");

  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (!documentType || typeof documentType !== "string") return NextResponse.json({ error: "documentType is required" }, { status: 400 });

  const result = await uploadDocument({
    file,
    documentType,
    applicationId: typeof applicationId === "string" ? applicationId : undefined,
    userId: session.user.id,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ storageKey: result.storageKey });
}
