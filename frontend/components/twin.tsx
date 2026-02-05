// 這個 twin.tsx 是前端的 React 元件，實作 AI 聊天室介面。
// 主要功能如下：

// 1.顯示對話訊息（使用者/AI），支援多輪對話與 session 維護。
// 2.讓使用者輸入訊息並送出（按 Enter 或按鈕）。
// 3.根據環境變數自動切換 API 網址，呼叫後端取得 AI 回覆。
// 4.自動捲到最底、顯示 loading 動畫、處理錯誤訊息。
// 5.使用 Next.js client component，適合瀏覽器端互動。

// 簡單說：這是「AI 聊天室」的前端互動元件，負責訊息顯示、輸入、API 溝通與使用者體驗。

"use client"; // Next.js 指令，讓這個元件在瀏覽器端執行（Client Component）

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react"; // 匯入 icon 元件

// 定義訊息型別，包含 id、角色、內容、時間戳
interface Message {
  id: string; // 訊息唯一識別碼
  role: "user" | "assistant"; // 訊息角色（使用者/AI）
  content: string; // 訊息內容
  timestamp: Date; // 訊息時間
}

export default function Twin() {
  // 訊息列表狀態
  const [messages, setMessages] = useState<Message[]>([]);
  // 輸入框內容狀態
  const [input, setInput] = useState("");
  // 是否正在等待 AI 回覆
  const [isLoading, setIsLoading] = useState(false);
  // sessionId 用於多輪對話（後端辨識同一對話）
  const [sessionId, setSessionId] = useState<string>("");
  // 用於自動捲動到底部
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 捲動到訊息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 每當 messages 更新時，自動捲到最底
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 發送訊息給後端 API
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return; // 空字串或正在 loading 時不送出

    // 建立使用者訊息物件
    const userMessage: Message = {
      id: Date.now().toString(), // 以 timestamp 當 id
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]); // 新增到訊息列表
    setInput(""); // 清空輸入框
    setIsLoading(true); // 進入 loading 狀態

    try {
      // 呼叫後端 API，取得 AI 回覆
      // const response = await fetch("http://localhost:8000/chat", {
      // const response = await fetch(
      //   "https://uo661axchi.execute-api.ap-southeast-1.amazonaws.com/chat",
      //   {
      // 依據環境變數自動切換 API 網址，預設本地端
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input, // 傳送使用者輸入
            session_id: sessionId || undefined, // 傳遞 sessionId（多輪對話用）
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to send message"); // API 回應失敗

      const data = await response.json(); // 解析回傳 JSON

      // 若第一次對話，從回傳取得 session_id
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      // 建立 AI 回覆訊息物件
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(), // 避免 id 重複
        role: "assistant",
        content: data.response, // AI 回覆內容
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]); // 新增到訊息列表
    } catch (error) {
      console.error("Error:", error);
      // Add error message
      // 發生錯誤時顯示預設錯誤訊息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // 結束 loading 狀態
    }
  };

  // 處理輸入框按鍵事件，按 Enter（不含 Shift）時送出訊息
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-lg">
      {/* Header - 頁首區塊，顯示標題與副標題 */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          AI Digital Twin
        </h2>
        <p className="text-sm text-slate-300 mt-1">Your AI course companion</p>
      </div>

      {/* Messages - 對話訊息區 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 若尚無訊息，顯示歡迎訊息 */}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Hello! I&apos;m your Digital Twin.</p>
            <p className="text-sm mt-2">Ask me anything about AI deployment!</p>
          </div>
        )}

        {/* 逐筆渲染訊息 */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* AI 訊息顯示頭像 */}
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            {/* 訊息氣泡 */}
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-slate-700 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === "user" ? "text-slate-300" : "text-gray-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {/* 使用者訊息顯示頭像 */}
            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* loading 動畫（等待 AI 回覆時顯示） */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        {/* 捲動定位點 */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - 輸入區塊 */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)} // 更新輸入內容
            onKeyDown={handleKeyPress} // 處理 Enter 送出
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-gray-800"
            disabled={isLoading} // loading 時禁用輸入
          />
          <button
            onClick={sendMessage} // 按下按鈕送出訊息
            disabled={!input.trim() || isLoading} // 無內容或 loading 時禁用
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
