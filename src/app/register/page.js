// FILE: src/app/register/page.js
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const contentType = resp.headers.get("content-type") || "";
      let payload = null;

      if (contentType.includes("application/json")) {
        payload = await resp.json().catch(() => null);
      } else {
        const txt = await resp.text().catch(() => "");
        payload = { error: `HTTP ${resp.status} (non-JSON): ${txt.slice(0, 200)}` };
      }

      if (!resp.ok) {
        setError(payload?.error || payload?.details || "Registracija nije uspela.");
        setSubmitting(false);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setSubmitting(false);

      if (!res?.ok) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
    } catch (e2) {
      console.error(e2);
      setError("Došlo je do greške.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Registracija</h1>
        <p className="text-sm text-gray-600 mb-6">Kreiraj nalog za prijavu problema.</p>

        {error ? (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ime (opciono)</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lozinka</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md disabled:opacity-60"
          >
            {submitting ? "Kreiranje..." : "Registruj se"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-700">
          Već imaš nalog?{" "}
          <a className="text-blue-600 hover:underline" href="/login">
            Prijavi se
          </a>
        </div>
      </div>
    </div>
  );
}