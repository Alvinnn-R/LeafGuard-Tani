import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          React + Tailwind + Vite
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Setup berhasil! Kamu siap untuk mulai ngoding.
        </p>
        <div className="flex justify-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300 ease-in-out">
            Mulai Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
