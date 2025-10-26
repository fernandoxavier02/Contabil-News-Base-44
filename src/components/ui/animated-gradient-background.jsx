/**
 * Componente de fundo com gradiente animado
 * Usado em múltiplas páginas para manter consistência visual
 */
export function AnimatedGradientBackground({ children }) {
  return (
    <div className="min-h-screen animated-gradient">
      <style>{`
        .animated-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white/85 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
