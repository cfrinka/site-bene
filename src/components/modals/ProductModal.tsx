"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const ALL_COLORS = [
    { name: "Preto", value: "#000000" },
    { name: "Branco", value: "#FFFFFF" },
    { name: "Cinza", value: "#808080" },
    { name: "Azul", value: "#0000FF" },
    { name: "Vermelho", value: "#FF0000" },
    { name: "Verde", value: "#008000" },
    { name: "Amarelo", value: "#FFFF00" },
];

type Product = {
    id?: string;
    title?: string;
    price?: number;
    cover?: string;
    badge?: string;
    sizes?: string[];
    colors?: string[];
    colorImages?: Record<string, string>;
};

type ProductModalProps = {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
};

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [imageLoading, setImageLoading] = useState<boolean>(true);

    if (!isOpen) return null;

    const availableColors = product.colors
        ? ALL_COLORS.filter(c => product.colors!.includes(c.name))
        : [];

    const displayImage = selectedColor && product.colorImages?.[selectedColor]
        ? product.colorImages[selectedColor]
        : product.cover;

    // Reset loading state when image changes
    const handleColorChange = (color: string) => {
        // Only show loading if actually changing to a different color
        if (color !== selectedColor) {
            setImageLoading(true);
            setSelectedColor(color);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-4xl font-display font-bold">{product.title || "Produto"}</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 text-2xl w-8 h-8 flex items-center justify-center cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Image Section */}
                        <div className="relative">
                            <div className="relative aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden">
                                {displayImage ? (
                                    <>
                                        {/* Skeleton loader */}
                                        {imageLoading && (
                                            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]" />
                                        )}
                                        <Image
                                            src={displayImage}
                                            alt={product.title || "Produto"}
                                            fill
                                            className={`object-cover transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"
                                                }`}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                                            priority
                                            quality={85}
                                            onLoad={() => setImageLoading(false)}
                                            placeholder="blur"
                                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                                            unoptimized={displayImage?.includes('firebasestorage.googleapis.com')}
                                        />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                                        Sem imagem
                                    </div>
                                )}
                                {product.badge && (
                                    <div className="absolute left-4 top-4">
                                        <Badge className="bg-brand-accent text-white">{product.badge}</Badge>
                                    </div>
                                )}
                            </div>

                            {/* Color swatches for image preview */}
                            {availableColors.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-neutral-700 mb-2">Ver cor:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => handleColorChange("")}
                                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${selectedColor === ""
                                                ? "border-neutral-800 bg-neutral-800 text-white"
                                                : "border-neutral-300 hover:border-neutral-400"
                                                }`}
                                        >
                                            Padrão
                                        </button>
                                        {availableColors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => handleColorChange(color.name)}
                                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${selectedColor === color.name
                                                    ? "border-neutral-800 bg-neutral-50"
                                                    : "border-neutral-300 hover:border-neutral-400"
                                                    }`}
                                            >
                                                <div
                                                    className="w-4 h-4 rounded-full border border-neutral-300"
                                                    style={{ backgroundColor: color.value }}
                                                />
                                                {color.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="flex flex-col">
                            <div className="flex-1">
                                <div className="mb-6">
                                    <p className="text-3xl font-bold text-[#1f9d61]">
                                        R$ {(product.price ?? 0).toFixed(2)}
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-2xl font-medium text-neutral-700 mb-2">Descrição</h3>
                                    <p className="text-neutral-600">
                                        Produto de alta qualidade feito com algodão premium. Design unissex que combina
                                        conforto e estilo.
                                    </p>
                                </div>

                                {/* Sizes */}
                                {product.sizes && product.sizes.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-medium text-neutral-700 mb-2">
                                            Tamanhos disponíveis
                                        </h3>
                                        <div className="flex gap-2 flex-wrap">
                                            {product.sizes.map((size) => (
                                                <span
                                                    key={size}
                                                    className="px-3 py-1.5 bg-neutral-100 rounded-md text-sm font-medium"
                                                >
                                                    {size}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Colors */}
                                {availableColors.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-medium text-neutral-700 mb-2">
                                            Cores disponíveis
                                        </h3>
                                        <div className="flex gap-2 flex-wrap">
                                            {availableColors.map((color) => (
                                                <div
                                                    key={color.name}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-md"
                                                >
                                                    <div
                                                        className="w-4 h-4 rounded-full border border-neutral-300"
                                                        style={{ backgroundColor: color.value }}
                                                    />
                                                    <span className="text-sm">{color.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Add to Cart Button */}
                            <div className="mt-6 pt-6 border-t border-neutral-200">
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={() => {
                                        onAddToCart(product);
                                        onClose();
                                    }}
                                >
                                    Adicionar ao carrinho
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
