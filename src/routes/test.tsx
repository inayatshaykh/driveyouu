import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/test')({
  component: TestPage,
});

function TestPage() {
  const [value, setValue] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Input Test</h1>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type here..."
          className="w-full px-4 py-2 border rounded"
        />
        <p className="mt-4">Value: {value}</p>
      </div>
    </div>
  );
}
