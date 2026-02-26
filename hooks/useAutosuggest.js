"use client";

import { useState } from "react";

export default function useAutosuggest(list) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const onSearch = (value) => {
    setSearch(value);

    const filtered = list.filter(item =>
      item.name?.toLowerCase().includes(value.toLowerCase())
    );

    setResults(filtered);
  };

  const clear = () => setResults([]);

  return {
    search,
    results,
    onSearch,
    clear,
    setSearch
  };
}
