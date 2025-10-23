import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Edit, Trash2, Eye, EyeOff, ExternalLink, Shield, RefreshCw, Loader2, Rss, Bot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const credibilityColors = {
  alta: "bg-green-100 text-green-800 border-green-200",
  media: "bg-yellow-100 text-yellow-800 border-yellow-200",
  baixa: "bg-red-100 text-red-800 border-red-200"
};

const credibilityLabels = {
  alta: "Alta Credibilidade",
  media: "Credibilidade Média",
  baixa: "Baixa Credibilidade"
};

const methodConfig = {
    rss: { label: "RSS", icon: Rss, color: "bg-orange-100 text-orange-800" },
    llm: { label: "IA", icon: Bot, color: "bg-purple-100 text-purple-800" },
    api: { label: "API", icon: Rss, color: "bg-cyan-100 text-cyan-800" }
}

export default function SourceCard({ source, onEdit, onDelete, onToggleActive, onScrapeSource, isScraping }) {
  const handleScrapeClick = (e) => {
    e.stopPropagation();
    if (onScrapeSource && !isScraping) {
      onScrapeSource(source);
    }
  };
  
  const Method = methodConfig[source.update_method] || methodConfig.llm;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl backdrop-blur-lg border border-white ${
        source.is_active ? 'bg-white/90' : 'bg-gray-50/90 opacity-75'
      }`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {source.logo_url ? (
                <img 
                  src={source.logo_url} 
                  alt={source.name}
                  className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                  {source.name}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${credibilityColors[source.credibility_level]} border text-xs`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {credibilityLabels[source.credibility_level]}
                  </Badge>
                  <Badge className={`${Method.color} text-xs border`}>
                    <Method.icon className="w-3 h-3 mr-1" />
                    {Method.label}
                  </Badge>
                  <Badge variant={source.is_active ? "default" : "secondary"} className="text-xs">
                    {source.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {source.description && (
            <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
              {source.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {source.website && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-blue-600 hover:text-blue-800 px-2"
                >
                  <a
                    href={source.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-xs">Site</span>
                  </a>
                </Button>
              )}
              
              {source.is_active && onScrapeSource && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleScrapeClick}
                  className="text-green-600 hover:text-green-800 px-2"
                  disabled={isScraping}
                >
                  {isScraping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="text-xs ml-1">{isScraping ? "Buscando..." : "Buscar"}</span>
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <div className="w-4 h-4 flex flex-col justify-center items-center gap-0.5">
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(source)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(source)}>
                  {source.is_active ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(source.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}