// FILE: src/components/ProblemForm.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PRIORITIES_ARRAY,
  PRIORITY_LABELS,
  PROBLEM_TYPES_ARRAY,
  STATUSES_ARRAY,
  STATUS_LABELS,
} from '@/utils/constants';

const EMPTY_FORM = {
  title: '',
  description: '',
  problemType: PROBLEM_TYPES_ARRAY[0] || 'Ostalo',
  latitude: '',
  longitude: '',
  proposedSolution: '',
  priority: 'srednji',
  status: 'prijavljeno',
  imageUrl: '',
};

function normalizeInitialData(initialData) {
  if (!initialData) return { ...EMPTY_FORM };

  return {
    ...EMPTY_FORM,
    ...initialData,
    title: typeof initialData.title === 'string' ? initialData.title : '',
    description: initialData.description ?? '',
    problemType: initialData.problemType ?? (PROBLEM_TYPES_ARRAY[0] || 'Ostalo'),
    latitude:
      initialData.latitude === null || initialData.latitude === undefined
        ? ''
        : String(initialData.latitude),
    longitude:
      initialData.longitude === null || initialData.longitude === undefined
        ? ''
        : String(initialData.longitude),
    proposedSolution: initialData.proposedSolution ?? '',
    priority: initialData.priority ?? 'srednji',
    status: initialData.status ?? 'prijavljeno',
    imageUrl: initialData.imageUrl ?? '',
  };
}

export default function ProblemForm({
  onSubmit,
  onCancel,
  selectedLocation,
  initialData,
}) {
  const [formData, setFormData] = useState(() => ({ ...EMPTY_FORM }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedInitial = useMemo(
    () => normalizeInitialData(initialData),
    [initialData]
  );

  useEffect(() => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        ...formData,
        // osiguraj da nikad ne šalješ null (backend može da radi sa "" i da mapira u null)
        description: formData.description ?? '',
        proposedSolution: formData.proposedSolution ?? '',
        imageUrl: formData.imageUrl ?? '',
      });
    } catch (err) {
      setError(err?.message || 'Došlo je do greške');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value ?? '',
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">
        {initialData ? 'Izmeni problem' : 'Dodaj novi problem'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Naslov
          </label>
          <input
            type="text"
            name="title"
            value={formData.title ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kratak opis problema..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tip problema
          </label>
          <select
            name="problemType"
            value={formData.problemType ?? (PROBLEM_TYPES_ARRAY[0] || 'Ostalo')}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              name="latitude"
              value={formData.latitude ?? ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              name="longitude"
              value={formData.longitude ?? ''}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioritet
            </label>
            <select
              name="priority"
              value={formData.priority ?? 'srednji'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITIES_ARRAY.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status ?? 'prijavljeno'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES_ARRAY.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL slike (opciono)
          </label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/slika.jpg"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {loading ? 'Čuvanje...' : 'Sačuvaj'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition disabled:bg-gray-100"
          >
            Otkaži
          </button>
        </div>
      </form>
    </div>
  );
}
