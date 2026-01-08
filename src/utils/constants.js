// FILE: src/utils/constants.js
export const STATUSES_ARRAY = ["primeceno", "prijavljeno", "reseno"];

export const STATUS_LABELS = {
  primeceno: "Primećeno",
  prijavljeno: "Prijavljeno",
  reseno: "Rešeno",
};

export const PRIORITIES_ARRAY = ["nizak", "srednji", "visok"];

export const PRIORITY_LABELS = {
  nizak: "Nizak",
  srednji: "Srednji",
  visok: "Visok",
};

export const PROBLEM_TYPES_ARRAY = [
  "Rupe na putu",
  "Radovi na putu",
  "Saobraćajna nezgoda",
  "Gužva / zastoj",
  "Neispravna signalizacija",
  "Nepropisno parkiranje",
  "Ostalo",
];

export const MARKER_COLORS = {
  prijavljeno: "#f59e0b",   
  primeceno: "#ef4444",
  reseno: "#22c55e",
};