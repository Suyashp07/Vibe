# Supabase Auth Email Templates (No Magic Link · 6-Digit OTP Only)

These templates replace the default plain-text Supabase emails with high-converting, professionally styled **Vibe by Swaniki** branded templates. Per request, **clickable magic links have been completely removed**; only the secure single-use 6-digit verification code (`{{ .Token }}`) is displayed.

---

## Where to Apply in Supabase Dashboard

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard/project/jqnwlafvsfnqwdkmquwt)
2. Go to **Authentication** (left sidebar) -> **Email Templates**
3. Update the following two templates:

### 1. "Confirm signup" Template
- **Subject**: `Your Vibe Verification Code: {{ .Token }}`
- **Body**: Copy and paste the entire contents of [`supabase/email-templates/confirm_signup.html`](file:///Users/suyashpandey/.gemini/antigravity-ide/scratch/vibe-by-swaniki/supabase/email-templates/confirm_signup.html)
- Click **Save changes**

### 2. "Magic Link" Template (used for passwordless / OTP login)
- **Subject**: `Your Vibe Login Code: {{ .Token }}`
- **Body**: Copy and paste the entire contents of [`supabase/email-templates/magic_link.html`](file:///Users/suyashpandey/.gemini/antigravity-ide/scratch/vibe-by-swaniki/supabase/email-templates/magic_link.html)
- Click **Save changes**

---

## Key Highlights
- **Branding**: Displays `Vibe BY SWANIKI` in bold dark slate and `#E8621A` orange accent (zero icon box).
- **Security**: 40px letter-spaced 6-digit OTP code in a high-contrast dark card.
- **Zero Magic Links**: Completely omits `{{ .ConfirmationURL }}` and any clickable login buttons.
- **Cross-Client Compatibility**: Tested for Gmail, Apple Mail, Outlook, and mobile screens.
