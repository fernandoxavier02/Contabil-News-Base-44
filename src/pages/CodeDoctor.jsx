
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // Add useLocation
import { agentSDK } from "@/agents";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Loader2, Stethoscope, FileCode } from "lucide-react";
import ChatView from "@/components/diagnostics/ChatView";
import DateVerifier from "@/components/diagnostics/DateVerifier"; // New import

const AGENT_NAME = "code_diagnostics_agent";

function ConversationList({ onSelectConversation }) {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            setIsLoading(true);
            const convs = await agentSDK.listConversations({ agent_name: AGENT_NAME });
            setConversations(convs);
            setIsLoading(false);
        };
        fetchConversations();
    }, []);

    const handleNewConversation = async () => {
        setIsLoading(true);
        const newConv = await agentSDK.createConversation({
            agent_name: AGENT_NAME,
            metadata: {
                name: `Sessao de Diagnostico #${conversations.length + 1}`,
                createdAt: new Date().toISOString(),
            },
        });
        onSelectConversation(newConv.id);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Sessoes de Diagnostico</h2>
                <Button onClick={handleNewConversation}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Sessao
                </Button>
            </div>

            {conversations.length > 0 ? (
                <div className="space-y-3">
                    {conversations.map(conv => (
                        <Link
                            key={conv.id}
                            to={`${createPageUrl("CodeDoctor")}?conversationId=${conv.id}`}
                            className="block p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-md transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                    <p className="font-semibold text-slate-700">{conv.metadata.name || `Sessao ${conv.id.substring(0, 4)}`}</p>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {new Date(conv.metadata.createdAt || conv.created_date).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                    <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600">Nenhuma sessao encontrada</h3>
                    <p className="text-slate-500 mt-1 mb-6">Comece uma nova sessao para diagnosticar problemas.</p>
                    <Button onClick={handleNewConversation}>
                        <Plus className="w-4 h-4 mr-2" />
                        Iniciar Primeira Sessao
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function CodeDoctorPage() {
    const location = useLocation();
    const [conversationId, setConversationId] = useState(null);
    const [activeTab, setActiveTab] = useState("chat"); // New state for tabs

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setConversationId(params.get("conversationId"));
    }, [location.search]);

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
            <div className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto">
                    {!conversationId && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-8 border border-white">
                            <div className="flex items-center gap-4">
                                <Stethoscope className="w-10 h-10 text-blue-600" />
                                <div>
                                    <h1 className="text-4xl font-bold text-[#002855]">Diagnostico IA</h1>
                                    <p className="text-lg text-[#58595B]">
                                        Seu assistente para analisar e corrigir erros de codigo.
                                    </p>
                                </div>
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex gap-2 mt-6 border-b">
                                <button
                                    onClick={() => setActiveTab("chat")}
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        activeTab === "chat" 
                                            ? "border-b-2 border-blue-600 text-blue-600" 
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                     Chat de Diagnostico
                                </button>
                                <button
                                    onClick={() => setActiveTab("dates")}
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        activeTab === "dates" 
                                            ? "border-b-2 border-blue-600 text-blue-600" 
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                     Verificar Datas
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className={conversationId ? 'h-[calc(100vh-48px)]' : ''}>
                        {conversationId ? (
                            <ChatView conversationId={conversationId} />
                        ) : activeTab === "chat" ? ( // Conditional rendering based on activeTab
                            <ConversationList onSelectConversation={(id) => setConversationId(id)} />
                        ) : (
                            <DateVerifier /> // Render DateVerifier when activeTab is "dates"
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
