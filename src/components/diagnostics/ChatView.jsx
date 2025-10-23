import React, { useState, useEffect, useRef } from "react";
import { agentSDK } from "@/agents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, CornerDownLeft, Loader2, ArrowLeft } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ChatView({ conversationId }) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!conversationId) return;

        let isSubscribed = true;

        const loadConversation = async () => {
            const conv = await agentSDK.getConversation(conversationId);
            if (isSubscribed) {
                setConversation(conv);
            }
        };
        loadConversation();

        const unsubscribe = agentSDK.subscribeToConversation(conversationId, (data) => {
            if (isSubscribed) {
                setMessages(data.messages);
                const lastMessage = data.messages[data.messages.length - 1];
                setIsStreaming(lastMessage.role === 'assistant' && lastMessage.is_streaming);
            }
        });

        return () => {
            isSubscribed = false;
            unsubscribe();
        };
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;
        
        const tempInput = input;
        setInput("");
        
        try {
            await agentSDK.addMessage(conversation, {
                role: "user",
                content: tempInput
            });
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            // Re-set input if sending fails
            setInput(tempInput);
        }
    };

    if (!conversation) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
            <div className="p-4 border-b bg-white/80 backdrop-blur-lg rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <Link to={createPageUrl("CodeDoctor")} className="p-2 rounded-full hover:bg-slate-100">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">
                        {conversation.metadata?.name || 'Sessão de Diagnóstico'}
                    </h2>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto w-full">
                    {messages.map((msg, index) => (
                        <MessageBubble key={index} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t bg-white/80 backdrop-blur-lg rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                    <div className="relative">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Cole um log de erro ou descreva seu problema..."
                            className="pr-24 min-h-[50px]"
                            disabled={isStreaming}
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                           <p className="text-xs text-slate-400">Shift+Enter para nova linha</p>
                           <Button type="submit" size="sm" disabled={!input.trim() || isStreaming}>
                               {isStreaming ? (
                                   <Loader2 className="w-4 h-4 animate-spin" />
                               ) : (
                                   <Send className="w-4 h-4" />
                               )}
                           </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}