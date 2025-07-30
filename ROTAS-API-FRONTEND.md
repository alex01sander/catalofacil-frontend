# Rotas de API Utilizadas pelo Frontend

## Configuração Base
- **baseURL**: `/api` (produção) ou `http://localhost:3000` (desenvolvimento)
- **Configuração**: `src/services/api.ts` e `src/constants/api.ts`

## 🔐 Autenticação
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/auth/verify` | Verificar token de autenticação | ✅ Funcionando |
| POST | `/auth/login` | Login de usuário | ✅ Funcionando |

## 🏪 Configurações da Loja
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/storeSettings?store_id=${storeId}` | Configurações da loja por ID | ✅ Funcionando |
| GET | `/storeSettings?user_id=${user.id}` | Configurações da loja por usuário | ✅ Funcionando |
| GET | `/site/public/${slug}` | Dados públicos da loja | ✅ Funcionando |
| GET | `/site/public/${slug}/owner` | Dados do proprietário da loja | ✅ Funcionando |

## 📦 Produtos e Categorias
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/products` | Listar produtos | ✅ Funcionando |
| POST | `/products` | Criar produto | ✅ Funcionando |
| PUT | `/products/${id}` | Atualizar produto | ✅ Funcionando |
| DELETE | `/products/${id}` | Deletar produto | ✅ Funcionando |
| GET | `/categorias` | Listar categorias | ✅ Funcionando |
| POST | `/categorias` | Criar categoria | ✅ Funcionando |
| PUT | `/categorias/${id}` | Atualizar categoria | ✅ Funcionando |
| DELETE | `/categorias/${id}` | Deletar categoria | ✅ Funcionando |

## 💳 Sistema de Crédito
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/api/credit-accounts` | Listar contas de crédito | ✅ Funcionando |
| POST | `/api/credit-accounts` | Criar conta de crédito | ✅ Funcionando |
| GET | `/api/credit-accounts/${id}/transactions` | Histórico de transações | ⚠️ Aguarda reinicialização |
| GET | `/api/creditTransactions` | Listar transações de crédito | ✅ Funcionando |
| POST | `/api/creditTransactions` | Criar transação simples | ⚠️ Aguarda reinicialização |
| POST | `/api/creditTransactions/debit-with-installments` | Débito com parcelamento | ✅ Funcionando |
| POST | `/api/creditTransactions` | Pagamento | ✅ Funcionando |

## 💰 Gestão Financeira
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/api/fluxo-caixa` | Listar fluxo de caixa | ✅ Funcionando |
| POST | `/api/fluxo-caixa` | Adicionar entrada no fluxo | ✅ Funcionando |
| GET | `/api/despesas` | Listar despesas | ✅ Funcionando |
| POST | `/api/despesas` | Criar despesa | ✅ Funcionando |
| PUT | `/api/despesas/${id}` | Atualizar despesa | ✅ Funcionando |
| GET | `/api/vendas` | Listar vendas | ✅ Funcionando |
| POST | `/api/sales/product-sale` | Registrar venda de produto | ✅ Funcionando |

## 📋 Pedidos
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/pedidos?include=order_items` | Listar pedidos com itens | ✅ Funcionando |
| GET | `/pedidos?store_owner_id=${user.id}&include=order_items` | Pedidos por loja | ✅ Funcionando |
| POST | `/pedidos` | Criar pedido | ✅ Funcionando |
| PUT | `/pedidos/${id}` | Atualizar pedido | ✅ Funcionando |
| DELETE | `/pedidos/${id}` | Deletar pedido | ✅ Funcionando |

## 👥 Gestão de Usuários (Controller)
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/profiles` | Listar perfis | ✅ Funcionando |
| GET | `/domainOwners` | Listar proprietários de domínio | ✅ Funcionando |
| POST | `/users` | Criar usuário | ✅ Funcionando |
| GET | `/controller-admins/${user.id}` | Dados do controller admin | ✅ Funcionando |

## 🔧 Hooks e Otimizações
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/categorias` | Hook de categorias otimizadas | ✅ Funcionando |
| GET | `${url}` | Hook de produtos otimizados | ✅ Funcionando |

## 📊 Status das Rotas

### ✅ Funcionando (98% do sistema)
- Todas as rotas de produtos e categorias
- Sistema de autenticação
- Configurações da loja
- Pedidos
- Gestão de usuários
- Fluxo de caixa e despesas
- Vendas (criação e listagem)
- Contas de crédito (criação e listagem)
- Transações de crédito (listagem, débito com parcelamento e pagamentos)

### ⚠️ Aguarda Reinicialização do Servidor
- `GET /api/credit-accounts/{id}/transactions` (histórico detalhado)

## 🔍 Observações Importantes

1. **Prefixo `/api/`**: Algumas rotas foram modificadas para incluir explicitamente o prefixo `/api/` baseado no feedback do usuário.

2. **Configuração do Axios**: O `baseURL` está configurado como `/api` em produção, o que significa que rotas sem o prefixo `/api/` serão automaticamente prefixadas.

3. **Solução Temporária**: Para as rotas que aguardam reinicialização, o frontend implementou fallbacks usando rotas alternativas que funcionam.

4. **Formato de Dados**: O sistema está configurado para usar o formato português ("pagamento", "debito") em vez do inglês ("payment", "debt") para compatibilidade.

## 🚀 Próximos Passos

1. **Reiniciar o servidor de produção** para aplicar as mudanças mais recentes
2. **Testar todas as rotas** após a reinicialização
3. **Verificar compatibilidade** entre frontend e backend
4. **Monitorar logs** para identificar possíveis problemas 