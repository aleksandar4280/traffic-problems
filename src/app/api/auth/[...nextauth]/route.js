// FILE: src/app/api/auth/[...nextauth]/route.js
import { handlers } from "@/auth";
export const runtime = "nodejs";
export const { GET, POST } = handlers;
