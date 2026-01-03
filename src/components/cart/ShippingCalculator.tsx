"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Typography";

type ShippingOption = {
  name: string;
  price: number;
  days: number;
};

type ShippingCalculatorProps = {
  onShippingSelect: (option: ShippingOption | null) => void;
  cartTotal: number;
  onCepCalculated?: (cep: string, addressData: any) => void;
};

export default function ShippingCalculator({ onShippingSelect, cartTotal, onCepCalculated }: ShippingCalculatorProps) {
  const FREE_SHIPPING_THRESHOLD = 150;
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    if (formatted.length < 9) {
      setOptions([]);
      setSelectedOption(null);
      onShippingSelect(null);
    }
  };

  // Auto-trigger calculation when CEP is complete
  useEffect(() => {
    if (cep.replace(/\D/g, "").length === 8) {
      const timer = setTimeout(() => {
        calculateShipping();
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }
  }, [cep]);

  const calculateShipping = async () => {
    if (cep.replace(/\D/g, "").length !== 8) {
      setError("CEP inválido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // CEP de origem (onde está localizado o estoque/loja)
      // TODO: Configurar via variável de ambiente ou admin
      const originCep = "14680-057"; // Paraguaçu Paulista - SP

      // Validar CEP de destino usando ViaCEP
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
      const data = await response.json();

      if (data.erro) {
        setError("CEP não encontrado");
        setOptions([]);
        return;
      }

      // Callback para preencher o endereço no formulário
      if (onCepCalculated) {
        onCepCalculated(cep, data);
      }

      // Verificar se o CEP é o de origem (frete grátis para retirada local)
      const isLocalPickup = cep.replace(/\D/g, "") === "14680057";

      // Verificar se o carrinho qualifica para frete grátis
      const hasFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD || isLocalPickup;

      // Simular cálculo de frete baseado na região
      // Em produção, você pode usar APIs como:
      // - Correios (https://www.correios.com.br/atendimento/developers)
      // - Melhor Envio (https://melhorenvio.com.br/docs/api)
      // - Kangu (https://www.kangu.com.br/api)
      const state = data.uf;
      const shippingOptions = calculateShippingOptions(state, originCep, hasFreeShipping, isLocalPickup);
      setOptions(shippingOptions);

      // Selecionar automaticamente a opção mais barata
      if (shippingOptions.length > 0) {
        const cheapest = shippingOptions[0];
        setSelectedOption(cheapest);
        onShippingSelect(cheapest);
      }
    } catch (err) {
      setError("Erro ao calcular frete. Tente novamente.");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateShippingOptions = (state: string, originCep: string, hasFreeShipping: boolean, isLocalPickup: boolean = false): ShippingOption[] => {
    // Se qualifica para frete grátis, retornar opção gratuita
    if (hasFreeShipping) {
      return [
        {
          name: isLocalPickup ? "Retirada Local - Grátis" : "Frete Grátis",
          price: 0,
          days: isLocalPickup ? 0 : 5,
        },
      ];
    }
    // Regiões e seus custos base
    const sudeste = ["SP", "RJ", "MG", "ES"];
    const sul = ["PR", "SC", "RS"];
    const centroOeste = ["GO", "MT", "MS", "DF"];
    const nordeste = ["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"];
    const norte = ["AM", "RR", "AP", "PA", "TO", "RO", "AC"];

    let basePricePAC = 15;
    let basePriceSEDEX = 25;
    let baseDaysPAC = 5;
    let baseDaysSEDEX = 2;

    if (sudeste.includes(state)) {
      // Região próxima - frete mais barato e rápido
      basePricePAC = 12;
      basePriceSEDEX = 20;
      baseDaysPAC = 3;
      baseDaysSEDEX = 1;
    } else if (sul.includes(state)) {
      basePricePAC = 15;
      basePriceSEDEX = 25;
      baseDaysPAC = 5;
      baseDaysSEDEX = 2;
    } else if (centroOeste.includes(state)) {
      basePricePAC = 18;
      basePriceSEDEX = 28;
      baseDaysPAC = 6;
      baseDaysSEDEX = 3;
    } else if (nordeste.includes(state)) {
      basePricePAC = 22;
      basePriceSEDEX = 35;
      baseDaysPAC = 8;
      baseDaysSEDEX = 4;
    } else if (norte.includes(state)) {
      basePricePAC = 28;
      basePriceSEDEX = 45;
      baseDaysPAC = 12;
      baseDaysSEDEX = 6;
    }

    return [
      {
        name: "PAC",
        price: basePricePAC,
        days: baseDaysPAC,
      },
      {
        name: "SEDEX",
        price: basePriceSEDEX,
        days: baseDaysSEDEX,
      },
    ];
  };

  const handleSelectOption = (option: ShippingOption) => {
    setSelectedOption(option);
    onShippingSelect(option);
  };

  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - cartTotal;
  const qualifiesForFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="space-y-3">
      {!qualifiesForFreeShipping && remainingForFreeShipping > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <Text className="text-sm text-blue-800">
            Faltam <span className="font-semibold">R$ {remainingForFreeShipping.toFixed(2)}</span> para frete grátis!
          </Text>
        </div>
      )}

      {qualifiesForFreeShipping && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <Text className="text-sm text-green-800 font-semibold">
            🎉 Você ganhou frete grátis!
          </Text>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Calcular frete e prazo
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={cep}
            onChange={handleCepChange}
            placeholder="00000-000"
            maxLength={9}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={calculateShipping}
            disabled={loading || cep.replace(/\D/g, "").length !== 8}
          >
            {loading ? "..." : "Calcular"}
          </Button>
        </div>
      </div>

      {error && (
        <Text className="text-sm text-red-600">{error}</Text>
      )}

      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.name}
              onClick={() => handleSelectOption(option)}
              className={`w-full text-left p-3 rounded-md border transition-colors ${selectedOption?.name === option.name
                ? "border-brand-primary bg-brand-primary/5"
                : "border-neutral-200 hover:border-neutral-300"
                }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{option.name}</div>
                  <Text className="text-xs">
                    {option.days === 0
                      ? "Disponível para retirada imediatamente"
                      : `Entrega em até ${option.days} ${option.days === 1 ? "dia útil" : "dias úteis"}`
                    }
                  </Text>
                </div>
                <div className="font-semibold">
                  {option.price === 0 ? (
                    <span className="text-green-600">Grátis</span>
                  ) : (
                    `R$ ${option.price.toFixed(2)}`
                  )}
                </div>
              </div>
            </button>
          ))}

          <div className="mt-3 pt-3 border-t border-neutral-200">
            <Text className="text-xs text-neutral-500 italic">
              * Prazo de produção: até 5 dias úteis. O prazo de entrega é contado após a produção.
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
