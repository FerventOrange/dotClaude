# Example 2: New Feature

## Staged Changes

```diff
diff --git a/src/components/UserProfile.tsx b/src/components/UserProfile.tsx
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/components/UserProfile.tsx
@@ -0,0 +1,45 @@
+import React from 'react';
+
+interface UserProfileProps {
+  name: string;
+  email: string;
+  avatar?: string;
+}
+
+export function UserProfile({ name, email, avatar }: UserProfileProps) {
+  return (
+    <div className="user-profile">
+      {avatar && <img src={avatar} alt={name} />}
+      <h2>{name}</h2>
+      <p>{email}</p>
+    </div>
+  );
+}
```

## Agent Output

```
Suggested commit message:

feat(components): add UserProfile component

New component to display user information including
name, email, and optional avatar image.

---
Alternative options:
1. feat: create UserProfile display component
2. feat(ui): implement user profile card
```

## Notes
The agent identified this as a new feature because a new file was created with new functionality.
