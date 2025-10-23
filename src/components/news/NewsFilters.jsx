
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, Calculator, FileText, CreditCard, Gavel, RefreshCw, AlertTriangle, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { value: "contabil", label: "Contábil", icon: Calculator, color: "bg-blue-100 text-blue-800" },
  { value: "fiscal", label: "Fiscal", icon: FileText, color: "bg-green-100 text-green-800" },
  { value: "folha_pagamento", label: "Folha de Pagamento", icon: CreditCard, color: "bg-purple-100 text-purple-800" },
  { value: "tributaria", label: "Tributária", icon: Gavel, color: "bg-orange-100 text-orange-800" },
  { value: "reforma_tributaria", label: "Reforma Tributária", icon: RefreshCw, color: "bg-red-100 text-red-800" },
  { value: "ifrs", label: "IFRS", icon: Calculator, color: "bg-indigo-100 text-indigo-800" },
  { value: "usgaap", label: "US GAAP", icon: Calculator, color: "bg-cyan-100 text-cyan-800" }
];

const importanceLevels = [
  { value: "alta", label: "Alta Importância", icon: AlertTriangle, color: "text-red-600" },
  { value: "media", label: "Importância Média", icon: Info, color: "text-yellow-600" },
  { value: "baixa", label: "Baixa Importância", icon: Info, color: "text-green-600" }
];

export default function NewsFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedImportance,
  setSelectedImportance,
  selectedTags,
  setSelectedTags,
  availableTags
}) {
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedImportance("");
    setSelectedTags([]);
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedImportance || selectedTags.length > 0;

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-lg border border-white p-6 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Busca */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar notícias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-100"
          />
        </div>

        {/* Categoria */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="border-gray-200 focus:border-blue-300">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Importância */}
        <Select value={selectedImportance} onValueChange={setSelectedImportance}>
          <SelectTrigger className="border-gray-200 focus:border-blue-300">
            <SelectValue placeholder="Todas as importâncias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Todas as importâncias</SelectItem>
            {importanceLevels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                <div className="flex items-center gap-2">
                  <level.icon className={`w-4 h-4 ${level.color}`} />
                  {level.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tags (se disponíveis) */}
        {availableTags.length > 0 && (
          <div>
            <Select onValueChange={handleTagToggle}>
              <SelectTrigger className="border-gray-200 focus:border-blue-300">
                <SelectValue placeholder="Adicionar tag" />
              </SelectTrigger>
              <SelectContent>
                {availableTags.map((tag) => (
                  <SelectItem
                    key={tag}
                    value={tag}
                    disabled={selectedTags.includes(tag)}
                  >
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tags selecionadas */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
