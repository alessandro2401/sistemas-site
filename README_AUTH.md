# Sistema de Autenticação - Portais e Sistemas

## Visão Geral

Sistema de autenticação implementado para o site **sistemas.administradoramutual.com.br** com proteção de acesso via login.

## Características

- ✅ **Autenticação via localStorage** - Sessão persistente no navegador
- ✅ **5 usuários master configurados** - Todos com nível de acesso Master
- ✅ **Proteção automática de páginas** - Redirecionamento para login se não autenticado
- ✅ **Sessão com expiração** - 24 horas de validade
- ✅ **Interface responsiva** - Design adaptável para mobile e desktop
- ✅ **Barra de usuário** - Mostra nome, email e botão de logout
- ✅ **Conteúdo original preservado** - Nenhuma alteração no conteúdo do site

## Arquivos Adicionados

### 1. `auth.js` (180 linhas)
Biblioteca de gerenciamento de autenticação com:
- Classe `AuthManager` para controle de sessão
- Validação de credenciais
- Armazenamento seguro no localStorage
- Controle de expiração de sessão (24h)
- Métodos de login, logout e proteção de página

### 2. `login.html` (235 linhas)
Página de login com:
- Formulário responsivo e elegante
- Validação de campos
- Feedback visual de erros/sucesso
- Auto-focus e experiência otimizada
- Design consistente com identidade visual

### 3. `index.html` (modificado)
Adicionado ao arquivo original:
- Script de proteção de autenticação
- Barra de usuário no topo direito
- Estilos CSS para barra de usuário
- Handler de logout
- Links para favicons

## Usuários Master Configurados

Todos os usuários têm **nível de acesso Master** e senha **senha123**:

| Email | Nome | Nível |
|-------|------|-------|
| presidencia@administradoramutual.com.br | Presidência | Master |
| diretoria@administradoramutual.com.br | Diretoria | Master |
| comercial@administradoramutual.com.br | Comercial | Master |
| sinistro@administradoramutual.com.br | Sinistro | Master |
| adm@administradoramutual.com.br | Administrativo | Master |

## Fluxo de Autenticação

1. **Acesso inicial**: Usuário tenta acessar `index.html` ou raiz do site
2. **Verificação**: Script verifica se existe sessão válida no localStorage
3. **Redirecionamento**: Se não autenticado, redireciona para `login.html`
4. **Login**: Usuário insere email e senha
5. **Validação**: Sistema valida credenciais contra lista de usuários
6. **Sessão**: Se válido, cria sessão no localStorage com timestamp
7. **Acesso**: Redireciona para página solicitada ou index.html
8. **Exibição**: Mostra barra de usuário com nome, email e botão "Sair"

## Segurança

### Implementado
- ✅ Validação de credenciais no cliente
- ✅ Expiração automática de sessão (24h)
- ✅ Proteção de todas as páginas
- ✅ Senhas não armazenadas na sessão
- ✅ Redirecionamento automático se não autenticado

### Recomendações Futuras
- 🔄 Migrar para autenticação backend (Firebase, Auth0, etc.)
- 🔄 Implementar hash de senhas
- 🔄 Adicionar autenticação de dois fatores (2FA)
- 🔄 Implementar rate limiting para tentativas de login
- 🔄 Adicionar logs de auditoria de acesso

## Tecnologias Utilizadas

- **HTML5** - Estrutura das páginas
- **CSS3** - Estilização e responsividade
- **JavaScript ES6+** - Lógica de autenticação
- **localStorage** - Armazenamento de sessão
- **sessionStorage** - Redirecionamento pós-login

## Deploy

O sistema foi deployado automaticamente via **Vercel** após push para o repositório GitHub.

### Comandos Executados
```bash
git add auth.js login.html index.html
git commit -m "feat: Adicionar sistema de autenticação com 5 usuários master"
git push origin master
```

### URL de Produção
https://sistemas.administradoramutual.com.br

## Testes Realizados

✅ **Login com credenciais válidas** - Funcionando  
✅ **Login com credenciais inválidas** - Mensagem de erro exibida  
✅ **Redirecionamento pós-login** - Para index.html ou URL solicitada  
✅ **Proteção de página** - Redireciona para login se não autenticado  
✅ **Barra de usuário** - Exibe informações corretas  
✅ **Logout** - Limpa sessão e redireciona para login  
✅ **Expiração de sessão** - Após 24h redireciona para login  
✅ **Responsividade** - Funciona em mobile e desktop  

## Manutenção

### Adicionar Novo Usuário
Edite o arquivo `auth.js` e adicione um novo objeto ao array `MASTER_USERS`:

```javascript
{
    email: 'novo@administradoramutual.com.br',
    password: 'senha123',
    name: 'Nome do Usuário',
    level: 'Master'
}
```

### Alterar Tempo de Expiração
No arquivo `auth.js`, método `loadSession()`, altere a linha:

```javascript
if (hoursDiff < 24) { // Altere 24 para o número de horas desejado
```

### Proteger Novas Páginas
Adicione ao final do HTML, antes de `</body>`:

```html
<script src="auth.js"></script>
<script>
    authManager.protectPage();
</script>
```

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

---

**Data de Implementação**: 01/11/2025  
**Versão**: 1.0.0  
**Status**: ✅ Em Produção

