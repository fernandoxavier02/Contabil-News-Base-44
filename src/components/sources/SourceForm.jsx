
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Save, X, Rss, Code } from "lucide-react";

const URL_FIELDS = ["website", "logo_url", "rss_feed_url", "api_endpoint"];

function isValidUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch (error) {
    return false;
  }
}

export default function SourceForm({ source, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: source?.name || "",
    description: source?.description || "",
    website: source?.website || "",
    logo_url: source?.logo_url || "",
    update_method: source?.update_method || "llm",
    rss_feed_url: source?.rss_feed_url || "",
    api_endpoint: source?.api_endpoint || "",
    is_active: source?.is_active !== undefined ? source.is_active : true,
    credibility_level: source?.credibility_level || "alta"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = (data) => {
    const errors = {};

    if (!data.name.trim()) {
      errors.name = "Informe um nome para a fonte.";
    }

    URL_FIELDS.forEach((field) => {
      if (!isValidUrl(data[field])) {
        errors[field] = "Informe uma URL válida (incluindo http/https).";
      }
    });

    if (data.update_method === "rss" && !data.rss_feed_url.trim()) {
      errors.rss_feed_url = "O feed RSS é obrigatório quando o método escolhido for RSS.";
    }

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
      console.error("Erro ao salvar fonte:", error);
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
      <Card className="shadow-2xl border border-white bg-white/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            {source ? "Editar Fonte" : "Nova Fonte"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Fonte *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Receita Federal"
                  required
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="credibility_level">Nível de Credibilidade</Label>
                <Select
                  value={formData.credibility_level}
                  onValueChange={(value) => handleInputChange('credibility_level', value)}
                >
                  <SelectTrigger id="credibility_level">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta Credibilidade</SelectItem>
                    <SelectItem value="media">Credibilidade Média</SelectItem>
                    <SelectItem value="baixa">Baixa Credibilidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva a fonte de notícias..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="website">Site Oficial</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://exemplo.com"
                />
                {formErrors.website && (
                  <p className="text-sm text-red-600">{formErrors.website}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL do Logo</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
                {formErrors.logo_url && (
                  <p className="text-sm text-red-600">{formErrors.logo_url}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
              <div className="space-y-2">
                <Label htmlFor="update_method">Método de Atualização</Label>
                <Select
                  value={formData.update_method}
                  onValueChange={(value) => handleInputChange('update_method', value)}
                >
                  <SelectTrigger id="update_method">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llm">IA Genérica (LLM)</SelectItem>
                    <SelectItem value="rss">Feed RSS</SelectItem>
                    <SelectItem value="api" disabled>API Dedicada (em breve)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.update_method === 'rss' && (
                <div className="space-y-2">
                  <Label htmlFor="rss_feed_url">URL do Feed RSS</Label>
                  <div className="relative">
                    <Rss className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="rss_feed_url"
                      type="url"
                      value={formData.rss_feed_url}
                      onChange={(e) => handleInputChange('rss_feed_url', e.target.value)}
                      placeholder="https://exemplo.com/feed.xml"
                      className="pl-10"
                    />
                    {formErrors.rss_feed_url && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.rss_feed_url}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active" className="text-sm font-medium">
                Fonte ativa (visível no feed)
              </Label>
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
                disabled={isSubmitting || !formData.name.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : source ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
