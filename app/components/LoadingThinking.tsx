'use client';

interface LoadingThinkingProps {
  messages: string[];
}

export default function LoadingThinking({ messages }: LoadingThinkingProps) {
  if (messages.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          {/* Animated thinking icon */}
          <div className="flex-shrink-0">
            <div className="relative">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Searching for programs...
            </h3>

            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-blue-800"
                  style={{
                    animation: `fadeIn 0.3s ease-in`,
                  }}
                >
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span>{message}</span>
                </div>
              ))}
            </div>

            {/* Progress indicator */}
            <div className="mt-4">
              <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full animate-pulse"
                  style={{
                    width: '70%',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
