import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Save, X } from "lucide-react";

export default function EmailConfigForm({ config, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    recipient_emails: config?.recipient_emails || [],
    category: config?.category || "geral",
    list_name: config?.list_name || "",
    is_active: config?.is_active !== undefined ? config.is_active : true,
    min_importance: config?.min_importance || "media",
    send_automatically: config?.send_automatically || false,
    send_daily_digest: config?.send_daily_digest || false,
    digest_time: config?.digest_time || "08:00"
  });

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="shadow-lg border bg-white/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Mail className="w-5 h-5" />
            {config ? "Editar Lista de Email" : "Nova Lista de Email"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="list_name">Nome da Lista *</Label>
              <Input id="list_name" value={formData.list_name} onChange={(e) => handleInputChange('list_name', e.target.value)} placeholder="Ex: Clientes VIP, Newsletter Semanal" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_emails">Emails dos Destinatarios *</Label>
              <Textarea id="recipient_emails" value={Array.isArray(formData.recipient_emails) ? formData.recipient_emails.join(', ') : ''} onChange={(e) => handleInputChange('recipient_emails', e.target.value.split(',').map(email => email.trim()).filter(email => email))} placeholder="separados por virgula. ex: email1@teste.com, email2@teste.com" className="min-h-[100px]" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email-category">Categoria de Noticias</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger id="email-category">
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
              <div className="space-y-2">
                <Label htmlFor="email-min_importance">Importancia Minima para Envio</Label>
                <Select value={formData.min_importance} onValueChange={(value) => handleInputChange('min_importance', value)}>
                  <SelectTrigger id="email-min_importance">
                    <SelectValue placeholder="Selecione o nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-slate-50/50 space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Lista ativa (recebera noticias)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="send_daily_digest"
                  checked={formData.send_daily_digest}
                  onCheckedChange={(checked) => handleInputChange('send_daily_digest', checked)}
                />
                <Label htmlFor="send_daily_digest" className="text-sm font-medium">
                  Enviar resumo diario ao inves de noticias individuais
                </Label>
              </div>

              {formData.send_daily_digest && (
                <div className="space-y-2 ml-8">
                  <Label htmlFor="digest_time">Horario do Resumo</Label>
                  <Input
                    id="digest_time"
                    type="time"
                    value={formData.digest_time}
                    onChange={(e) => handleInputChange('digest_time', e.target.value)}
                    className="w-40"
                  />
                </div>
              )}

              {!formData.send_daily_digest && (
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
              )}
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
                disabled={isSubmitting || formData.recipient_emails.length === 0}
                className="bg-orange-600 hover:bg-orange-700"
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