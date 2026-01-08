// FILE: src/components/ProblemForm.js
"use client";

/**
 * Problem form (add/edit) with:
 * - null-safe controlled inputs
 * - keep existing image on edit unless user chooses a new file
 * - optional remove image checkbox
 * - image upload via POST /api/upload (multipart/form-data)
 * - fallback manual imageUrl input
 */
import { useEffect, useMemo, useState } from "react";
import {
  PRIORITIES_ARRAY,
  PRIORITY_LABELS,
  PROBLEM_TYPES_ARRAY,
  STATUSES_ARRAY,
  STATUS_LABELS,
} from "@/utils/constants";

const EMPTY_FORM = {
  title: "",
  description: "",
  problemType: PROBLEM_TYPES_ARRAY?.[0] || "Ostalo",
  latitude: "",
  longitude: "",
  proposedSolution: "",
  priority: "srednji",
  status: "primeceno",
  imageUrl: "",
};

function normalizeInitialData(initialData) {
  if (!initialData) return { ...EMPTY_FORM };

  return {
    ...EMPTY_FORM,
    ...initialData,
    title: typeof initialData.title === "string" ? initialData.title : "",
    description: initialData.description ?? "",
    problemType: initialData.problemType ?? (PROBLEM_TYPES_ARRAY?.[0] || "Ostalo"),
    latitude:
      initialData.latitude === null || initialData.latitude === undefined
        ? ""
        : String(initialData.latitude),
    longitude:
      initialData.longitude === null || initialData.longitude === undefined
        ? ""
        : String(initialData.longitude),
    proposedSolution: initialData.proposedSolution ?? "",
    priority: initialData.priority ?? "srednji",
    status: initialData.status ?? "primeceno",
    imageUrl: initialData.imageUrl ?? "",
  };
}

function toNumberOrThrow(value, fieldName) {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`${fieldName} nije validan broj.`);
  return num;
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);

  const resp = await fetch("/api/upload", { method: "POST", body: fd });

  const contentType = resp.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await resp.json().catch(() => ({}))
    : { error: await resp.text().catch(() => "") };

  if (!resp.ok) {
    throw new Error(payload.details || payload.error || `Upload failed (${resp.status})`);
  }
  if (!payload.url) throw new Error("Upload nije vratio URL.");
  return String(payload.url);
}

