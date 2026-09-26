"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X, Send, Sparkles, CheckCircle2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  actionDetail?: {
    function_name: string;
    arguments: Record<string, unknown>;
    result: Record<string, unknown>;
  };
}

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Xin chào! Em là Trợ lý thoại AuraBook AI. Em có thể hỗ trợ bạn tra cứu đơn hàng, kiểm tra sách trong kho hoặc hủy đơn theo khẩu lệnh giọng nói.",
    },
  ]);

  const recognitionRef = useRef<unknown>(null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.lang = "vi-VN";
        reco.interimResults = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reco.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setIsListening(false);
          handleSendCommand(text);
        };

        reco.onerror = () => {
          setIsListening(false);
        };

        reco.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = reco;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Trình duyệt của bạn chưa hỗ trợ Web Speech API. Bạn có thể gõ câu lệnh vào ô chat bên dưới!");
      return;
    }

    if (isListening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).stop();
      setIsListening(false);
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (recognitionRef.current as any).start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendCommand = async (command: string) => {
    if (!command.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: command }]);
    setInputText("");
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiBase}/api/v1/ai/voice-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transcript: command }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.spoken_response,
            actionDetail: data.action_detail,
          },
        ]);
        speakText(data.spoken_response);
      } else {
        const fallback = "Dạ, em đã tiếp nhận yêu cầu nhưng máy chủ đang bận. Bạn vui lòng thử lại sau giây lát ạ.";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
        speakText(fallback);
      }
    } catch {
      const fallback = "Dạ, kết nối tới máy chủ AI đang gián đoạn. Bạn vui lòng kiểm tra lại mạng nhé.";
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
      speakText(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button - Modern Ocean Blue + Warm Gold Ring */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
          <div className="hidden md:flex items-center px-3.5 py-1.5 rounded-full bg-white/95 border border-sky-200/80 shadow-lg text-xs font-semibold text-sky-950 backdrop-blur-md animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
            Nói với Trợ lý AI
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full w-14 h-14 bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-700 hover:from-sky-600 hover:to-blue-800 text-white shadow-xl shadow-sky-500/30 p-0 flex items-center justify-center border-2 border-white ring-4 ring-amber-400/40 hover:scale-110 transition-all duration-300"
            title="Mở Trợ Lý Thoại Voice AI"
          >
            <Mic className="w-6 h-6 animate-pulse" />
          </Button>
        </div>
      )}

      {/* Floating Chat Modal - Pure White + Ocean Blue + Warm Gold */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white/98 border border-sky-100 rounded-3xl shadow-2xl shadow-sky-950/15 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 ring-1 ring-slate-900/5">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-sky-50 bg-gradient-to-r from-sky-50/80 via-white to-amber-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  AuraBook Voice Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </h3>
                <p className="text-[11px] text-sky-700 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Gemini 2.0 Telephony Agent
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsListening(false);
              }}
              className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation history */}
          <div className="flex-1 p-4 space-y-3.5 max-h-80 overflow-y-auto text-xs bg-slate-50/40">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-br-xs shadow-sky-500/10"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-slate-200/40"
                  }`}
                >
                  {m.content}
                </div>

                {/* Function calling result card */}
                {m.actionDetail && (
                  <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 max-w-[85%] flex items-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Gọi hàm hệ thống: <b className="font-semibold text-slate-900">{m.actionDetail.function_name}</b> (Thành công)
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-sky-700 text-xs py-1 px-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span>AI đang phân tích khẩu lệnh của bạn...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSendCommand("Tra cứu trạng thái đơn hàng của tôi")}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200/60 font-medium whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>📦</span> Tra cứu đơn hàng
            </button>
            <button
              onClick={() => handleSendCommand("Hủy đơn hàng đang chờ thanh toán")}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200/60 font-medium whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>❌</span> Hủy đơn
            </button>
            <button
              onClick={() => handleSendCommand("Sách AI còn hàng trong kho không?")}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200/60 font-medium whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>📚</span> Tồn kho sách
            </button>
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2">
            <Button
              onClick={toggleListening}
              size="sm"
              className={`rounded-2xl p-2.5 transition-all shadow-sm ${
                isListening
                  ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-2 ring-rose-300"
                  : "bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200/80"
              }`}
              title={isListening ? "Đang lắng nghe... (Nhấn để dừng)" : "Nhấn để nói tiếng Việt"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCommand(inputText)}
              placeholder={isListening ? "Đang lắng nghe giọng nói..." : "Nhập lệnh hoặc nhấn mic..."}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
            />

            <Button
              onClick={() => handleSendCommand(inputText)}
              disabled={!inputText.trim()}
              size="sm"
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-2xl px-3.5 shadow-md shadow-sky-500/20"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
