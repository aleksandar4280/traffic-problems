// Navbar komponenta

'use client';

import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">Traffic Problems</h1>
        </div>

        <div className="flex items-center space-x-4">
          {session?.user && (
            <>
              <span className="text-sm">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md text-sm transition"
              >
                Odjavi se
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}