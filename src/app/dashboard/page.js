// Dashboard stranica - Glavna stranica sa mapom

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import ProblemForm from '@/components/ProblemForm';
import ProblemList from '@/components/ProblemList';

// Dinamički učitaj Map komponentu (Leaflet ne radi sa SSR)
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <p>Učitavanje mape...</p>
    </div>
  ),
});

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingProblem, setEditingProblem] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);

  // Zaštita rute - samo ulogovani korisnici
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Učitaj probleme
  useEffect(() => {
    if (session) {
      fetchProblems();
    }
  }, [session]);

  const fetchProblems = async () => {
    try {
      const res = await fetch('/api/problems');
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      }
    } catch (error) {
      console.error('Greška pri učitavanju problema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarker = (latlng) => {
    setSelectedLocation(latlng);
    setEditingProblem(null);
    setShowForm(true);
  };

  const handleSubmitProblem = async (formData) => {
    try {
      const url = editingProblem 
        ? `/api/problems/${editingProblem.id}`
        : '/api/problems';
      
      const method = editingProblem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Greška pri čuvanju');
      }

      await fetchProblems();
      setShowForm(false);
      setSelectedLocation(null);
      setEditingProblem(null);
    } catch (error) {
      throw error;
    }
  };

  const handleEditProblem = (problem) => {
    setEditingProblem(problem);
    setShowForm(true);
  };

  const handleDeleteProblem = async (problemId) => {
    try {
      const res = await fetch(`/api/problems/${problemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchProblems();
      }
    } catch (error) {
      console.error('Greška pri brisanju:', error);
      alert('Došlo je do greške pri brisanju problema');
    }
  };

  const handleMarkerClick = (problem) => {
    setSelectedProblem(problem);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Mapa */}
        <div className="flex-1 relative">
          <Map
            problems={problems}
            onAddMarker={handleAddMarker}
            onMarkerClick={handleMarkerClick}
          />

          {/* Forma za dodavanje/izmenu */}
          {showForm && (
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
              <ProblemForm
                onSubmit={handleSubmitProblem}
                onCancel={() => {
                  setShowForm(false);
                  setSelectedLocation(null);
                  setEditingProblem(null);
                }}
                initialData={editingProblem}
                selectedLocation={selectedLocation}
              />
            </div>
          )}

          {/* Instrukcije */}
          <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[500]">
            <p className="text-sm font-semibold text-gray-700">
              Klikni na mapu da dodaš novi problem
            </p>
          </div>
        </div>

        {/* Sidebar sa listom problema */}
        <div className="w-96 bg-gray-50 overflow-hidden">
          <ProblemList
            problems={problems}
            onProblemClick={handleMarkerClick}
            onEditProblem={handleEditProblem}
            onDeleteProblem={handleDeleteProblem}
          />
        </div>
      </div>
    </div>
  );
}