'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import {
    fetchReferralChatMessages,
    sendReferralChatMessage,
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
        minute: "2-digit"
    });
}

export default function ChatModal({
    referralId,
    currentUserUjbCode,
    otherUser,
    onClose
}) {

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [visible, setVisible] = useState(false);

    const messagesEndRef = useRef(null);

    const otherUjbCode = otherUser?.ujbCode;

    useEffect(() => {
        setTimeout(() => setVisible(true), 10);
    }, []);

    const loadMessages = useCallback(async () => {
        if (!referralId || !otherUjbCode) return;

        try {
            const nextMessages = await fetchReferralChatMessages({
                referralId,
                otherUjbCode,
            });
            setMessages(nextMessages);
        } catch (error) {
            console.error("Chat load failed:", error);
            setMessages([]);
        }
    }, [referralId, otherUjbCode]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!message.trim() || !referralId || !otherUjbCode) return;

        try {
            const sentMessage = await sendReferralChatMessage({
                referralId,
                otherUjbCode,
                text: message,
            });

            setMessages((prev) => [...prev, sentMessage].filter(Boolean));
            setMessage("");
        } catch (error) {
            console.error("Chat send failed:", error);
        }
    };

    if (!referralId || !currentUserUjbCode || !otherUjbCode) return null;

    return (
        <div className="fixed inset-0 z-90">

            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />

            <div
                className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col transition-transform duration-300 ${
                    visible ? "translate-y-0" : "translate-y-full"
                }`}
                style={{ height: "90vh" }}
            >

                <div className="px-5 py-4 border-b flex justify-between items-center bg-white rounded-t-3xl">

                    <div>
                        <p className="font-semibold text-slate-900 text-sm">
                            {otherUser?.name}
                        </p>
                        <p className="text-xs text-slate-400">
                            Referral Chat
                        </p>
                    </div>

                    <button onClick={onClose} className="text-slate-400">
                        <X size={20} />
                    </button>

                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">

                    {messages.map(msg => {
                        const isSender =
                            msg.senderUjbCode === currentUserUjbCode;
                        const messageTime = formatMessageTime(msg.createdAt);

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isSender ? "justify-end" : "justify-start"
                                    }`}
                            >

                                <div
                                    className={`max-w-[75%] px-4 py-2 text-sm rounded-2xl
                ${isSender
                                            ? "bg-orange-500 text-white"
                                            : "bg-white border border-slate-200 text-slate-800"
                                        }`}
                                >
                                    {msg.text}

                                    {messageTime && (
                                        <div
                                            className={`text-[10px] mt-1 text-right ${isSender
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

                <div className="px-4 py-3 border-t bg-white flex items-center gap-2">

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
        </div>
    );
}

