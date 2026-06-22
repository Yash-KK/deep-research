import { MessageCircle, X } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function ChatButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 active:scale-95 text-white shadow-xl shadow-violet-600/30 flex items-center justify-center transition-all duration-200 hover:scale-110"
      title="Open quick search"
      aria-label="Open chat"
    >
      <MessageCircle size={22} />
    </button>
  );
}

export function ChatCloseButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 active:scale-95 text-white shadow-lg flex items-center justify-center transition-all duration-200"
      title="Close chat"
      aria-label="Close chat"
    >
      <X size={22} />
    </button>
  );
}
