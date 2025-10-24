import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Edit, Trash2, Eye, EyeOff, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryColors = {
  contabil: "bg-blue-100 text-blue-800",
  fiscal: "bg-green-100 text-green-800",
  folha_pagamento: "bg-purple-100 text-purple-800",
  tributaria: "bg-orange-100 text-orange-800",
  reforma_tributaria: "bg-red-100 text-red-800",
  geral: "bg-gray-100 text-gray-800",
  ifrs: "bg-indigo-100 text-indigo-800",
  usgaap: "bg-cyan-100 text-cyan-800"
};

const categoryLabels = {
  contabil: "Contabil",
  fiscal: "Fiscal",
  folha_pagamento: "Folha de Pagamento",
  tributaria: "Tributaria",
  reforma_tributaria: "Reforma Tributaria",
  geral: "Geral",
  ifrs: "IFRS",
  usgaap: "US GAAP"
};

const importanceLabels = {
  baixa: "Baixa",
  media: "Media",
  alta: "Alta"
};

export default function WhatsAppConfigCard({ config, onEdit, onDelete, onToggleActive }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
        config.is_active ? 'border-green-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-75'
      }`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                  {config.channel_name || config.recipient_number}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${categoryColors[config.category]} border text-xs`}>
                    {categoryLabels[config.category]}
                  </Badge>
                  <Badge variant={config.is_active ? "default" : "secondary"} className="text-xs">
                    {config.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                  {config.send_automatically && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Automatico
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Numero:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {config.recipient_number}
              </code>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Importancia Minima:</span>
              <Badge variant="outline" className="text-xs">
                {importanceLabels[config.min_importance]}
              </Badge>
            </div>

            {config.send_automatically && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle className="w-4 h-4" />
                <span>Envio automatico ativado</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
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
                <DropdownMenuItem onClick={() => onEdit(config)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(config)}>
                  {config.is_active ? (
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
                  onClick={() => onDelete(config.id)}
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