"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { updateDocument, uploadFile } from "@/lib/firebase";
import { compressImage } from "@/lib/imageCompression";
import { useToast } from "@/components/ui/Toast";

const AVAILABLE_SIZES = ["P", "M", "G", "GG", "G1"];
const AVAILABLE_COLORS = [
  { name: "Preto", value: "#000000" },
  { name: "Branco", value: "#FFFFFF" },
  { name: "Cinza", value: "#808080" },
  { name: "Azul", value: "#0000FF" },
  { name: "Vermelho", value: "#FF0000" },
  { name: "Verde", value: "#008000" },
  { name: "Amarelo", value: "#FFFF00" },
];

type Product = {
  id: string;
  title?: string;
  price?: number;
  cover?: string;
  sizes?: string[];
  colors?: string[];
  colorImages?: Record<string, string>;
};

type EditProductModalProps = {
  product: Product;
  onClose: () => void;
  onSave: () => void;
};

export default function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
  const [title, setTitle] = useState(product.title || '');
  const [price, setPrice] = useState(String(product.price || ''));
  const [cover, setCover] = useState(product.cover || '');
  const [sizes, setSizes] = useState<string[]>(product.sizes || []);
  const [colors, setColors] = useState<string[]>(product.colors || []);
  const [colorImages, setColorImages] = useState<Record<string, string>>(product.colorImages || {});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { show } = useToast();

  const toggleSize = (size: string) => {
    setSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (colorName: string) => {
    setColors(prev =>
      prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]
    );
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) {
      inputEl.value = '';
      return;
    }

    try {
      setUploading(true);
      // Compress image to max 1MB
      const compressedFile = await compressImage(file, 1, 1920);
      const up = await uploadFile(`products/${Date.now()}-${file.name}`, compressedFile);
      if ((up as any).ok) {
        setCover((up as any).url);
        show({ variant: 'success', title: 'Imagem de capa enviada' });
      } else {
        show({ variant: 'error', title: 'Falha ao enviar' });
      }
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = '';
    }
  };

  const handleColorImageUpload = async (colorName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) {
      inputEl.value = '';
      return;
    }

    try {
      setUploading(true);
      // Compress image to max 1MB
      const compressedFile = await compressImage(file, 1, 1920);
      const up = await uploadFile(`products/${Date.now()}-${colorName}-${file.name}`, compressedFile);
      if ((up as any).ok) {
        setColorImages(prev => ({ ...prev, [colorName]: (up as any).url }));
        show({ variant: 'success', title: `Imagem da cor ${colorName} enviada` });
      } else {
        show({ variant: 'error', title: 'Falha ao enviar' });
      }
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      show({ variant: 'warning', title: 'Título é obrigatório' });
      return;
    }
    if (sizes.length === 0) {
      show({ variant: 'warning', title: 'Selecione pelo menos um tamanho' });
      return;
    }
    if (colors.length === 0) {
      show({ variant: 'warning', title: 'Selecione pelo menos uma cor' });
      return;
    }

    const priceValue = parseFloat(price.replace(',', '.')) || 0;

    setSaving(true);
    try {
      await updateDocument('products', product.id, {
        title,
        price: priceValue,
        cover,
        sizes,
        colors,
        colorImages,
      });
      show({ variant: 'success', title: 'Produto atualizado' });
      onSave();
      onClose();
    } catch (error) {
      show({ variant: 'error', title: 'Erro ao atualizar produto' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-display font-semibold mb-4">
          Editar Produto
        </h2>

        {/* Basic Info */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Título *
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Título do produto"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Preço *
          </label>
          <input
            type="text"
            inputMode="decimal"
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Imagem de Capa
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 mb-2"
            placeholder="URL da imagem"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 cursor-pointer hover:bg-neutral-50">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              disabled={uploading}
            />
            {uploading ? 'Enviando...' : 'Enviar nova imagem'}
          </label>
          {cover && (
            <p className="text-xs text-neutral-600 mt-2 truncate">
              {cover}
            </p>
          )}
        </div>

        {/* Sizes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tamanhos disponíveis *
          </label>
          <div className="flex gap-2 flex-wrap">
            {AVAILABLE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-4 py-2 rounded-md border transition-colors font-medium ${sizes.includes(size)
                  ? "border-[#2A5473] bg-[#2A5473] text-white"
                  : "border-neutral-300 hover:border-neutral-400 bg-white"
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
          {sizes.length > 0 && (
            <p className="text-xs text-neutral-600 mt-2">
              Selecionados: {sizes.join(", ")}
            </p>
          )}
        </div>

        {/* Colors */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Cores disponíveis *
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {AVAILABLE_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleColor(color.name)}
                className={`flex flex-col items-center gap-1 p-2 rounded-md border transition-colors bg-white ${colors.includes(color.name)
                  ? "border-[#2A5473] ring-2 ring-[#2A5473]/20"
                  : "border-neutral-200 hover:border-neutral-300"
                  }`}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-neutral-300"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-xs text-neutral-800">{color.name}</span>
              </button>
            ))}
          </div>
          {colors.length > 0 && (
            <p className="text-xs text-neutral-600 mt-2">
              Selecionadas: {colors.join(", ")}
            </p>
          )}
        </div>

        {/* Color-specific images */}
        {colors.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Imagens por cor (opcional)
            </label>
            <p className="text-xs text-neutral-500 mb-3">
              Envie uma imagem para cada cor. Se não enviar, será usada a imagem de capa do produto.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {colors.map((colorName) => {
                const colorDef = AVAILABLE_COLORS.find(c => c.name === colorName);
                return (
                  <div key={colorName} className="border border-neutral-200 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-neutral-300"
                        style={{ backgroundColor: colorDef?.value }}
                      />
                      <span className="text-sm font-medium">{colorName}</span>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 cursor-pointer hover:bg-neutral-50 text-sm">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleColorImageUpload(colorName, e)}
                        disabled={uploading}
                      />
                      {colorImages[colorName] ? '✓ Enviada' : 'Enviar imagem'}
                    </label>
                    {colorImages[colorName] && (
                      <p className="text-xs text-neutral-500 mt-1 truncate">
                        {colorImages[colorName].split('/').pop()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !title.trim() || sizes.length === 0 || colors.length === 0}
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
