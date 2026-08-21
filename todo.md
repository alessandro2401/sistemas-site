# TODO — Migração de Autenticação do Portal de Sistemas

- [x] Inventariar o repositório e confirmar a implementação client-side existente
- [x] Remover credenciais e sessões armazenadas no navegador
- [x] Implementar API serverless de login, sessão e logout
- [x] Atualizar login.html para usar o backend
- [x] Atualizar páginas protegidas para validar sessão HttpOnly
- [x] Configurar rewrites e headers da Vercel
- [x] Adicionar testes automatizados para login, sessão, logout e falhas
- [x] Executar build e validação local
- [x] Criar preview e validar em sessão limpa
- [x] Configurar variáveis de produção sem expor valores
- [x] Publicar a migração após validação
- [ ] Atualizar a documentação em docs.administradoramutual.com.br
- [x] Investigar e eliminar qualquer credencial, hash, token ou segredo visível no painel de inspeção do navegador
