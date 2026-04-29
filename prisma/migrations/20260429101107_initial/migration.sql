-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Applicant', 'Staff');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('Ordinary', 'Associate', 'RERAProject');

-- CreateEnum
CREATE TYPE "FirmType" AS ENUM ('Proprietorship', 'Partnership', 'PrivateLimited', 'LLP', 'PublicSector', 'AOP', 'CooperativeSociety');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('Draft', 'Submitted', 'UnderScrutiny', 'AtConvenor', 'AtDirectorGeneral', 'AtSecretary', 'Approved', 'CertificateIssued', 'Rejected');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('Valid', 'Invalid');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PAN', 'GST', 'ROC', 'RERA', 'CoC', 'ProjectProof', 'BankAccount', 'ProposerForm', 'SeconderForm', 'IncomeProof', 'OtherProof', 'SignatureImage', 'TaxInvoice');

-- CreateEnum
CREATE TYPE "MimeType" AS ENUM ('application/pdf', 'image/jpeg', 'image/png');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('Uploaded', 'Verified', 'Rejected');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('GST', 'PAN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('Pending', 'Verified', 'Failed');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('Online', 'Offline');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Initiated', 'Success', 'Failed', 'Reconciled', 'Reversed');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('Razorpay', 'Cashfree', 'Manual');

-- CreateEnum
CREATE TYPE "OfflinePaymentMethod" AS ENUM ('Cash', 'Cheque', 'NEFT', 'DD');

-- CreateEnum
CREATE TYPE "ApprovalStage" AS ENUM ('Scrutiniser', 'Convenor', 'DirectorGeneral', 'Secretary');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('Pending', 'Approved', 'RaisedObjection', 'Rejected');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('Active', 'RenewalDue', 'Lapsed', 'Revoked');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('Draft', 'Submitted', 'AutoApproved', 'ManualReview', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('Active', 'Superseded', 'Revoked');

-- CreateEnum
CREATE TYPE "VaultDocStatus" AS ENUM ('Current', 'Superseded', 'Archived');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('Scrutiniser', 'Convenor', 'DirectorGeneral', 'Secretary', 'PaymentOfficer', 'Admin');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('Active', 'Suspended', 'Archived');

-- CreateEnum
CREATE TYPE "PresidentStatus" AS ENUM ('Active', 'Historical');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('ApplicationSubmitted', 'ApplicationApproved', 'ApplicationRejected', 'ApplicationObjectionRaised', 'StaffEdited', 'DocumentUploaded', 'DocumentAccessed', 'AadhaarAccessed', 'CertificateIssued', 'CertificateRevoked', 'PaymentRecorded', 'PaymentReversed', 'LoginSuccess', 'LoginFailure', 'MFAEnrolled', 'MFAVerified', 'StaffInvited', 'StaffDisabled', 'StaffRemoved', 'DSARRequested', 'DSARResolved', 'PresidentUpdated', 'RenewalSubmitted', 'RenewalApproved', 'RenewalAutoApproved', 'MemberStatusChanged');

-- CreateEnum
CREATE TYPE "ActorRole" AS ENUM ('Applicant', 'Member', 'Scrutiniser', 'Convenor', 'DirectorGeneral', 'Secretary', 'PaymentOfficer', 'Admin', 'System');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('Application', 'Member', 'Certificate', 'Payment', 'User', 'Staff', 'Document', 'Renewal', 'President');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('OTPRequest', 'ApplicationConfirmation', 'RenewalReminder', 'QueryRaised', 'ApprovalGranted', 'RejectionNotice', 'CertificateIssued', 'PaymentReceived', 'PaymentReversed', 'StaffInvitation', 'DSARConfirmation');

-- CreateEnum
CREATE TYPE "EmailRecipientRole" AS ENUM ('Applicant', 'Member', 'Staff');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('Queued', 'Sending', 'Sent', 'Failed');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "userType" "UserType" NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "membershipType" "MembershipType" NOT NULL,
    "firmType" "FirmType" NOT NULL,
    "firmName" TEXT NOT NULL,
    "firmAddress" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'Draft',
    "currentStepNumber" INTEGER NOT NULL DEFAULT 1,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStep" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'Invalid',
    "validationErrors" JSONB NOT NULL DEFAULT '[]',
    "completedAt" TIMESTAMP(3),
    "lastModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" "MimeType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'Uploaded',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "replacedById" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalVerification" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "verificationType" "VerificationType" NOT NULL,
    "referenceValue" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'Pending',
    "verifiedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "rawResponse" JSONB,
    "retriesRemaining" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),

    CONSTRAINT "ExternalVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "membershipRenewalId" TEXT,
    "paymentType" "PaymentType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'Pending',
    "gateway" "PaymentGateway",
    "gatewayOrderId" TEXT,
    "gatewayTransactionId" TEXT,
    "offlinePaymentMethod" "OfflinePaymentMethod",
    "offlineReferenceNumber" TEXT,
    "offlineReceivedDate" TIMESTAMP(3),
    "recordedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDecision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stage" "ApprovalStage" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'Pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decision" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "membershipNumber" TEXT NOT NULL,
    "membershipType" "MembershipType" NOT NULL,
    "firmName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'Active',
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipRenewal" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "renewalNumber" TEXT NOT NULL,
    "status" "RenewalStatus" NOT NULL DEFAULT 'Draft',
    "previousData" JSONB NOT NULL,
    "renewalData" JSONB NOT NULL DEFAULT '{}',
    "changesDetected" BOOLEAN NOT NULL DEFAULT false,
    "materialChanges" JSONB NOT NULL DEFAULT '[]',
    "requiredSteps" INTEGER NOT NULL DEFAULT 1,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "autoApprovedAt" TIMESTAMP(3),
    "newExpiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipCertificate" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "membershipType" "MembershipType" NOT NULL,
    "firmName" TEXT NOT NULL,
    "presidentName" TEXT NOT NULL,
    "presidentSignatureImageKey" TEXT NOT NULL,
    "certHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityStartDate" TIMESTAMP(3) NOT NULL,
    "validityEndDate" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'Active',
    "supersededById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "pdfStorageKey" TEXT NOT NULL,
    "qrCodeData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVault" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" "MimeType" NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" "VaultDocStatus" NOT NULL DEFAULT 'Current',
    "supersededAt" TIMESTAMP(3),
    "supersededById" TEXT,
    "isSearchable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocumentVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'Active',
    "totpSecret" TEXT,
    "totpEnrolledAt" TIMESTAMP(3),
    "totpVerifiedAt" TIMESTAMP(3),
    "recoveryCodes" TEXT[],
    "lastPasswordChangedAt" TIMESTAMP(3),
    "sessionTimeout" INTEGER NOT NULL DEFAULT 1800,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traceId" TEXT,
    "eventType" "AuditEventType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "ActorRole" NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "President" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "signatureImageKey" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PresidentStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "President_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientRole" "EmailRecipientRole" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'Queued',
    "renderedSubject" TEXT NOT NULL,
    "renderedBody" TEXT NOT NULL,
    "failureReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "retriesRemaining" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_userId_key" ON "Applicant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNumber_key" ON "Application"("applicationNumber");

