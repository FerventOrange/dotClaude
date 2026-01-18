# Example 1: Simple Bug Fix

## Staged Changes

```diff
diff --git a/src/utils/validation.js b/src/utils/validation.js
index 1234567..abcdefg 100644
--- a/src/utils/validation.js
+++ b/src/utils/validation.js
@@ -15,7 +15,7 @@ function validateEmail(email) {
   if (!email) {
     return false;
   }
-  return email.includes('@');
+  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 }
```

## Agent Output

```
Suggested commit message:

fix(validation): improve email validation regex

Replace simple @ check with proper email regex pattern
to catch malformed email addresses.

---
Alternative options:
1. fix: use proper regex for email validation
2. fix(utils): strengthen email validation logic
```

## Notes
The agent identified this as a bug fix because it improves existing functionality rather than adding new features.
