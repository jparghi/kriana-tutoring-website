"use client";

import { useState } from "react";
import { SearchIcon } from "./icons";

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Search worksheets, skills, or events" }: SearchBarProps) {
  const [query, setQuery] = useState("");

  return (
    <form
      className="group relative flex w-full max-w-xl items-center rounded-full border border-slate-200 bg-white shadow-sm transition focus-within:border-brand-sky focus-within:ring-2 focus-within:ring-brand-sky/20"
      onSubmit={(event) => {
        event.preventDefault();
        if (typeof window !== "undefined") {
          window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
      }}
    >
      <span className="pointer-events-none pl-5 text-brand-sky transition group-focus-within:text-brand-rose">
        <SearchIcon className="h-5 w-5" />
      </span>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-12 flex-1 bg-transparent px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        placeholder={placeholder}
      />
      <button
        type="submit"
        className="mr-1 inline-flex h-10 items-center rounded-full bg-brand-sky px-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-brand-amber hover:text-slate-950"
      >
        Explore
      </button>
    </form>
  );
}
