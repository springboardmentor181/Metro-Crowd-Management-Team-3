"use client";

export default function Divider() {
  return (
    <div className="relative my-8">

      <div className="absolute inset-0 flex items-center">

        <div className="w-full border-t border-border" />

      </div>

      <div className="relative flex justify-center">

        <span
          className="
          bg-card
          px-4
          text-sm
          text-muted
          "
        >
          OR
        </span>

      </div>

    </div>
  );
}