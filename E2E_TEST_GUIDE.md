# E2E Testing Guide — Phase 3 Implementation

**Objective**: Simulate a real user going through the complete membership application flow from login to submission.

**Setup**: Start with `http://localhost:3000` in your browser.

---

## 1. Authentication Flow

### 1.1 Login Page (`/login`)
- [ ] Page loads with split-screen layout (navy left panel, form right panel)
- [ ] "Continue with email" button is present and enabled
- [ ] Placeholder text shows "you@company.com"
- [ ] Email field is focused on load (autofocus working)

**Test Cases**:
- [ ] Empty email → click button → error "Please enter a valid email address"
- [ ] Invalid email (e.g., "notanemail") → error shown
- [ ] Valid email (e.g., "testuser@example.com") → button shows "Sending code…" → redirects to `/login/verify?email=...`

### 1.2 Verify Page (`/login/verify?email=xyz@example.com`)
- [ ] Page displays email address from URL parameter
- [ ] "Check your email" heading appears
- [ ] Code input field shows placeholder "000000"
- [ ] Code field is focused on load
- [ ] "Resend in 60s" button is disabled (cooldown active from request)

**Test Cases**:
- [ ] Empty code → click "Verify code" → error "OTP must be 6 digits"
- [ ] Wrong code (e.g., "000000") → error "Invalid or expired passcode. Please try again."
- [ ] Valid 6-digit code → button shows "Verifying…" → redirects to `/apply/1`
- [ ] Wait 60 seconds → "Resend in 60s" changes to "Resend code" (clickable)
- [ ] Click "Resend code" → button shows "Sending…" → success (no error)
- [ ] Click back arrow → returns to `/login`

**Note**: To get a valid OTP code, check the console or server logs during development. The code is logged when sent.

---

## 2. Wizard Flow — All 12 Steps

### 2.1 Step 1 — Membership Firm Type (`/apply/1`)
- [ ] Page title: "Membership Firm Type"
- [ ] Subtitle explains membership categories
- [ ] Three radio buttons visible:
  - "Individual" 
  - "Proprietorship"
  - "Partnership/LLP"
  - "Company/Corporation"

**Test Cases**:
- [ ] Click "Next" without selecting → form validates (error shown)
- [ ] Select "Company/Corporation" → click "Next" → saves draft → redirects to `/apply/2?applicationId=...`
- [ ] Navigate back to `/apply/1?applicationId=...` → previously selected value is restored
- [ ] Auto-save triggers every 30 seconds (watch network tab for `/api/wizard/draft` POST requests)

### 2.2 Step 2 — Firm Information
- [ ] Form title: "Firm Information"
- [ ] Input fields appear based on selected firm type (if "Company" selected):
  - "Company Name" (text)
  - "Registration Number" (text)
  - "Date of Registration" (date picker)
  - "Business Category" (dropdown)

**Test Cases**:
- [ ] Leave fields empty → error "Required"
- [ ] Fill in all fields → click "Next" → draft saves → redirects to `/apply/3`
- [ ] Go back to step 1, change firm type to "Proprietorship" → navigate to step 2 → form fields change to match proprietorship
- [ ] Try invalid date → validation error

### 2.3 Step 3 — Promoters/Directors
- [ ] Form title: "Promoters/Directors"
- [ ] Add button to add promoters
- [ ] Each promoter has: Name, Email, Contact, Designation, % Stake

**Test Cases**:
- [ ] Click "Add Promoter" → new promoter row added
- [ ] Leave required fields empty → error on submit
- [ ] Add 3 promoters with valid data → click "Next" → saves
- [ ] Remove a promoter (if delete button exists) → saves successfully
- [ ] Test email validation on email field

### 2.4 Step 4 — PAN Verification
- [ ] Form title: "PAN Verification"
- [ ] PAN input field (11 alphanumeric characters)
- [ ] "Verify PAN" button

**Test Cases**:
- [ ] Enter invalid PAN (e.g., "123") → error "Invalid PAN format"
- [ ] Enter valid PAN format (e.g., "AAAPA1234A") → click "Verify PAN"
- [ ] In dev mode, PAN verification returns mock success → displays verified status
- [ ] Click "Next" → saves

### 2.5 Step 5 — GST Verification
- [ ] Form title: "GST Verification"
- [ ] GST input field (15 characters)
- [ ] "Verify GST" button
- [ ] Message: "GST verification is in mock mode"

**Test Cases**:
- [ ] Enter invalid GST (e.g., "123") → error "Invalid GST format"
- [ ] Enter valid GST format (e.g., "27AABPA1234B1Z0") → click "Verify GST"
- [ ] Mock verification succeeds → displays verified status
- [ ] Click "Next" → saves

### 2.6 Step 6 — Bank Details
- [ ] Form title: "Bank Details"
- [ ] Fields: Account Holder Name, Account Number, IFSC Code, Account Type (dropdown)

**Test Cases**:
- [ ] Leave fields empty → errors shown
- [ ] Enter valid bank details → click "Next" → saves
- [ ] Test IFSC validation (should be 11 characters, alphanumeric)

### 2.7 Step 7 — Document Upload
- [ ] Form title: "Document Upload"
- [ ] Document upload cards for:
  - PAN Card (required)
  - GST Certificate (required)
  - ROC/Partnership Deed (required)
  - Code of Conduct (required)
  - Cancelled Cheque (required)
  - Proposer Form (optional)
  - Seconder Form (optional)
- [ ] Template download links at bottom

**Test Cases**:
- [ ] Try to submit without uploading required documents → error "All required documents must be uploaded"
- [ ] Upload a PDF file (max 10 MB) → file appears in the list with checkmark
- [ ] Upload multiple documents → all appear with progress
- [ ] Click template download link → opens PDF in new tab
- [ ] Try to upload file > 10 MB → error shown
- [ ] Try to upload non-PDF/JPEG/PNG → error shown
- [ ] Upload all required docs → click "Next" → saves

