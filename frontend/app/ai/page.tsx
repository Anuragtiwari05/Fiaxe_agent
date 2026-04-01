"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendVoice } from "../utils/api";

type Message = {
  role: "agent" | "user";
  text: string;
};

export default function AIPage() {
  const router = useRouter();

  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [checked, setChecked] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const playBase64Audio = async (
    base64Audio: string,
    mimeType: string = "audio/wav"
  ) => {
    try {
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (audioError) {
      console.error("Audio playback failed:", audioError);
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "🔇 AI reply came, but audio could not be played.",
        },
      ]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setLoading(true);

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          if (audioBlob.size === 0) {
            setMessages((prev) => [
              ...prev,
              { role: "agent", text: "No audio recorded. Please try again." },
            ]);
            return;
          }

          const formData = new FormData();
          formData.append("audio", audioBlob, "voice.webm");

          const res = await sendVoice(formData);

          const transcript =
            typeof res?.data?.transcript === "string" &&
            res.data.transcript.trim()
              ? res.data.transcript
              : "Could not understand your voice clearly.";

          const replyText =
            typeof res?.data?.reply === "string" && res.data.reply.trim()
              ? res.data.reply
              : "AI responded successfully, but no reply text was returned.";

          setMessages((prev) => [
            ...prev,
            { role: "user", text: transcript },
            { role: "agent", text: replyText },
          ]);

          if (res?.data?.audio && typeof res.data.audio === "string") {
            const mimeType =
              typeof res?.data?.audioMimeType === "string" &&
              res.data.audioMimeType.trim()
                ? res.data.audioMimeType
                : "audio/wav";

            await playBase64Audio(res.data.audio, mimeType);
          }
        } catch (error: any) {
          console.error("Voice request failed:", error);

          const errorMessage =
            typeof error?.response?.data?.message === "string"
              ? error.response.data.message
              : "Voice request failed. Please try again.";

          setMessages((prev) => [
            ...prev,
            { role: "agent", text: `❌ ${errorMessage}` },
          ]);
        } finally {
          setLoading(false);

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Microphone permission denied or unavailable.",
        },
      ]);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  if (!checked) return null;

  return (
    <main className="min-h-screen bg-[#F1F5F9]">
      <header className="w-full bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 text-white p-1.5 rounded-lg text-xl">
              💬
            </div>
            <span className="text-xl font-bold text-slate-800">AI AGENT</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-slate-200 p-10 flex flex-col items-center">
            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center text-5xl">
              🤖
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-800">
              {loading ? "PROCESSING..." : recording ? "LISTENING..." : "READY"}
            </h2>

            <p className="text-slate-500 mt-2">
              {recording
                ? "Speak now..."
                : loading
                ? "Converting speech and generating response..."
                : "Click below to start"}
            </p>

            {!recording ? (
              <button
                onClick={startRecording}
                disabled={loading}
                className="mt-6 px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 disabled:opacity-50"
              >
                🎤 Start Talking
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="mt-6 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
              >
                ⏹ Stop
              </button>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[500px]">
            <div className="p-4 border-b text-sm font-semibold text-slate-600">
              Conversation
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No conversation yet. Start speaking to chat with the AI.
                </p>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-sm max-w-[80%] ${
                      msg.role === "agent"
                        ? "bg-slate-100 text-slate-800"
                        : "bg-slate-800 text-white ml-auto"
                    }`}
                  >
                    {String(msg.text)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}