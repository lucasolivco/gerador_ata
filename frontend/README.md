# Ata Multissetorial - Sistema de Gerenciamento de Formulários Contábeis

Um sistema web completo para gerenciamento de atas multissetoriais e formulários de perfil de clientes para escritórios de contabilidade. Desenvolvido com React e integrado com uma API RESTful para armazenamento e processamento de dados.

## 📋 Funcionalidades Principais

- **Gerenciamento de Formulários**:
  - Criação, edição e exclusão de formulários
  - Listagem com paginação e busca
  - Backup automático de dados
  
- **Seções Dinâmicas**:
  - Fiscal, Contábil, Pessoal, Legalização, Controle
  - Estudos Tributários, Financeiro, Atendimento
  - Adição e remoção de seções personalizáveis
  
- **Perfil Detalhado do Cliente**:
  - Informações gerais da empresa
  - Estrutura organizacional
  - Histórico contábil
  - Documentação e processos
  - Financeiro e controle fiscal
  
- **Geração de Documentos**:
  - Exportação para PDF
  - Relatórios personalizados
  
- **Interface Amigável**:
  - Tema claro/escuro
  - Design responsivo
  - Editor de texto avançado para conteúdo

## 🚀 Tecnologias Utilizadas

- **Frontend**:
  - React.js
  - Bootstrap (react-bootstrap)
  - Axios para requisições HTTP
  - React-Quill para edição de texto rico
  - React-Icons para iconografia
  
- **Dependências Principais**:
  - Node.js (v14+)
  - npm ou yarn

## 💻 Instalação e Execução

### Pré-requisitos

- Node.js (v14 ou superior)
- npm ou yarn
- API Backend configurada (veja seção API abaixo)

### Passos para Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/ata-multissetorial.git
   cd ata-multissetorial
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione a URL da API:
     ```
     REACT_APP_API_URL=http://localhost:3001
     ```

4. Inicie a aplicação:
   ```bash
   npm start
   # ou
   yarn start
   ```

## 🔧 Configuração da API

A aplicação requer uma API backend com os seguintes endpoints:

- `GET /forms` - Lista todos os formulários
- `GET /data/:formId` - Recupera dados de um formulário específico
- `POST /createForm` - Cria um novo formulário
- `POST /update/:formId` - Atualiza um formulário existente
- `DELETE /form/:formId` - Exclui um formulário
- `POST /generate/:formId` - Gera o PDF com base nos dados do formulário
- `GET /download/:filename` - Download do PDF gerado

## 📱 Uso da Aplicação

### Gerenciamento de Formulários

1. Na tela inicial, você pode:
   - Visualizar a lista de formulários existentes
   - Buscar por formulários específicos
   - Criar um novo formulário
   - Abrir um formulário existente para edição

2. Ao criar/editar um formulário:
   - Preencha o cabeçalho com informações básicas
   - Acesse o "Formulário de Perfil do Cliente" para detalhes do cliente
   - Adicione seções específicas conforme necessário
   - Adicione blocos em cada seção com título e conteúdo

3. Gerando documentos:
   - Clique em "Gerar Documentos" após preencher as informações
   - O PDF será gerado e disponibilizado para download

### Modo Escuro

- Alterne entre modo claro e escuro usando o botão no canto superior direito

## 📋 Recursos Adicionais

- Suporte para campos de formulário dinâmicos
- Validação de dados em tempo real
- Salvamento automático de formulários em edição
- Controle de acesso baseado em funções (futura implementação)

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

Desenvolvido com ❤️ para otimizar processos contábeis e melhorar a experiência de gestão de informações.