# Relatório de Investigação — Possível Exposição de Credenciais no Frontend

**Sistema:** `sistemas.administradoramutual.com.br`
**Data:** 21 de agosto de 2026
**Commit de saneamento:** `83cd51c`
**Deployment de correção:** `READY` em Production, gerado a partir do commit `0bb147a`

## Sumário executivo

A hipótese de que o site esteja publicando o usuário, a senha ou o segredo de sessão no HTML/JavaScript público **não foi confirmada**. Em uma sessão limpa, o DOM não continha nomes de variáveis de produção, senha legada ou e-mail administrativo; os campos de e-mail e senha iniciaram vazios; `localStorage` e `sessionStorage` estavam vazios; e os únicos scripts carregados foram os clientes de autenticação esperados.

O que aparece no painel de inspeção depois que o próprio usuário digita a senha pode ser apenas o valor corrente do controle `<input type="password">` ou o payload da requisição HTTPS. O usuário que controla o próprio navegador sempre consegue inspecionar seus próprios valores digitados e suas próprias requisições. Isso não equivale a uma senha hardcoded, nem pode ser impedido pelo frontend sem impedir o funcionamento do login.

## Evidências públicas

O baseline público encontrou `GET /auth.js`, `GET /login.js` e `GET /portal.js` com HTTP 200. Sourcemaps correspondentes retornaram HTTP 404. `GET /api/auth/me` sem sessão retornou HTTP 401. Requisições GET para os endpoints de login e logout foram rejeitadas com HTTP 405. A análise dos corpos públicos não encontrou o hash de senha, o segredo de sessão ou a senha temporária.

A inspeção booleana em sessão limpa produziu os seguintes resultados:

| Verificação | Resultado |
|---|---:|
| Nomes de variáveis de produção no HTML | Não encontrado |
| Senha legada no HTML | Não encontrada |
| E-mail administrativo no texto da página | Não encontrado |
| Valor inicial do campo de senha | Vazio |
| `localStorage` | Vazio |
| `sessionStorage` | Vazio |
| Sourcemaps públicos dos clientes de autenticação | Não encontrados |

## Achados reais corrigidos

Foi encontrado um arquivo local `.production-secrets` com valores de produção em texto claro. Ele não estava rastreado pelo Git, mas representava risco operacional caso fosse compartilhado, anexado ou copiado para outro diretório. O arquivo foi removido e o `.gitignore` foi criado/atualizado para bloquear sua inclusão futura.

Também havia no `README_AUTH.md` uma documentação histórica com usuários master e uma senha legada. Essa informação não era carregada pelo navegador em produção, mas constituía exposição desnecessária no repositório. O README foi substituído por documentação que descreve somente a arquitetura server-side e os nomes das variáveis, sem valores ou usuários sensíveis.

## Correções aplicadas

O código server-side permanece responsável pela validação scrypt, comparação resistente a timing, emissão de cookie `HttpOnly`, `Secure` e `SameSite=Strict`, rate limiting local e respostas genéricas. O frontend envia o valor digitado exclusivamente ao endpoint de login e não grava senha, hash ou segredo em storage.

Foram adicionados testes automatizados para login válido, falha genérica, sessão válida, logout e configuração ausente. A suíte passou com cinco testes, e as verificações de sintaxe dos arquivos JavaScript também passaram.

A correção foi versionada no GitHub e a Vercel gerou um deployment `READY` a partir do commit de saneamento. Um novo baseline pós-correção manteve os mesmos resultados: nenhum segredo administrativo foi identificado nos artefatos públicos.

## Limitação importante

Não é possível esconder do proprietário do navegador o valor que ele mesmo digitou em um formulário ou o corpo da própria requisição que ele inspeciona. O controle correto é garantir que o valor não esteja presente no HTML inicial, em bundles, sourcemaps, storage, logs, query strings ou respostas do servidor. Esses controles foram verificados.

## Recomendações

A senha temporária usada nos testes deve ser rotacionada, pois foi compartilhada durante a operação e não deve ser tratada como credencial permanente. A rotação deve gerar novo hash scrypt e novo segredo de sessão, invalidando sessões existentes. A documentação central em `docs.administradoramutual.com.br` deve receber a referência desta arquitetura sem incluir valores secretos.

Se o usuário observou uma credencial em um local diferente — por exemplo, em `view-source`, no conteúdo de um bundle, em uma resposta JSON ou em uma URL de preview — o caminho exato e uma captura com os valores ocultados devem ser registrados, pois isso permitiria separar o valor digitado localmente de um artefato público real.
