
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Save, X } from "lucide-react";
// Removed Info from imports as Alert component is removed

export default function WhatsAppConfigForm({ config, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    api_key: config?.api_key || "",
    account_sid: config?.account_sid || "",
    phone_number: config?.phone_number || "",
    recipient_number: config?.recipient_number || "",
    category: config?.category || "geral",
    channel_name: config?.channel_name || "",
    is_active: config?.is_active !== undefined ? config.is_active : true,
    min_importance: config?.min_importance || "media",
    send_automatically: config?.send_automatically || false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="shadow-lg border bg-white/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <MessageCircle className="w-5 h-5" />
            {config ? "Editar Configuração WhatsApp" : "Nova Configuração WhatsApp"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Removed Alert component for Twilio setup */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="channel_name">Nome do Canal/Grupo *</Label>
                <Input id="channel_name" value={formData.channel_name} onChange={(e) => handleInputChange('channel_name', e.target.value)} placeholder="Ex: Contabilidade Diária" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-category">Categoria de Notícias</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger id="wa-category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral (Todas)</SelectItem>
                    <SelectItem value="contabil">Contábil</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="folha_pagamento">Folha de Pagamento</SelectItem>
                    <SelectItem value="tributaria">Tributária</SelectItem>
                    <SelectItem value="reforma_tributaria">Reforma Tributária</SelectItem>
                    <SelectItem value="ifrs">IFRS</SelectItem>
                    <SelectItem value="usgaap">US GAAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-slate-50/50 space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Credenciais (Twilio)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="account_sid">Account SID *</Label>
                  <Input id="account_sid" value={formData.account_sid} onChange={(e) => handleInputChange('account_sid', e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key">Auth Token *</Label>
                  <Input id="api_key" type="password" value={formData.api_key} onChange={(e) => handleInputChange('api_key', e.target.value)} placeholder="••••••••••••••••••••" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Número de Envio (Twilio) *</Label>
                  <Input id="phone_number" value={formData.phone_number} onChange={(e) => handleInputChange('phone_number', e.target.value)} placeholder="whatsapp:+14155238886" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_number">Número do Destinatário *</Label>
                  <Input id="recipient_number" value={formData.recipient_number} onChange={(e) => handleInputChange('recipient_number', e.target.value)} placeholder="whatsapp:+5511999999999" required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-min_importance">Importância Mínima para Envio</Label>
              <Select value={formData.min_importance} onValueChange={(value) => handleInputChange('min_importance', value)}>
                <SelectTrigger id="wa-min_importance">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
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
                  Canal ativo (receberá notícias)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="send_automatically"
                  checked={formData.send_automatically}
                  onCheckedChange={(checked) => handleInputChange('send_automatically', checked)}
                />
                <Label htmlFor="send_automatically" className="text-sm font-medium">
                  Enviar automaticamente após atualização de notícias
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
                className="bg-green-600 hover:bg-green-700"
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
