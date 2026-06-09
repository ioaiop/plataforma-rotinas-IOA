export default function EstoquePage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center">
          <span className="text-4xl">📝</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Procedimento Operacional Padrão
        </h1>

        <p className="text-gray-600 leading-relaxed mb-6">
          Este módulo está em produção
        </p>

        <a
          href="https://www.instagram.com/ivelcod"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          🚀 Saiba mais com a Ivel Cod
        </a>
      </div>
    </div>
  );
}
