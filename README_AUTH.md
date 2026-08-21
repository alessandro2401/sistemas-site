# Autenticação do Portal de Sistemas

## Visão geral

O portal `sistemas.administradoramutual.com.br` utiliza autenticação server-side. O navegador apresenta o formulário e chama os endpoints internos de autenticação; a validação de credenciais ocorre exclusivamente no runtime serverless da Vercel.

Nenhuma senha, hash de senha, segredo de sessão ou lista de usuários deve ser incluída neste repositório, em HTML, JavaScript público, sourcemaps, documentação ou mensagens de erro. Os valores administrativos são configurados somente como variáveis sensíveis no ambiente **Production** da Vercel.

## Fluxo atual

Quando uma página protegida é aberta, `auth.js` chama `GET /api/auth/me` com `credentials: include`. Sem uma sessão válida, o usuário é encaminhado para `login.html`. O controlador `login.js` envia o e-mail e a senha digitados via `POST /api/auth/login` usando HTTPS e não grava esses valores em `localStorage` ou `sessionStorage`. Em caso de sucesso, o backend emite um cookie de sessão protegido e retorna somente o perfil mínimo necessário à interface.

O logout chama `POST /api/auth/logout`, remove a sessão no cliente por meio do cookie expirado e limpa o estado de usuário mantido em memória. A API responde com mensagens genéricas em falhas de autenticação para não revelar se um e-mail está cadastrado.

## Componentes

| Componente | Responsabilidade |
|---|---|
| `api/_auth.cjs` | Lê configuração server-side, deriva e compara hashes scrypt, aplica rate limiting local e assina/verifica sessões. |
| `api/auth/login.js` | Recebe credenciais, valida o usuário no backend e emite cookie `HttpOnly`. |
| `api/auth/me.js` | Retorna apenas o estado autenticado e o perfil mínimo da sessão. |
| `api/auth/logout.js` | Expira a sessão e retorna resposta sem dados sensíveis. |
| `auth.js` | Cliente mínimo para chamar a API e proteger páginas. Não contém credenciais. |
| `login.js` | Controla o formulário sem persistir senha ou hash no navegador. |
| `portal.js` | Valida a sessão antes de mostrar o conteúdo protegido e executa logout. |
| `vercel.json` | Define funções serverless, rewrites, headers e políticas de cache. |

## Variáveis de ambiente

As seguintes variáveis existem apenas no ambiente sensível da Vercel. Os valores não devem ser impressos em logs, commits, tickets, relatórios ou arquivos locais persistentes:

| Variável | Uso |
|---|---|
| `AUTH_ADMIN_EMAIL` | Identidade administrativa normalizada no backend. |
| `AUTH_ADMIN_PASSWORD_HASH` | Hash scrypt da senha administrativa. Nunca é enviado ao cliente. |
| `AUTH_SESSION_SECRET` | Segredo usado para assinar e validar sessões. Deve ser rotacionado em caso de suspeita de exposição. |

Para configurar ou rotacionar valores, utilize o painel de variáveis sensíveis do projeto Vercel e faça um redeploy de Production. Não crie arquivos `.env` ou `.production-secrets` dentro do repositório ou em diretórios compartilhados.

## Controles de segurança

A sessão usa cookie `HttpOnly`, `Secure` e `SameSite=Strict`, com expiração definida. As respostas de login não retornam senha, hash, segredo ou token legível pelo JavaScript. As páginas protegidas não devem exibir dados até que `GET /api/auth/me` confirme a sessão.

A política de segurança do portal impede execução de scripts inline não autorizados, bloqueia framing externo, evita sniffing de conteúdo e desativa cache de respostas de autenticação. Os endpoints rejeitam métodos não utilizados e devem manter respostas sem dados sensíveis.

## Testes obrigatórios

Antes de cada publicação, execute a suíte de autenticação e confirme os seguintes cenários: login válido; senha inválida; e-mail inválido; configuração ausente; sessão válida; sessão ausente; logout; cookie com atributos de segurança; acesso direto a página protegida; ausência de credenciais em HTML, bundles, sourcemaps, `localStorage`, `sessionStorage`, query strings e logs.

A inspeção do valor corrente de um campo de senha no painel do navegador, depois que o próprio usuário o digitou, não significa que a senha esteja hardcoded no site. O critério de segurança é que o valor não exista no HTML inicial, no bundle público, no storage, nos logs ou nas respostas da API, e que seja enviado somente ao endpoint server-side por HTTPS.

## Incidentes e rotação

Se um segredo aparecer em qualquer artefato público, histórico Git, preview, log ou captura de tela, trate-o como comprometido. Revogue a senha administrativa, gere novo hash scrypt, altere `AUTH_SESSION_SECRET`, faça redeploy e repita a inspeção em sessão limpa. O incidente deve ser documentado sem incluir o valor comprometido.

## Operação e documentação

Alterações de autenticação devem ser versionadas no GitHub, revisadas antes do merge e registradas na documentação central em `docs.administradoramutual.com.br`. A documentação central deve explicar a arquitetura, os endpoints, os controles, o procedimento de rotação e os testes de validação, sem armazenar credenciais.