-- CreateIndex
CREATE INDEX "Application_applicantId_status_idx" ON "Application"("applicantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationStep_applicationId_stepNumber_key" ON "ApplicationStep"("applicationId", "stepNumber");

-- CreateIndex
CREATE INDEX "Document_applicationId_documentType_isCurrent_idx" ON "Document"("applicationId", "documentType", "isCurrent");

-- CreateIndex
CREATE INDEX "ExternalVerification_applicationId_verificationType_idx" ON "ExternalVerification"("applicationId", "verificationType");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayOrderId_key" ON "Payment"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayTransactionId_key" ON "Payment"("gatewayTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_offlineReferenceNumber_key" ON "Payment"("offlineReferenceNumber");

-- CreateIndex
CREATE INDEX "Payment_applicationId_status_idx" ON "Payment"("applicationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalDecision_applicationId_stage_key" ON "ApprovalDecision"("applicationId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "Member_applicationId_key" ON "Member"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_membershipNumber_key" ON "Member"("membershipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipRenewal_renewalNumber_key" ON "MembershipRenewal"("renewalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipCertificate_certificateNumber_key" ON "MembershipCertificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_userId_key" ON "StaffUser"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AuditLog_resourceId_idx" ON "AuditLog"("resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_traceId_idx" ON "AuditLog"("traceId");

-- CreateIndex
CREATE INDEX "President_status_idx" ON "President"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_eventType_key" ON "NotificationTemplate"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_templateKey_key" ON "NotificationTemplate"("templateKey");

-- CreateIndex
CREATE INDEX "EmailEvent_status_nextRetryAt_idx" ON "EmailEvent"("status", "nextRetryAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStep" ADD CONSTRAINT "ApplicationStep_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalVerification" ADD CONSTRAINT "ExternalVerification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_membershipRenewalId_fkey" FOREIGN KEY ("membershipRenewalId") REFERENCES "MembershipRenewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipRenewal" ADD CONSTRAINT "MembershipRenewal_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipCertificate" ADD CONSTRAINT "MembershipCertificate_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipCertificate" ADD CONSTRAINT "MembershipCertificate_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "MembershipCertificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVault" ADD CONSTRAINT "DocumentVault_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVault" ADD CONSTRAINT "DocumentVault_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "DocumentVault"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
