
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Save, X, Plus, Trash } from "lucide-react";

export default function TeamsConfigForm({ config, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    webhook_url: config?.webhook_url || "",
    category: config?.category || "geral",
    channel_name: config?.channel_name || "",
    team_name: config?.team_name || "",
    is_active: config?.is_active !== undefined ? config.is_active : true,
    min_importance: config?.min_importance || "media",
    send_automatically: config?.send_automatically || false,
    mention_users: config?.mention_users || []
  });

  const [newMentionEmail, setNewMentionEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Erro ao salvar configuracao:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMentionUser = () => {
    if (newMentionEmail && !formData.mention_users.includes(newMentionEmail)) {
      setFormData(prev => ({
        ...prev,
        mention_users: [...prev.mention_users, newMentionEmail]
      }));
      setNewMentionEmail("");
    }
  };

  const removeMentionUser = (email) => {
    setFormData(prev => ({
      ...prev,
      mention_users: prev.mention_users.filter(e => e !== email)
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="shadow-lg border bg-white/90 backdrop-blur-md"> {/* Updated Card styling */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700"> {/* Updated CardTitle styling */}
            <Users className="w-5 h-5" /> {/* Removed specific text color as parent text-purple-700 applies */}
            {config ? "Editar Configuracao Teams" : "Nova Configuracao Teams"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Removed the Alert component as per the outline */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="teams-channel_name">Nome do Canal *</Label> {/* Updated htmlFor */}
                <Input
                  id="teams-channel_name" // Updated id
                  value={formData.channel_name}
                  onChange={(e) => handleInputChange('channel_name', e.target.value)}
                  placeholder="Ex: Alertas Fiscais" // Updated placeholder
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team_name">Nome da Equipe</Label> {/* Label for consistency with team_name */}
                <Input
                  id="team_name"
                  value={formData.team_name}
                  onChange={(e) => handleInputChange('team_name', e.target.value)}
                  placeholder="Ex: Departamento Contabil" // Updated placeholder
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">URL do Webhook *</Label> {/* Updated label text */}
              <Input
                id="webhook_url"
                type="url"
                value={formData.webhook_url}
                onChange={(e) => handleInputChange('webhook_url', e.target.value)}
                placeholder="https://outlook.office.com/webhook/..."
                required
              />
              <p className="text-xs text-gray-500">
                URL do Incoming Webhook do Teams
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="teams-category">Categoria de Noticias</Label> {/* Updated htmlFor and label text */}
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger id="teams-category"> {/* Updated id */}
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Hardcoded SelectItems as per outline, replacing dynamic mapping */}
                    <SelectItem value="geral">Geral (Todas)</SelectItem>
                    <SelectItem value="contabil">Contabil</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="folha_pagamento">Folha de Pagamento</SelectItem>
                    <SelectItem value="tributaria">Tributaria</SelectItem>
                    <SelectItem value="reforma_tributaria">Reforma Tributaria</SelectItem>
                    <SelectItem value="ifrs">IFRS</SelectItem>
                    <SelectItem value="usgaap">US GAAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teams-min_importance">Importancia Minima para Envio</Label> {/* Updated htmlFor and label text */}
                <Select
                  value={formData.min_importance}
                  onValueChange={(value) => handleInputChange('min_importance', value)}
                >
                  <SelectTrigger id="teams-min_importance"> {/* Updated id */}
                    <SelectValue placeholder="Selecione o nivel" /> {/* Updated placeholder text */}
                  </SelectTrigger>
                  <SelectContent>
                    {/* Hardcoded SelectItems as per outline, replacing dynamic mapping */}
                    <SelectItem value="baixa">Baixa</SelectItem> {/* Updated label */}
                    <SelectItem value="media">Media</SelectItem> {/* Updated label */}
                    <SelectItem value="alta">Alta</SelectItem>   {/* Updated label */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Mencionar Usuarios (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  value={newMentionEmail}
                  onChange={(e) => setNewMentionEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  type="email"
                />
                <Button type="button" onClick={addMentionUser} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.mention_users.length > 0 && (
                <div className="space-y-2">
                  {formData.mention_users.map((email) => (
                    <div key={email} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{email}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMentionUser(email)}
                      >
                        <Trash className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Canal ativo (recebera noticias)
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
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
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
