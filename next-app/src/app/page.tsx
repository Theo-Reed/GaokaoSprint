import { SyntaxVisualizer } from "@/components/SyntaxVisualizer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-2">Gaokao 2026 Cockpit</h1>
        <p className="text-center text-gray-600 mb-12">Target Assessment: English 135+ / Total 550+</p>
        
        <SyntaxVisualizer />
        
        <div className="mt-12 text-center text-sm text-gray-400">
           Project initialized. Connect Gemini API to enable Essay Grading.
        </div>
      </div>
    </main>
  );
}
