import { SyntaxVisualizer } from "@/components/SyntaxVisualizer";
import { InteractiveTrainer } from "@/components/InteractiveTrainer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-2">Gaokao 2026 Cockpit</h1>
        <p className="text-center text-gray-600 mb-12">Target Assessment: English 135+ / Total 550+</p>
        
        {/* Module 1: Theory Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Module 1: Visualization Theory (Passive)</h2>
          <SyntaxVisualizer />
        </section>

        {/* Module 2: Active Training */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Module 2: Logic Trainer (Active)</h2>
          <InteractiveTrainer />
        </section>
        
        <div className="mt-12 text-center text-sm text-gray-400">
           Project initialized. Connect Gemini API to enable Essay Grading.
        </div>
      </div>
    </main>
  );
}
