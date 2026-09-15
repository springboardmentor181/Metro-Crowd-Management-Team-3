import api from "@/lib/axios";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const { data } = await api.post<{ reply: string }>(
    "/api/v1/chatbot/message",
    { messages },
    { signal },
  );
  return data.reply;
}
