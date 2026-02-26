'use client';

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import {
    doc,
    collection,
    addDoc,
    setDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

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

    const chatId =
        currentUserUjbCode && otherUjbCode
            ? [currentUserUjbCode, otherUjbCode]
                .sort()
                .join("_") + "_" + referralId
            : null;

    /* Slide animation */
    useEffect(() => {
        setTimeout(() => setVisible(true), 10);
    }, []);

    /* Firestore listener */
    useEffect(() => {
        if (!chatId) return;

        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [chatId]);

    /* Auto scroll */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!message.trim() || !chatId) return;

        await setDoc(
            doc(db, "chats", chatId),
            {
                participants: [currentUserUjbCode, otherUjbCode],
                referralId,
                updatedAt: serverTimestamp(),
                lastMessage: message
            },
            { merge: true }
        );

        await addDoc(
            collection(db, "chats", chatId, "messages"),
            {
                senderUjbCode: currentUserUjbCode,
                text: message,
                createdAt: serverTimestamp(),
            }
        );

        setMessage("");
    };

    if (!chatId) return null;

    return (
        <div className="fixed inset-0 z-90">

            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col"
                style={{ height: "90vh" }}>

                {/* Header (Clean, Flat) */}
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

                {/* Messages Area (Soft neutral bg) */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">

                    {messages.map(msg => {
                        const isSender =
                            msg.senderUjbCode === currentUserUjbCode;

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

                                    <div
                                        className={`text-[10px] mt-1 text-right ${isSender
                                                ? "text-orange-100"
                                                : "text-slate-400"
                                            }`}
                                    >
                                        {msg.createdAt &&
                                            new Date(
                                                msg.createdAt.seconds * 1000
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                    </div>
                                </div>

                            </div>
                        );
                    })}

                </div>

                {/* Input */}
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