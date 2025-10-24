
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
  const [formErrors, setFormErrors] = useState({});

  const validateForm = (data) => {
    const errors = {};

    if (!data.channel_name.trim()) {
      errors.channel_name = "Informe o nome do canal ou grupo.";
    }

    const requiredFields = [
      { field: "account_sid", label: "Account SID" },
      { field: "api_key", label: "Auth Token" },
      { field: "phone_number", label: "Numero de envio" },
      { field: "recipient_number", label: "Numero do destinatario" },
    ];

    requiredFields.forEach(({ field, label }) => {
      if (!data[field].trim()) {
        errors[field] = `O campo ${label} e obrigatorio.`;
      }
    });

    const phoneFields = ["phone_number", "recipient_number"];
    phoneFields.forEach((field) => {
      const value = data[field].trim();
      if (value && !value.startsWith("whatsapp:")) {
        errors[field] = "O numero deve comecar com \"whatsapp:+\" seguido do DDI.";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!validateForm(formData)) {
        return;
      }
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
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
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
            {config ? "Editar Configuracao WhatsApp" : "Nova Configuracao WhatsApp"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Removed Alert component for Twilio setup */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="channel_name">Nome do Canal/Grupo *</Label>
                <Input id="channel_name" value={formData.channel_name} onChange={(e) => handleInputChange('channel_name', e.target.value)} placeholder="Ex: Contabilidade Diaria" required />
                {formErrors.channel_name && (
                  <p className="text-sm text-red-600">{formErrors.channel_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-category">Categoria de Noticias</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger id="wa-category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

            <div className="p-4 border rounded-lg bg-slate-50/50 space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Credenciais (Twilio)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="account_sid">Account SID *</Label>
                  <Input id="account_sid" value={formData.account_sid} onChange={(e) => handleInputChange('account_sid', e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" required />
                  {formErrors.account_sid && (
                    <p className="text-sm text-red-600">{formErrors.account_sid}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key">Auth Token *</Label>
                  <Input id="api_key" type="password" value={formData.api_key} onChange={(e) => handleInputChange('api_key', e.target.value)} placeholder="" required />
                  {formErrors.api_key && (
                    <p className="text-sm text-red-600">{formErrors.api_key}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Numero de Envio (Twilio) *</Label>
                  <Input id="phone_number" value={formData.phone_number} onChange={(e) => handleInputChange('phone_number', e.target.value)} placeholder="whatsapp:+14155238886" required />
                  {formErrors.phone_number && (
                    <p className="text-sm text-red-600">{formErrors.phone_number}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_number">Numero do Destinatario *</Label>
                  <Input id="recipient_number" value={formData.recipient_number} onChange={(e) => handleInputChange('recipient_number', e.target.value)} placeholder="whatsapp:+5511999999999" required />
                  {formErrors.recipient_number && (
                    <p className="text-sm text-red-600">{formErrors.recipient_number}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-min_importance">Importancia Minima para Envio</Label>
              <Select value={formData.min_importance} onValueChange={(value) => handleInputChange('min_importance', value)}>
                <SelectTrigger id="wa-min_importance">
                  <SelectValue placeholder="Selecione o nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
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
