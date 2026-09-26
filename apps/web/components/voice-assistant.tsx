"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X, Send, Sparkles, CheckCircle2 } from "lucide-react";
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
        "Xin chào! Em là Trợ lý thoại AuraBook. Em có thể hỗ trợ bạn tra cứu đơn hàng, kiểm tra sách trong kho hoặc hủy đơn hàng theo khẩu lệnh.",
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
      alert("Trình duyệt của bạn chưa hỗ trợ Web Speech API. Bạn có thể gõ nội dung vào ô nhập bên dưới.");
      return;
    }

    if (isListening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).start();
    }
  };

  // Text-to-Speech
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Send command to Backend
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
        const fallback = "Dạ, em đã tiếp nhận yêu cầu nhưng hệ thống đang bận. Bạn vui lòng thử lại sau giây lát ạ.";
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
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl shadow-purple-500/40 p-0 flex items-center justify-center border border-purple-400/40 animate-pulse hover:animate-none transition-all"
            title="Mở Trợ Lý Thoại Voice AI"
          >
            <Mic className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  Voice Telephony Agent
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-[10px] text-slate-400">Web Speech API & Gemini 2.0 Flash</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsListening(false);
              }}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation history */}
          <div className="flex-1 p-4 space-y-3 max-h-80 overflow-y-auto text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>

                {/* Function calling result card */}
                {m.actionDetail && (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 max-w-[85%] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Hàm: <b>{m.actionDetail.function_name}</b> (Thực thi thành công)
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span>Gemini đang phân tích khẩu lệnh...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendCommand("Tra cứu trạng thái đơn hàng của tôi")}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors"
            >
              📦 Tra cứu đơn hàng
            </button>
            <button
              onClick={() => handleSendCommand("Hủy đơn hàng đang chờ thanh toán")}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors"
            >
              ❌ Hủy đơn hàng
            </button>
            <button
              onClick={() => handleSendCommand("Sách AI còn hàng trong kho không?")}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors"
            >
              📚 Tồn kho sách
            </button>
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
            <Button
              onClick={toggleListening}
              size="sm"
              className={`rounded-full p-2.5 transition-all ${
                isListening
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-purple-600/30 text-purple-300 hover:bg-purple-600 hover:text-white"
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
              placeholder={isListening ? "Đang lắng nghe giọng nói của bạn..." : "Nhập câu lệnh hoặc nhấn Micro..."}
              className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />

            <Button
              onClick={() => handleSendCommand(inputText)}
              disabled={!inputText.trim()}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
