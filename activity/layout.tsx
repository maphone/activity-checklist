// src/app/login/layout.tsx
'use client';
import ProtectedLayout from "@/components/utility/ProtectedLayout";
import React from "react";

export default function TimelogsLayout({ children, }: { children: React.ReactNode; }) {

  return (
    <ProtectedLayout>
      {/* ซ้าย: ฟอร์ม login */}
        {children}
    </ProtectedLayout>
  );
}
