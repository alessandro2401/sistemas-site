# Investigação de possível exposição de credenciais — 2026-08-21

## Evidências confirmadas

O baseline público de `sistemas.administradoramutual.com.br` encontrou `auth.js`, `login.js` e `portal.js` com status HTTP 200, sourcemaps 404 e os endpoints de autenticação respondendo conforme esperado para requisições sem sessão: `me` retorna 401 e `login`/`logout` rejeitam método GET com 405. A análise mascarada dos bundles não encontrou nomes de variáveis de produção, hashes completos, segredos de sessão ou credenciais administrativas publicadas.

O `auth.js` publicado consulta apenas `/api/auth/me`, `/api/auth/login` e `/api/auth/logout`; o `login.js` lê o valor digitado no campo de senha para enviá-lo por POST ao backend. O `login.html` não possui atributos `value` com usuário ou senha. Assim, o valor que aparece no painel Elements enquanto o usuário está digitando pode ser apenas o valor corrente do próprio controle de formulário; isso não prova que o segredo esteja hardcoded no site.

## Achados de segurança

Foi encontrado no workspace local um arquivo `.production-secrets` contendo valores de produção em texto claro. Esse arquivo não deve ser versionado, anexado, publicado ou mantido após a configuração da Vercel. Também foi encontrada no `README_AUTH.md` uma documentação histórica com lista de usuários master e uma senha legada. Mesmo que não seja carregada pelo navegador, essa informação é uma exposição de segredo e deve ser removida do repositório e substituída por documentação segura.

## Próximas verificações

A próxima etapa deve comparar os valores locais mascarados com todos os artefatos públicos, confirmar que nenhum segredo coincide, limpar o arquivo local, atualizar o README, verificar histórico Git e repetir o baseline após novo deployment. A senha temporária e o segredo de sessão deverão ser rotacionados caso qualquer valor real apareça em um artefato público, preview ou histórico acessível.

## Verificação no navegador em sessão limpa

Em 2026-08-21, a sessão limpa do login apresentou formulário vazio, sem valor de e-mail ou senha. A inspeção booleana do DOM retornou `html_has_auth_admin=false`, `html_has_legacy_password=false`, `body_has_email_pattern=false`, `local_storage_keys=[]`, `session_storage_keys=[]` e `password_input_value_length=0`. Os únicos scripts carregados foram `/auth.js` e `/login.js`.

Essa evidência não confirma exposição de credenciais no frontend publicado. Se o painel de inspeção mostrar usuário e senha depois que alguém os digita, o navegador naturalmente expõe o valor atual dos controles de formulário ao próprio usuário autorizado a inspecionar a página; isso é diferente de uma credencial hardcoded. A investigação continua necessária para remover o arquivo local de segredos e a documentação histórica insegura, além de confirmar previews e histórico Git.
