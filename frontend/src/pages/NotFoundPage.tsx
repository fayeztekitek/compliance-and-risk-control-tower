import { useNavigate } from "react-router-dom";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <div className="bg-slate-100 rounded-full p-4 w-fit mx-auto mb-6">
          <FileQuestion className="w-12 h-12 text-slate-400" />
        </div>
        <h1 className="text-6xl font-bold text-slate-800 mb-2">404</h1>
        <p className="text-lg text-slate-500 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
