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
  const [hasIntroduced, setHasIntroduced] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldContinueRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const getToken = () => {
    if (typeof window === "undefined") return "";

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return "";
    }

    return token;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const handleLogout = () => {
    shouldContinueRef.current = false;
    clearSilenceTimer();

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    cleanupStream();

    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    router.push("/login");
  };

  const playBase64Audio = async (
    base64Audio: string,
    mimeType: string = "audio/wav",
    onEndedCallback?: () => void
  ) => {
    let audioUrl = "";

    try {
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: mimeType });
      audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);

        if (onEndedCallback) {
          onEndedCallback();
          return;
        }

        if (shouldContinueRef.current) {
          setTimeout(() => {
            startRecording(true);
          }, 400);
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);

        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            text: "🔇 AI reply came, but audio could not be played.",
          },
        ]);

        if (onEndedCallback) {
          onEndedCallback();
          return;
        }

        if (shouldContinueRef.current) {
          setTimeout(() => {
            startRecording(true);
          }, 400);
        }
      };

      await audio.play();
    } catch (audioError) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      console.error("Audio playback failed:", audioError);

      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "🔇 AI reply came, but audio could not be played.",
        },
      ]);

      if (onEndedCallback) {
        onEndedCallback();
        return;
      }

      if (shouldContinueRef.current) {
        setTimeout(() => {
          startRecording(true);
        }, 400);
      }
    }
  };

  const speakIntroAndStart = async () => {
    const introText = "Hi, I'm Simran. How can I help you today?";

    setMessages((prev) => [...prev, { role: "agent", text: introText }]);
    setHasIntroduced(true);

    try {
      setLoading(true);

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(introText);
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => {
          setLoading(false);
          setTimeout(() => {
            startRecording(true);
          }, 400);
        };

        utterance.onerror = () => {
          setLoading(false);
          setTimeout(() => {
            startRecording(true);
          }, 400);
        };

        window.speechSynthesis.speak(utterance);
        return;
      }

      setLoading(false);
      setTimeout(() => {
        startRecording(true);
      }, 400);
    } catch (error) {
      console.error("Intro playback failed:", error);
      setLoading(false);
      setTimeout(() => {
        startRecording(true);
      }, 400);
    }
  };

  const startRecording = async (skipIntro = false) => {
    if (loading || recording) return;

    if (!hasIntroduced && !skipIntro) {
      shouldContinueRef.current = true;
      await speakIntroAndStart();
      return;
    }

    try {
      shouldContinueRef.current = true;
      clearSilenceTimer();
      setRecording(true);

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
        clearSilenceTimer();

        try {
          setLoading(true);

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          cleanupStream();

          if (audioBlob.size < 2000) {
            setMessages((prev) => [
              ...prev,
              {
                role: "agent",
                text: "❌ Audio was too short. Please speak clearly and try again.",
              },
            ]);
            shouldContinueRef.current = false;
            return;
          }

          const formData = new FormData();
          formData.append("audio", audioBlob, "voice.webm");

          const token = getToken();
          if (!token) {
            shouldContinueRef.current = false;
            return;
          }

          const res = await sendVoice(formData, token);

          const transcript =
            typeof res?.transcript === "string" && res.transcript.trim()
              ? res.transcript
              : typeof res?.data?.transcript === "string" &&
                res.data.transcript.trim()
              ? res.data.transcript
              : "Could not understand your voice clearly.";

          setMessages((prev) => [
            ...prev,
            { role: "user", text: transcript },
            { role: "agent", text: "Simran is thinking..." },
          ]);

          const replyText =
            typeof res?.reply === "string" && res.reply.trim()
              ? res.reply
              : typeof res?.data?.reply === "string" && res.data.reply.trim()
              ? res.data.reply
              : "AI responded successfully, but no reply text was returned.";

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "agent",
              text: replyText,
            };
            return updated;
          });

          const audioBase64 =
            typeof res?.audio === "string" && res.audio.trim()
              ? res.audio
              : typeof res?.data?.audio === "string" && res.data.audio.trim()
              ? res.data.audio
              : "";

          const audioMimeType =
            typeof res?.audioMimeType === "string" && res.audioMimeType.trim()
              ? res.audioMimeType
              : typeof res?.data?.audioMimeType === "string" &&
                res.data.audioMimeType.trim()
              ? res.data.audioMimeType
              : "audio/wav";

          if (audioBase64) {
            await playBase64Audio(audioBase64, audioMimeType);
          } else if (shouldContinueRef.current) {
            setTimeout(() => {
              startRecording(true);
            }, 400);
          }
        } catch (error: any) {
          console.error("Voice request failed:", error);

          const errorMessage =
            error?.message && typeof error.message === "string"
              ? error.message
              : "Voice request failed. Please try again.";

          setMessages((prev) => [
            ...prev,
            { role: "agent", text: `❌ ${errorMessage}` },
          ]);

          shouldContinueRef.current = false;
        } finally {
          setLoading(false);
          setRecording(false);
        }
      };

      mediaRecorder.start();

      silenceTimerRef.current = setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
      }, 7000);
    } catch (error) {
      console.error("Microphone permission denied:", error);
      cleanupStream();
      clearSilenceTimer();
      setRecording(false);
      shouldContinueRef.current = false;

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
    shouldContinueRef.current = false;
    clearSilenceTimer();

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      cleanupStream();
    }

    setRecording(false);
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
            <span className="text-xl font-bold text-slate-800">SIMRAN AI</span>
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
              {loading
                ? "SIMRAN IS THINKING..."
                : recording
                ? "SIMRAN IS LISTENING..."
                : "READY"}
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
                onClick={() => startRecording(false)}
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
                  No conversation yet. Start speaking to chat with Simran.
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
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}