### 2.8 Step 8 — Personal Details
- [ ] Form title: "Personal Details"
- [ ] Fields: Full Name, Email, Phone, Address, etc.

**Test Cases**:
- [ ] Fill all fields with valid data → click "Next" → saves
- [ ] Test email/phone validation

### 2.9 Step 9 — Financial Information
- [ ] Form title: "Financial Information"
- [ ] Fields: Annual Revenue, Employee Count, etc.

**Test Cases**:
- [ ] Fill valid financial data → click "Next" → saves

### 2.10 Step 10 — Membership Benefits
- [ ] Form title: "Membership Benefits"
- [ ] Checkboxes or selection of benefits to enroll in

**Test Cases**:
- [ ] Select/deselect various benefits → click "Next" → saves

### 2.11 Step 11 — Additional Information
- [ ] Form title: "Additional Information"
- [ ] Additional fields or text areas for remarks

**Test Cases**:
- [ ] Fill optional/required fields → click "Next" → saves

### 2.12 Step 12 — Submission & Confirmation
- [ ] Form title: "Application Submission"
- [ ] Review section showing all entered data (read-only)
- [ ] "Submit Application" button (large, prominent)
- [ ] Terms & Conditions checkbox

**Test Cases**:
- [ ] Don't check T&Cs → button disabled
- [ ] Check T&Cs → button enabled
- [ ] Click "Submit Application" → loading state → success message → redirects (or shows confirmation)

---

## 3. Draft Persistence & Resume

### 3.1 Auto-Save Testing
- [ ] Open Dev Tools → Network tab
- [ ] Navigate through steps, filling in data
- [ ] Every 30 seconds, watch for `/api/wizard/draft` POST requests
- [ ] Confirm request includes step number and form data

### 3.2 Resume Application
- [ ] Complete steps 1–3, then close the browser completely
- [ ] Reopen `http://localhost:3000/login`
- [ ] Log back in with same email
- [ ] Visit `/apply/1?applicationId=<saved-id>` directly in URL
- [ ] **Expected**: Form values from previous session should be restored
- [ ] Continue to next step → should have all previous data intact

### 3.3 New Application
- [ ] Log in with a different email address
- [ ] Start from `/apply/1` (fresh applicationId)
- [ ] **Expected**: Form is empty (no draft data from first user)

---

## 4. Error Handling & Edge Cases

### 4.1 Validation Errors
- [ ] At each step, test submitting with empty required fields
- [ ] Error messages should appear inline, with field highlighting
- [ ] Submit button should be disabled if form is invalid (if applicable)

### 4.2 Server Errors
- [ ] Simulate network error: open DevTools → Network → Offline
- [ ] Try to submit a step → should show error message
- [ ] Go back online → try again → should succeed

### 4.3 Session Expiration
- [ ] Complete several steps
- [ ] Wait for session to expire (or manually delete auth cookie in DevTools)
- [ ] Try to navigate to a step → should redirect to `/login`

### 4.4 Invalid applicationId
- [ ] Try navigating to `/apply/5?applicationId=invalid-id`
- [ ] **Expected**: Either 404 or redirect to `/apply/1` (create new)

---

## 5. UI/UX Testing

### 5.1 Navigation
- [ ] Back button works at each step
- [ ] "Next" button text is clear ("Next" or "Continue")
- [ ] Progress indicator (if present) shows current step
- [ ] URL updates correctly after each step

### 5.2 Responsiveness
- [ ] Test on desktop (1920×1080) → layout looks good
- [ ] Test on tablet (768×1024) → responsive layout works
- [ ] Test on mobile (375×667) → form is usable, not cramped

### 5.3 Accessibility
- [ ] Tab through form fields → order is logical
- [ ] Labels are associated with inputs (`<label htmlFor="">`)
- [ ] Error messages use `role="alert"`
- [ ] Focus is visible on all interactive elements

---

## 6. Browser Console Checks

While testing, keep the browser console open (`F12`):

- [ ] No red error logs (unless intentional)
- [ ] No TypeScript/compilation warnings
- [ ] Network requests are successful (200/201 responses)
- [ ] No XSS or security warnings

---

## 7. Test Data

Use this sample data for consistent testing:

```
Email: testuser@credai.local
OTP Code: Check console/server logs (should be 6 digits)

Company Name: CREDAI Test Ltd.
Company Registration: ROC/123456
Date of Incorporation: 2020-01-15
Business Category: Professional Services

Promoter 1:
  Name: Aayush Makhija
  Email: aayush@credai.local
  Contact: 9876543210
  Designation: Founder
  Stake: 50%

Promoter 2:
  Name: Shreya Patel
  Email: shreya@credai.local
  Contact: 9876543211
  Designation: Co-Founder
  Stake: 50%

PAN: AABPT1234A
GST: 27AABPT1234B1Z0
IFSC: HDFC0000001
Account Number: 123456789012
Account Holder: CREDAI Test Ltd.
```

---

## 8. Success Criteria

✅ **All tests pass when**:
- User can log in and verify OTP
- User can complete all 12 steps without errors
- Form data persists through auto-save and page refresh
- User can resume a saved application
- Application submission completes successfully
- No console errors or warnings
- All navigation works correctly
- Responsive design works on all screen sizes

---

## Notes for the Tester

- Take screenshots at each step for documentation
- Note any unexpected behavior or confusing UX
- Test both happy path (all valid data) and error paths
- Check database/logs after submission to confirm data was saved
- Test with different user accounts if possible
- Report any bugs with: step number, action taken, expected result, actual result
