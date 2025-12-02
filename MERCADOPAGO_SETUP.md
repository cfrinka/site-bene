# Configuração do Mercado Pago

## 1. Criar Conta no Mercado Pago

1. Acesse [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Crie uma conta ou faça login
3. Vá para "Suas integrações" > "Criar aplicação"

## 2. Obter Credenciais

### Ambiente de Teste (Sandbox)
1. No painel do desenvolvedor, vá em "Credenciais"
2. Copie o **Access Token de Teste**
3. Use este token durante o desenvolvimento

### Ambiente de Produção
1. Complete o processo de verificação da conta
2. No painel, vá em "Credenciais" > "Credenciais de produção"
3. Copie o **Access Token de Produção**

## 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Importante:** 
- Em desenvolvimento, use o Access Token de Teste
- Em produção, use o Access Token de Produção
- Nunca commite o arquivo `.env.local` no git

## 4. Configurar Webhooks (Notificações)

1. No painel do Mercado Pago, vá em "Webhooks"
2. Adicione a URL de notificação:
   - Desenvolvimento: `https://seu-dominio-ngrok.ngrok.io/api/mercadopago/webhook`
   - Produção: `https://seu-dominio.com/api/mercadopago/webhook`
3. Selecione os eventos: "Pagamentos"

### Para Desenvolvimento Local (usando ngrok)

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 3000

# Use a URL gerada no webhook do Mercado Pago
```

## 5. Testar Integração

### Cartões de Teste

Use estes cartões para testar diferentes cenários:

**Aprovado:**
- Número: 5031 4332 1540 6351
- CVV: 123
- Validade: 11/25

**Recusado:**
- Número: 5031 4332 1540 6351
- CVV: 123
- Validade: 11/25
- Nome: APRO (aprovado) / OTHE (recusado)

**Pendente:**
- Número: 5031 4332 1540 6351
- CVV: 123
- Validade: 11/25
- Nome: CONT

[Mais cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards)

## 6. Fluxo de Pagamento

1. **Usuário finaliza compra** → Clica em "Finalizar compra"
2. **API cria preferência** → `/api/mercadopago/create-preference`
3. **Redirecionamento** → Usuário vai para checkout do Mercado Pago
4. **Pagamento** → Usuário completa o pagamento
5. **Retorno** → Usuário volta para:
   - `/checkout/success` (aprovado)
   - `/checkout/failure` (recusado)
   - `/checkout/pending` (pendente)
6. **Webhook** → Mercado Pago notifica `/api/mercadopago/webhook`
7. **Pedido criado** → Sistema cria pedido no Firebase

## 7. Segurança

- ✅ Access Token mantido no servidor (não exposto ao cliente)
- ✅ Validação de webhooks (recomendado implementar assinatura)
- ✅ HTTPS obrigatório em produção
- ✅ Validação de dados antes de criar preferência

## 8. Monitoramento

Acesse o painel do Mercado Pago para:
- Ver transações em tempo real
- Analisar taxas de conversão
- Gerenciar estornos
- Ver relatórios financeiros

## 9. Taxas

- **Cartão de crédito:** ~4,99% + R$ 0,39 por transação
- **Pix:** ~0,99% por transação
- **Boleto:** ~R$ 3,49 por transação

[Consultar taxas atualizadas](https://www.mercadopago.com.br/costs-section/release-1.0)

## 10. Suporte

- Documentação: [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
- Suporte: [https://www.mercadopago.com.br/developers/pt/support](https://www.mercadopago.com.br/developers/pt/support)
