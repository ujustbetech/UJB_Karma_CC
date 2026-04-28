'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import {
  fetchReferralDiscussionMessages,
  sendReferralDiscussionMessage,
} from "@/services/referralService";

function formatMessageTime(createdAt) {
  if (!createdAt) {
    return "";
  }

  const parsed = new Date(createdAt).getTime();

  if (Number.isNaN(parsed)) {
    return "";
  }

  return new Date(parsed).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DiscussionTab({
  referralId,
  currentUserUjbCode,
}) {

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!referralId) return;

    try {
      const nextMessages = await fetchReferralDiscussionMessages(referralId);
      setMessages(nextMessages);
    } catch (error) {
      console.error("Discussion load failed:", error);
      setMessages([]);
    }
  }, [referralId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    try {
      if (!message.trim()) return;

      if (!referralId) {
        console.log("referralId missing");
        return;
      }

      if (!currentUserUjbCode) {
        console.log("currentUserUjbCode missing");
        return;
      }

      const sentMessage = await sendReferralDiscussionMessage({
        referralId,
        text: message,
      });

      setMessages((prev) => [...prev, sentMessage].filter(Boolean));
      setMessage("");
    } catch (error) {
      console.error("Discussion send failed:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            Start discussion about this referral
          </div>
        )}

        {messages.map(msg => {

          const isSender =
            msg.senderUjbCode === currentUserUjbCode;
          const messageTime = formatMessageTime(msg.createdAt);

          return (
            <div
              key={msg.id}
              className={`flex ${
                isSender ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm
                  ${
                    isSender
                      ? "bg-orange-500 text-white"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
              >
                {msg.text}

                {messageTime && (
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isSender
                        ? "text-orange-100"
                        : "text-slate-400"
                    }`}
                  >
                    {messageTime}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t px-4 py-3 flex items-center gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition"
        >
          <Send size={16} />
        </button>
      </div>

    </div>
  );
}
