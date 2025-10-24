
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Save, X, Info, AlertCircle } from "lucide-react"; // Added AlertCircle
import { Alert, AlertDescription } from "@/components/ui/alert";

const categories = [
  { value: "contabil", label: "Contabil" },
  { value: "fiscal", label: "Fiscal" },
  { value: "folha_pagamento", label: "Folha de Pagamento" },
  { value: "tributaria", label: "Tributaria" },
  { value: "reforma_tributaria", label: "Reforma Tributaria" },
  { value: "ifrs", label: "IFRS - Normas Internacionais" },
  { value: "usgaap", label: "US GAAP - Normas Americanas" },
  { value: "geral", label: "Geral (Todas)" }
];

const importanceLevels = [
  { value: "baixa", label: "Baixa ou superior" },
  { value: "media", label: "Media ou superior" },
  { value: "alta", label: "Apenas Alta" }
];

export default function TelegramConfigForm({ config, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    bot_token: config?.bot_token || "",
    category: config?.category || "geral",
    channel_id: config?.channel_id || "",
    message_thread_id: config?.message_thread_id || "",
    channel_name: config?.channel_name || "",
    is_active: config?.is_active !== undefined ? config.is_active : true,
    min_importance: config?.min_importance || "media",
    send_automatically: config?.send_automatically || false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [threadIdError, setThreadIdError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar thread_id antes de enviar
    const threadId = formData.message_thread_id.trim();
    if (threadId !== '' && isNaN(parseInt(threadId))) {
      setThreadIdError("O ID do topico deve ser um numero ou deixe vazio");
      return;
    }
    
    setThreadIdError(""); // Clear any previous error if validation passes
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Erro ao salvar configuracao:", error);
      // Optionally, add a state to display user-friendly error message
      // setError("Falha ao salvar. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'message_thread_id') {
      setThreadIdError(""); // Clear error when user starts typing
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            {config ? "Editar Canal/Topico" : "Novo Canal/Topico do Telegram"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ALERTA PRINCIPAL - DESTAQUE MAIOR */}
            <Alert className="bg-red-50 border-2 border-red-300 shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <AlertDescription className="text-sm text-red-900">
                <div className="space-y-3">
                  <p className="text-base font-bold"> ATENCAO: CONFIGURACAO OBRIGATORIA DO TELEGRAM</p>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <p className="font-semibold mb-2"> Passo a Passo para dar permissoes ao Bot:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li><strong>Abra o Telegram</strong> e va ao seu canal/grupo</li>
                      <li>Clique no <strong>nome do canal</strong> no topo</li>
                      <li>Selecione <strong>"Editar"</strong></li>
                      <li>Va em <strong>"Administradores"</strong></li>
                      <li>Clique em <strong>"Adicionar Administrador"</strong></li>
                      <li>Busque e selecione o <strong>seu bot</strong> (pelo nome do @BotFather)</li>
                      <li>Ative as permissoes:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li> <strong>Postar mensagens</strong></li>
                          <li> <strong>Editar mensagens</strong></li>
                          <li> <strong>Deletar mensagens</strong></li>
                          <li> <strong>Convidar usuarios</strong> (opcional)</li>
                        </ul>
                      </li>
                      <li>Clique em <strong>"Salvar"</strong></li>
                      <li>Agora seu bot esta pronto para enviar mensagens!</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-100 p-3 rounded">
                    <p className="font-semibold text-yellow-900"> Dica Importante:</p>
                    <p className="text-xs text-yellow-800">Se voce nao adicionar o bot como administrador, recebera erro de "not enough rights" ao tentar enviar mensagens.</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Alerta informativo */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Dica:</strong> Voce pode usar o mesmo canal/grupo com diferentes topicos para organizar as noticias por categoria. 
                Basta usar o mesmo <code className="bg-blue-100 px-1 rounded">channel_id</code> e diferentes <code className="bg-blue-100 px-1 rounded">message_thread_id</code>.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="channel_name">Nome do Canal/Topico *</Label>
                <Input
                  id="channel_name"
                  value={formData.channel_name}
                  onChange={(e) => handleInputChange('channel_name', e.target.value)}
                  placeholder="Ex: Topico Contabil"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot_token">Token do Bot *</Label>
              <Input
                id="bot_token"
                type="password"
                value={formData.bot_token}
                onChange={(e) => handleInputChange('bot_token', e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                required
              />
              <p className="text-xs text-gray-500">
                Obtenha o token com @BotFather no Telegram
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="channel_id">ID do Canal/Grupo *</Label>
                <Input
                  id="channel_id"
                  value={formData.channel_id}
                  onChange={(e) => handleInputChange('channel_id', e.target.value)}
                  placeholder="@meucanal ou -1001234567890"
                  required
                />
                <p className="text-xs text-gray-500">
                  Use @userinfobot para obter o ID do canal/grupo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message_thread_id">ID do Topico (Opcional)</Label>
                <Input
                  id="message_thread_id"
                  value={formData.message_thread_id}
                  onChange={(e) => handleInputChange('message_thread_id', e.target.value)}
                  placeholder="Ex: 123 (apenas numeros)"
                  className={threadIdError ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {threadIdError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {threadIdError}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Deixe vazio para enviar ao grupo principal
                </p>
              </div>
            </div>

            {/* Instrucoes melhoradas */}
            <Alert className="bg-amber-50 border-amber-200">
              <Info className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-900">
                <strong>Como obter o ID do topico (passo a passo):</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li><strong>Abra o Telegram</strong> e va ao grupo com topicos</li>
                  <li><strong>Entre no topico</strong> onde quer enviar as noticias</li>
                  <li><strong>Envie uma mensagem</strong> qualquer nesse topico (ex: "teste")</li>
                  <li><strong>Toque e segure</strong> na mensagem que voce enviou</li>
                  <li>Selecione <strong>"Encaminhar"</strong></li>
                  <li>Na busca, digite <strong>@userinfobot</strong> e selecione-o</li>
                  <li>Envie a mensagem para o bot</li>
                  <li>O bot respondera mostrando o <code className="bg-amber-100 px-1 rounded">message_thread_id</code></li>
                  <li><strong>Copie apenas o numero</strong> e cole aqui acima</li>
                </ol>
                <p className="mt-2 text-xs font-semibold"> Dica: Se deixar vazio, as noticias vao para o grupo principal (sem topico especifico)</p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="min_importance">Importancia Minima</Label>
              <Select
                value={formData.min_importance}
                onValueChange={(value) => handleInputChange('min_importance', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a importancia minima" />
                </SelectTrigger>
                <SelectContent>
                  {importanceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Canal/Topico ativo (recebera noticias)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="send_automatically"
                  checked={formData.send_automatically}
                  onCheckedChange={(checked) => handleInputChange('send_automatically', checked)}
                />
                <Label htmlFor="send_automatically" className="text-sm font-medium">
                  Enviar automaticamente apos atualizacao de noticias
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || threadIdError || !formData.channel_name.trim() || !formData.bot_token.trim() || !formData.channel_id.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : config ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