export default function ProblemForm({ onSubmit, onCancel, selectedLocation, initialData }) {
  const normalizedInitial = useMemo(
    () => normalizeInitialData(initialData),
    [initialData]
  );

  const [formData, setFormData] = useState(() => ({ ...EMPTY_FORM }));

  // New file chosen by user (only if they want to replace image)
  const [imageFile, setImageFile] = useState(null);

  // When true, user explicitly wants to remove image
  const [removeImage, setRemoveImage] = useState(false);

  // Local preview for chosen file
  const [filePreviewUrl, setFilePreviewUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset state when switching add/edit or clicking on new location
  useEffect(() => {
    setError("");
    setImageFile(null);
    setRemoveImage(false);
    setFilePreviewUrl("");

    if (initialData) {
      setFormData(normalizedInitial);
      return;
    }

    if (selectedLocation) {
      setFormData({
        ...EMPTY_FORM,
        latitude: selectedLocation.lat.toFixed(6),
        longitude: selectedLocation.lng.toFixed(6),
      });
      return;
    }

    setFormData({ ...EMPTY_FORM });
  }, [initialData, normalizedInitial, selectedLocation]);

  // Create/revoke preview URL for selected file
  useEffect(() => {
    if (!imageFile) {
      setFilePreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ?? "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      // Choosing a new file means "replace", so not removing
      setRemoveImage(false);
      // IMPORTANT: do NOT wipe formData.imageUrl; keep existing until upload succeeds
    }
  };

  const clearSelectedFile = () => {
    setImageFile(null);
    setFilePreviewUrl("");
  };

  const toggleRemoveImage = (checked) => {
    setRemoveImage(checked);
    if (checked) {
      // If user wants to remove image, discard pending file and clear URL
      clearSelectedFile();
      setFormData((prev) => ({ ...prev, imageUrl: "" }));
    }
  };

  const previewSrc = filePreviewUrl
    ? filePreviewUrl
    : !removeImage && (formData.imageUrl ?? "").trim()
      ? (formData.imageUrl ?? "").trim()
      : "";

  const previewLabel = filePreviewUrl
    ? "Nova slika (preview pre uploada)"
    : (formData.imageUrl ?? "").trim()
      ? "Postojeća slika"
      : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // KEEP existing image by default
      let imageUrl = (formData.imageUrl ?? "").trim();

      // If user checked remove, remove it
      if (removeImage) {
        imageUrl = "";
      }

      // If user selected a new file, upload and replace
      if (!removeImage && imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        ...formData,
        title: (formData.title ?? "").trim(),
        description: (formData.description ?? "").trim(),
        problemType: (formData.problemType ?? "").trim(),
        proposedSolution: (formData.proposedSolution ?? "").trim(),
        imageUrl, // "" means remove; backend should map "" -> null
        latitude: toNumberOrThrow(formData.latitude, "Latitude"),
        longitude: toNumberOrThrow(formData.longitude, "Longitude"),
      };

      if (!payload.title) throw new Error("Naslov je obavezan.");
      if (!payload.problemType) throw new Error("Tip problema je obavezan.");

      await onSubmit(payload);
    } catch (err) {
      setError(err?.message || "Došlo je do greške.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">
        {initialData ? "Izmeni problem" : "Dodaj novi problem"}
      </h2>

      {error ? (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Naslov</label>
          <input
            type="text"
            name="title"
            value={formData.title ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kratak opis problema..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
          <textarea
            name="description"
            value={formData.description ?? ""}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detaljniji opis problema..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tip problema</label>
          <select
            name="problemType"
            value={formData.problemType ?? (PROBLEM_TYPES_ARRAY?.[0] || "Ostalo")}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROBLEM_TYPES_ARRAY.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="0.000001"
              name="latitude"
              value={formData.latitude ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="0.000001"
              name="longitude"
              value={formData.longitude ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Predlog rešenja (opciono)
          </label>
          <textarea
            name="proposedSolution"
            value={formData.proposedSolution ?? ""}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kako bi se problem mogao rešiti..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioritet</label>
            <select
              name="priority"
              value={formData.priority ?? "srednji"}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITIES_ARRAY.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p] ?? p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status ?? "prijavljeno"}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES_ARRAY.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Image section */}
        <div className="border rounded-md p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-gray-700">
              Slika (zadrži / zameni)
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(e) => toggleRemoveImage(e.target.checked)}
              />
              Ukloni sliku
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload nova slika</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={removeImage}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-60"
            />

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={clearSelectedFile}
                disabled={!imageFile}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 disabled:opacity-60"
              >
                Odustani od nove slike
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Ako ne izabereš fajl, **postojeća slika ostaje** (u edit modu).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL slike (opciono)</label>
            <input
  type="text"
  inputMode="url"
  name="imageUrl"
  value={formData.imageUrl ?? ""}
  onChange={handleChange}
  disabled={removeImage || Boolean(imageFile)}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
  placeholder="https://example.com/slika.jpg ili /uploads/xxx.png"
/>
            <p className="text-xs text-gray-500 mt-1">
              U edit modu ovo je popunjeno postojećim URL-om. Ako uploaduješ fajl, URL se automatski zameni.
            </p>
          </div>

          {previewSrc ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">{previewLabel}</div>
              <img
                src={previewSrc}
                alt="Slika problema"
                className="max-h-56 w-full object-contain border rounded-md"
                onError={() => {
                  if (!filePreviewUrl) setError("Ne mogu da učitam sliku sa unetog URL-a.");
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-60"
          >
            {submitting ? "Čuvanje..." : "Sačuvaj"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition disabled:opacity-60"
          >
            Otkaži
          </button>
        </div>
      </form>
    </div>
  );
}
