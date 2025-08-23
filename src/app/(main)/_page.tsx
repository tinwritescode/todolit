"use client";

import { AuthGuard } from "../../components/auth/AuthGuard";

function TodoPageContent() {
  return <div>TodoPageContent</div>;
}

export default function TodoPage() {
  return (
    <AuthGuard>
      <TodoPageContent />
    </AuthGuard>
  );
}
