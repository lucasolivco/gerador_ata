const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const htmlToPdf = require('html-pdf');
const AdmZip = require('adm-zip');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Mapeamento ampliado dos tipos de seção para títulos formatados no PDF
 */
const sectionTitles = {
  fiscal: 'Departamento Fiscal',
  contabil: 'Departamento Contábil',
  pessoal: 'Departamento Pessoal',
  legalizacao: 'Departamento de Legalização',
  controle: 'Departamento de Controle',
  estudos: 'Departamento de Estudos Tributários',
  financeiro: 'Departamento Financeiro',
  atendimento: 'Departamento de Atendimento',
  outros: 'Outros'
};

// Estrutura de armazenamento
const formListFilePath = path.resolve(__dirname, 'formList.json');
const formsDirectory = path.resolve(__dirname, 'forms');
const logoDirectory = path.resolve(__dirname, 'assets');

/**
 * Inicializa a estrutura de arquivos necessária para a aplicação
 */
try {
  if (!fs.existsSync(formsDirectory)) {
    fs.mkdirSync(formsDirectory, { recursive: true });
    console.log(`Diretório de formulários criado em: ${formsDirectory}`);
  }
  
  if (!fs.existsSync(logoDirectory)) {
    fs.mkdirSync(logoDirectory, { recursive: true });
    console.log(`Diretório de assets criado em: ${logoDirectory}`);
  }
  
  // Verificar também se o arquivo de lista existe
  if (!fs.existsSync(formListFilePath)) {
    fs.writeFileSync(formListFilePath, JSON.stringify([]));
    console.log(`Arquivo de lista de formulários criado em: ${formListFilePath}`);
  }
} catch (error) {
  console.error('Erro ao criar diretórios ou arquivos necessários:', error);
}

/**
 * Lê a lista de formulários do arquivo
 * @returns {Array} Lista de formulários
 */
const readFormList = () => {
  try {
    if (!fs.existsSync(formListFilePath)) {
      fs.writeFileSync(formListFilePath, JSON.stringify([]));
      return [];
    }
    
    const data = fs.readFileSync(formListFilePath, 'utf-8');
    
    if (!data || data.trim() === '') {
      fs.writeFileSync(formListFilePath, JSON.stringify([]));
      return [];
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler lista de formulários:', error);
    fs.writeFileSync(formListFilePath, JSON.stringify([]));
    return [];
  }
};

/**
 * Salva a lista de formulários no arquivo
 * @param {Array} formList - Lista de formulários
 */
const saveFormList = (formList) => {
  fs.writeFileSync(formListFilePath, JSON.stringify(formList, null, 2));
};

/**
 * Lê os dados de um formulário específico pelo ID
 * @param {string} formId - ID do formulário
 * @returns {Object} Dados do formulário
 */
const readFormData = (formId) => {
  const formFilePath = path.resolve(formsDirectory, `${formId}.json`);
  
  if (!fs.existsSync(formFilePath)) {
    // Inicializa o formulário com blocos contendo assunto e responsável
    const defaultFormData = {
      sectionsList: [
        {
          type: 'fiscal',
          title: 'Fiscal',
          blocks: [{ title: '', content: '', assunto: '', responsavel: '' }],
          completed: false
        },
        {
          type: 'pessoal',
          title: 'Pessoal',
          blocks: [{ title: '', content: '', assunto: '', responsavel: '' }],
          completed: false
        },
        {
          type: 'contabil',
          title: 'Contábil',
          blocks: [{ title: '', content: '', assunto: '', responsavel: '' }],
          completed: false
        }
      ],
      // Para compatibilidade com versão anterior
      fiscal: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      dp: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      contabil: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      headerData: {
        empresa: '',
        local: '',
        data: '',
        participantesEmpresa: '',
        participantesContabilidade: 'Eli, Cataryna e William',
      },
      // NOVO: Adicionar campo pdfGerado inicializado como false
      pdfGerado: false,
      formInfo: {
        // Informações Gerais da Empresa
        nomeEmpresa: '',
        cnpj: '',
        endereco: '',
        setorAtuacao: '',
        setorAtuacaoDetalhes: '',
        porteEmpresa: '',

        regimeTributario: '', // Adicionar este campo
        
        // Estrutura Organizacional
        numeroFuncionarios: '',
        funcionarioIntermediario: '',
        departamentos: ['', '', ''],
        
        // Motivação para a Mudança
        razoesParaMudanca: [],
        outrosMotivos: '',
        expectativas: '',
        
        // Histórico Contábil
        servicosAnteriores: [],
        outrosServicos: '',

        // Documentação e Processos (novos campos)
        estadoDocumentos: '',
        responsavelDocumentosNome: '',
        responsavelDocumentosCargo: '',
        pendenciasRelatorios: '',
        temBalancoFechado: '',

        // Financeiro
        temParcelamentos: '',
        parcelamentosDetalhes: [''],

        // Controle
        necessidadeControleCND: '',

        // Fiscal
        emiteNF: '',
        quantidadeNotas: '',
        mediaFaturamento: '',
        temSistemaEmissao: '',
        qualSistemaEmissao: '',

        // Preferência de Comunicação
        preferenciaComunicacao: [],

        // Observações Gerais
        observacoesGerais: ''
      }
    };
    
    fs.writeFileSync(formFilePath, JSON.stringify(defaultFormData, null, 2));
    return JSON.parse(JSON.stringify(defaultFormData));
  }
  
  try {
    const data = fs.readFileSync(formFilePath, 'utf-8');
    const parsedData = JSON.parse(data);
    
    // Certificar-se de que o campo pdfGerado existe
    if (parsedData.pdfGerado === undefined) {
      parsedData.pdfGerado = false;
    }
    
    // Certifique-se de que o formInfo existe
    if (!parsedData.formInfo) {
      parsedData.formInfo = {
        nomeEmpresa: '',
        cnpj: '',
        endereco: '',
        setorAtuacao: '',
        setorAtuacaoDetalhes: '',
        porteEmpresa: '',
        regimeTributario: '', // Adicionar este campo
        numeroFuncionarios: '',
        funcionarioIntermediario: '',
        departamentos: ['', '', ''],
        razoesParaMudanca: [],
        outrosMotivos: '',
        expectativas: '',
        servicosAnteriores: [],
        outrosServicos: '', 
        // Novos campos para compatibilidade
        estadoDocumentos: '',
        responsavelDocumentosNome: '',
        responsavelDocumentosCargo: '',
        pendenciasRelatorios: '',
        temBalancoFechado: '',

        // Financeiro
        temParcelamentos: '',
        parcelamentosDetalhes: [''],

        // Controle
        necessidadeControleCND: '',

        // Fiscal
        emiteNF: '',
        quantidadeNotas: '',
        mediaFaturamento: '',
        temSistemaEmissao: '',
        qualSistemaEmissao: '',

        // Preferência de Comunicação
        preferenciaComunicacao: [],

        // Observações Gerais
        observacoesGerais: ''
      };
    }
    
    // Se for um formato antigo sem sectionsList, crie-o
    if (!parsedData.sectionsList) {
      parsedData.sectionsList = [];
      
      // Converter seções antigas para o novo formato
      if (parsedData.fiscal) {
        // Garantir que cada bloco tenha campos assunto e responsável
        const fiscalBlocks = parsedData.fiscal.blocks.map(block => ({
          ...block,
          assunto: block.assunto || '',
          responsavel: block.responsavel || ''
        }));
        
        parsedData.sectionsList.push({
          type: 'fiscal',
          title: 'Fiscal',
          blocks: fiscalBlocks,
          completed: parsedData.fiscal.completed || false
        });
      }
      
      if (parsedData.dp) {
        // Garantir que cada bloco tenha campos assunto e responsável
        const dpBlocks = parsedData.dp.blocks.map(block => ({
          ...block,
          assunto: block.assunto || '',
          responsavel: block.responsavel || ''
        }));
        
        parsedData.sectionsList.push({
          type: 'pessoal',
          title: 'Pessoal',
          blocks: dpBlocks,
          completed: parsedData.dp.completed || false
        });
      }
      
      if (parsedData.contabil) {
        // Garantir que cada bloco tenha campos assunto e responsável
        const contabilBlocks = parsedData.contabil.blocks.map(block => ({
          ...block,
          assunto: block.assunto || '',
          responsavel: block.responsavel || ''
        }));
        
        parsedData.sectionsList.push({
          type: 'contabil',
          title: 'Contábil',
          blocks: contabilBlocks,
          completed: parsedData.contabil.completed || false
        });
      }
      
      // Se não houver nenhuma seção, adicione pelo menos uma
      if (parsedData.sectionsList.length === 0) {
        parsedData.sectionsList.push({
          type: 'fiscal',
          title: 'Fiscal',
          blocks: [{ title: '', content: '', assunto: '', responsavel: '' }],
          completed: false
        });
      }
      
      // Salve o formato atualizado
      fs.writeFileSync(formFilePath, JSON.stringify(parsedData, null, 2));
    } else {
      // Garantir que todos os blocos em sectionsList tenham os campos assunto e responsável
      parsedData.sectionsList = parsedData.sectionsList.map(section => {
        const updatedBlocks = section.blocks.map(block => ({
          ...block,
          assunto: block.assunto || '',
          responsavel: block.responsavel || ''
        }));
        
        return {
          ...section,
          blocks: updatedBlocks
        };
      });
    }
    
    // Garante que alterações feitas aos dados sejam salvas
    fs.writeFileSync(formFilePath, JSON.stringify(parsedData, null, 2));
    
    return parsedData;
  } catch (error) {
    console.error(`Erro ao ler arquivo ${formId}.json:`, error);
    // Em caso de erro, retorne um objeto padrão novo
    return {
      sectionsList: [
        {
          type: 'fiscal',
          title: 'Fiscal',
          blocks: [{ title: '', content: '', assunto: '', responsavel: '' }],
          completed: false
        }
      ],
      // Para compatibilidade
      fiscal: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      dp: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      contabil: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      headerData: {
        empresa: '',
        local: '',
        data: '',
        participantesEmpresa: '',
        participantesContabilidade: 'Eli, Cataryna e William',
      },
      // NOVO: Inicializar pdfGerado como false
      pdfGerado: false,
      formInfo: {
        nomeEmpresa: '',
        cnpj: '',
        endereco: '',
        setorAtuacao: '',
        setorAtuacaoDetalhes: '',
        porteEmpresa: '',
        regimeTributario: '', // Adicionar este campo
        numeroFuncionarios: '',
        funcionarioIntermediario: '',
        departamentos: ['', '', ''],
        razoesParaMudanca: [],
        outrosMotivos: '',
        expectativas: '',
        servicosAnteriores: [],
        outrosServicos: '',
        // Novos campos para compatibilidade
        estadoDocumentos: '',
        responsavelDocumentosNome: '',
        responsavelDocumentosCargo: '',
        pendenciasRelatorios: '',
        temBalancoFechado: '',

        // Financeiro
        temParcelamentos: '',
        parcelamentosDetalhes: [''],

        // Controle
        necessidadeControleCND: '',

        // Fiscal
        emiteNF: '',
        quantidadeNotas: '',
        mediaFaturamento: '',
        temSistemaEmissao: '',
        qualSistemaEmissao: '',

        // Preferência de Comunicação
        preferenciaComunicacao: [],

        // Observações Gerais
        observacoesGerais: ''
      }
    };
  }
};

/**
 * Salva os dados de um formulário no arquivo
 * @param {string} formId - ID do formulário
 * @param {Object} formData - Dados do formulário
 */
const saveFormData = (formId, formData) => {
  const formFilePath = path.resolve(formsDirectory, `${formId}.json`);
  fs.writeFileSync(formFilePath, JSON.stringify(formData, null, 2));
};

/**
 * Gera um arquivo PDF a partir dos dados das seções
 * @param {Object} sections - Seções do formulário
 * @param {Object} headerData - Dados do cabeçalho
 * @param {string} filename - Nome do arquivo de saída
 * @returns {Promise} Promessa com o resultado da geração
 */
const generatePDF = (sections, headerData, filename) => {
  console.log('Gerando PDF...');

  const htmlContent = generateHTML(sections, headerData);
  
  const options = {
    format: 'A4',
    border: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  };
  
  return new Promise((resolve, reject) => {
    htmlToPdf.create(htmlContent, options).toFile(filename, (err, res) => {
      if (err) {
        console.error('Erro ao gerar PDF:', err);
        reject(err);
      } else {
        console.log('PDF gerado com sucesso:', res);
        resolve(res);
      }
    });
  });
};

/**
 * Formata uma data ISO para o formato DD-MM-YYYY
 * @param {string} dateString - Data no formato ISO (YYYY-MM-DD)
 * @returns {string} Data formatada
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

/**
 * Gera o HTML para o PDF a partir das seções e dados do cabeçalho
 * @param {Object} sections - Seções do formulário
 * @param {Object} headerData - Dados do cabeçalho
 * @returns {string} Conteúdo HTML
 */
const generateHTML = (sections, headerData) => {
  // Se headerData não for um objeto, inicialize como objeto vazio
  if (!headerData || typeof headerData !== 'object') {
    headerData = {};
  }

  // Logo da empresa codificado em Base64
  // Substitua este Base64 pelo seu logo real
  const logoBase64 = `data:image/jpg;base64,/9j/4AAQSkZJRgABAQIAJQAlAAD/4QAWRXhpZgAATU0AKgAAAAgAAAAAAAD/4QS+aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49J++7vycgaWQ9J1c1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCc/Pgo8eDp4bXBtZXRhIHhtbG5zOng9J2Fkb2JlOm5zOm1ldGEvJz4KPHJkZjpSREYgeG1sbnM6cmRmPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjJz4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOkF0dHJpYj0naHR0cDovL25zLmF0dHJpYnV0aW9uLmNvbS9hZHMvMS4wLyc+CiAgPEF0dHJpYjpBZHM+CiAgIDxyZGY6U2VxPgogICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSdSZXNvdXJjZSc+CiAgICAgPEF0dHJpYjpDcmVhdGVkPjIwMjUtMDQtMDc8L0F0dHJpYjpDcmVhdGVkPgogICAgIDxBdHRyaWI6RXh0SWQ+NDNmODE2ODctN2Q3Yy00NGNlLTlmMjYtYzEwMDhmYzdkZDMwPC9BdHRyaWI6RXh0SWQ+CiAgICAgPEF0dHJpYjpGYklkPjUyNTI2NTkxNDE3OTU4MDwvQXR0cmliOkZiSWQ+CiAgICAgPEF0dHJpYjpUb3VjaFR5cGU+MjwvQXR0cmliOlRvdWNoVHlwZT4KICAgIDwvcmRmOmxpPgogICA8L3JkZjpTZXE+CiAgPC9BdHRyaWI6QWRzPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPkRlc2lnbiBzZW0gbm9tZSAtIDU8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjph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`;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ata de Reunião</title>
      <style>
        /* CSS existente */
        @page {
          size: A4;
          margin: 2.5cm;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #212121;
          margin: 0;
          padding: 0;
        }
        
        .document {
          max-width: 100%;
          margin: 0 auto;
        }
        
        /* Cabeçalho com borda inferior e espalamento */
        .header {
          text-align: left; /* Alterado de center para left */
          margin-bottom: 2cm;
          border-bottom: 2px solid #333;
          padding-bottom: 1cm;
          position: relative;
        }
        
        .logo {
          position: absolute;
          top: 0;
          right: 0;
          width: 80px;
          height: auto;
          border-radius: 8px;
          margin-top: 5px;
          margin-right: 4.5px; /* Manter dentro da margem segura */
        }

        .title {
          font-size: 20pt;
          font-weight: bold;
          margin-bottom: 0.5cm;
          text-transform: uppercase;
          text-align: left; /* Garantir que o título esteja alinhado à esquerda */
        }

        /* Tabela do cabeçalho com espaçamento */
        .header-info {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5cm 0;
        }
        
        .header-info td {
          padding: 0.5cm;
          vertical-align: top;
          text-align: left;
        }
        
        .header-info td:first-child {
          font-weight: bold;
          width: 25%;
        }
        
        /* Estilos para seções */
        .section {
          margin: 1.5cm 0;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 16pt;
          font-weight: bold;
          text-transform: uppercase;
          background-color: #f0f0f0;
          padding: 0.5cm;
          margin-bottom: 0.5cm;
          border-left: 5px solid #333;
        }
        
        /* Estilos para blocos de conteúdo */
        .block {
          margin: 1cm;
        }
        
        .block-title {
          font-weight: bold;
          font-size: 14pt;
          margin-bottom: 0.3cm;
          color: #444;
        }
        
        .block-content {
          text-align: justify;
          margin-left: 0.5cm;
        }
        
        .block-content p {
          margin: 0.3cm 0;
        }
        
        /* estilos para listas */
        .block-content ul, 
        .block-content ol {
          margin: 0.5cm 0;
          padding-left: 1cm;
        }
        
        .signature-section {
          margin-top: 3cm;
          page-break-inside: avoid;
          display: flex;
          justify-content: space-around;
        }
        
        .signature {
          width: 40%;
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          margin-bottom: 0.3cm;
          margin-top: 2cm;
        }
        
        .signature-name {
          font-weight: bold;
        }
        
        .signature-title {
          font-size: 10pt;
          color: #666;
        }

        /* Novos estilos para listas hierárquicas */         
        .block-content li {
          position: relative;
          margin-bottom: 0.2cm;
        }
        
        /* Estilos para diferentes níveis de identação */
        .block-content ul ul,
        .block-content ol ol {
          padding-left: 1cm;
        }
        
        .block-content .ql-indent-1 { margin-left: 1.5cm; }
        .block-content .ql-indent-2 { margin-left: 3.0cm; }
        .block-content .ql-indent-3 { margin-left: 4.5cm; }
        .block-content .ql-indent-4 { margin-left: 6.0cm; }
        
        /* Estilos para listas ordenadas */
        .block-content ol {
          list-style-type: decimal;
        }
        
        .block-content ol .ql-indent-1 {
          list-style-type: lower-alpha;
        }
        
        .block-content ol .ql-indent-2 {
          list-style-type: lower-roman;
        }
        
        .block-content ol .ql-indent-3 {
          list-style-type: upper-alpha;
        }
      </style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <img src="${logoBase64}" class="logo" alt="Logo da Empresa">
          <div class="title">Ata de Reunião</div>
          <table class="header-info">
            <tr>
              <td>Empresa</td>
              <td>${headerData.empresa || ''}</td>
            </tr>
            <tr>
              <td>Local</td>
              <td>${headerData.local || ''}</td>
            </tr>
            <tr>
              <td>Data</td>
              <td>${headerData.data ? formatDate(headerData.data) : ''}</td>
            </tr>
            <tr>
              <td>Representantes ${headerData.empresa || ''}</td>
              <td>${headerData.participantesEmpresa || ''}</td>
            </tr>
              <td>Representantes Canella & Santos</td>
              <td>${headerData.participantesContabilidade || ''}</td>
          </table>
        </div>
  `;

  /**
   * Processa o conteúdo HTML do editor Quill para exibição no PDF
   * @param {string} content - Conteúdo HTML do editor
   * @returns {string} Conteúdo HTML processado
   */
  const processQuillContent = (content) => {
    if (!content) return '';
    
    // Converte classes de identação para estilos consistentes
    content = content
      .replace(/<li class="ql-indent-(\d+)"/g, '<li class="ql-indent-$1" style="margin-left: ${1.5 * parseInt($1)}cm"')
      .replace(/<ul class="ql-indent-(\d+)"/g, '<ul class="ql-indent-$1" style="margin-left: ${1.5 * parseInt($1)}cm"')
      .replace(/<ol class="ql-indent-(\d+)"/g, '<ol class="ql-indent-$1" style="margin-left: ${1.5 * parseInt($1)}cm"');
    
    return content;
  };

  // Adicionar a seção de Formulário de Perfil do Cliente, se existir
  if (sections.formInfo) {
    const formInfo = sections.formInfo;
    const hasContent = formInfo.nomeEmpresa || formInfo.cnpj || formInfo.endereco || 
                      formInfo.setorAtuacao || formInfo.porteEmpresa || formInfo.setorAtuacaoDetalhes ||
                      formInfo.numeroFuncionarios || formInfo.funcionarioIntermediario ||
                      (formInfo.departamentos && formInfo.departamentos.some(dep => dep)) ||
                      (formInfo.razoesParaMudanca && formInfo.razoesParaMudanca.length > 0) ||
                      formInfo.expectativas ||
                      (formInfo.servicosAnteriores && formInfo.servicosAnteriores.length > 0) ||
                      // Campos existentes de Documentação e Processos
                      formInfo.estadoDocumentos ||
                      formInfo.responsavelDocumentosNome ||
                      formInfo.responsavelDocumentosCargo ||
                      formInfo.pendenciasRelatorios ||
                      // NOVOS campos Fiscal
                      formInfo.emiteNF ||
                      formInfo.quantidadeNotas ||
                      formInfo.mediaFaturamento ||
                      formInfo.temSistemaEmissao ||
                      formInfo.qualSistemaEmissao ||
                      // NOVOS campos
                      formInfo.temBalancoFechado ||
                      formInfo.temParcelamentos ||
                      (formInfo.parcelamentosDetalhes && formInfo.parcelamentosDetalhes.some(p => p)) ||
                      formInfo.necessidadeControleCND ||
                      (formInfo.preferenciaComunicacao && formInfo.preferenciaComunicacao.length > 0) ||
                      formInfo.observacoesGerais;
    
    if (hasContent) {
      html += `
        <div class="section">
          <div class="section-title">FORMULÁRIO DE PERFIL DO CLIENTE</div>
      `;
      
      // 1. Informações Gerais da Empresa
      html += `
        <div class="block">
          <div class="block-title">1. Informações Gerais da Empresa</div>
          <div class="block-content">
            <p><strong>Nome da Empresa:</strong> ${formInfo.nomeEmpresa || ''}</p>
            <p><strong>CNPJ:</strong> ${formInfo.cnpj || ''}</p>
            <p><strong>Endereço (Sede/Filiais):</strong> ${formInfo.endereco || ''}</p>
            <p><strong>Setor de Atuação:</strong> ${formInfo.setorAtuacao === "Outros" ? 
              `Outros: ${formInfo.setorAtuacaoDetalhes || 'Não especificado'}` : 
              formInfo.setorAtuacao || ''}</p>
            <p><strong>Porte da Empresa:</strong> ${formInfo.porteEmpresa || ''}</p>
          </div>
        </div>
      `;

      // 1.1. Informações de Contato
      html += `
        <div class="block">
          <div class="block-title">1.1. Informações de Contato</div>
          <div class="block-content">
            <p><strong>Email:</strong> ${formInfo.email || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${formInfo.telefone || 'Não informado'}</p>
            <p><strong>WhatsApp:</strong> ${formInfo.whatsapp || 'Não informado'}</p>
            <p><strong>Outros Contatos:</strong> ${formInfo.outrosContatos || 'Não informado'}</p>
          </div>
        </div>
      `;
      
      // 2. Estrutura Organizacional
      html += `
        <div class="block">
          <div class="block-title">2. Estrutura Organizacional</div>
          <div class="block-content">
            <p><strong>Número de Funcionários:</strong> ${formInfo.numeroFuncionarios || ''}</p>
            <p><strong>Funcionário Intermediário:</strong> ${formInfo.funcionarioIntermediario || ''}</p>
            <p><strong>Principais Departamentos:</strong></p>
            <ul>
              ${formInfo.departamentos && Array.isArray(formInfo.departamentos) ? 
                formInfo.departamentos.map(departamento => 
                  departamento ? `<li>${departamento}</li>` : ''
                ).join('') 
                : ''}
            </ul>
          </div>
        </div>
      `;
      
      // 3. Motivação para a Mudança
      html += `
        <div class="block">
          <div class="block-title">3. Motivação para a Mudança</div>
          <div class="block-content">
            <p><strong>Razões para a Mudança de Contabilidade:</strong></p>
            <ul>
              ${formInfo.razoesParaMudanca && formInfo.razoesParaMudanca.map(razao => `<li>${razao}</li>`).join('') || ''}
              ${formInfo.razoesParaMudanca && formInfo.razoesParaMudanca.includes('Outros') && formInfo.outrosMotivos ? 
                `<li>Outros: ${formInfo.outrosMotivos}</li>` : ''}
            </ul>
            <p><strong>Expectativas com a Nova Contabilidade:</strong></p>
            <p>${formInfo.expectativas || ''}</p>
          </div>
        </div>
      `;
      
      // 4. Histórico Contábil
      html += `
        <div class="block">
          <div class="block-title">4. Histórico Contábil</div>
          <div class="block-content">
            <p><strong>Escritório Contábil Anterior:</strong> ${formInfo.escritorioContabilAnterior || 'Não informado'}</p>
            
            <p><strong>Serviços Utilizados Anteriormente:</strong></p>
            <ul>
              ${formInfo.servicosAnteriores && formInfo.servicosAnteriores.map(servico => `<li>${servico}</li>`).join('') || ''}
              ${formInfo.servicosAnteriores && formInfo.servicosAnteriores.includes('Outros') && formInfo.outrosServicos ? 
                `<li>Outros: ${formInfo.outrosServicos}</li>` : ''}
            </ul>
          </div>
        </div>
      `;

      // 5. Documentação e Processos
      html += `
        <div class="block">
          <div class="block-title">5. Documentação e Processos</div>
          <div class="block-content">
            <p><strong>Estado Atual dos Documentos Contábeis:</strong> ${formInfo.estadoDocumentos || 'Não informado'}</p>
            
            <p><strong>Responsável Interno pelo Envio de Documentos:</strong></p>
            <p>Nome: ${formInfo.responsavelDocumentosNome || 'Não informado'}</p>
            <p>Cargo: ${formInfo.responsavelDocumentosCargo || 'Não informado'}</p>
            
            <p><strong>Pendências nos relatórios e-cac e estado:</strong></p>
            <p>${formInfo.pendenciasRelatorios || 'Não informado'}</p>
            
            <p><strong>Tem Balanço / livro contábil fechado?</strong> ${formInfo.temBalancoFechado || 'Não informado'}</p>
          </div>
        </div>
      `;

      // 6. Financeiro
      html += `
        <div class="block">
          <div class="block-title">6. Financeiro</div>
          <div class="block-content">
            <p><strong>Tem parcelamentos?</strong> ${formInfo.temParcelamentos || 'Não informado'}</p>
            
            ${formInfo.temParcelamentos === 'Sim' ? `
              <p><strong>Detalhes dos Parcelamentos:</strong></p>
              <ul>
                ${formInfo.parcelamentosDetalhes && formInfo.parcelamentosDetalhes.map(parcelamento => 
                  parcelamento ? `<li>${parcelamento}</li>` : ''
                ).join('') || '<li>Não informado</li>'}
              </ul>
            ` : ''}
          </div>
        </div>
      `;

      // 7. Controle
      html += `
        <div class="block">
          <div class="block-title">7. Controle</div>
          <div class="block-content">
            <p><strong>Tem necessidade de controle CND?</strong> ${formInfo.necessidadeControleCND || 'Não informado'}</p>
          </div>
        </div>
      `;

      // 8. Fiscal
      html += `
        <div class="block">
          <div class="block-title">8. Fiscal</div>
          <div class="block-content">
            <p><strong>Regime Tributário:</strong> ${formInfo.regimeTributario || 'Não informado'}</p>
            
            <p><strong>Emite NF?</strong> ${formInfo.emiteNF || 'Não informado'}</p>
            
            ${formInfo.emiteNF === 'Sim' ? `
              <p><strong>Quantas notas?</strong> ${formInfo.quantidadeNotas || 'Não informado'}</p>
              <p><strong>Qual a média de faturamento?</strong> ${formInfo.mediaFaturamento || 'Não informado'}</p>
            ` : ''}
            
            <p><strong>Tem sistema de emissão de nota?</strong> ${formInfo.temSistemaEmissao || 'Não informado'}</p>
            
            ${formInfo.temSistemaEmissao === 'Sim' ? `
              <p><strong>Qual o sistema?</strong> ${formInfo.qualSistemaEmissao || 'Não informado'}</p>
            ` : ''}
          </div>
        </div>
      `;

      // Observações Gerais
      if (formInfo.observacoesGerais) {
        html += `
          <div class="block">
            <div class="block-title">Observações Gerais</div>
            <div class="block-content">
              <p>${formInfo.observacoesGerais}</p>
            </div>
          </div>
        `;
      }
      
      html += `</div>`;
    }
  }
  
  // Melhor verificação para sectionsList
  if (sections.sectionsList && Array.isArray(sections.sectionsList)) {
    // Processa o novo formato com a lista de seções
    sections.sectionsList.forEach(section => {
      // Ignorar blocos vazios
      if (!section || !section.blocks || !Array.isArray(section.blocks)) {
        return;
      }
      
      const blocks = section.blocks;
      const hasContent = blocks.some(block => {
        const hasTitle = block && block.title && block.title.trim();
        const hasContent = block && block.content && block.content.trim();
        return hasTitle || hasContent;
      });

      if (hasContent) {
        // Usar o título do mapeamento de seções ou o tipo da seção
        const sectionType = section.type || 'outros';
        const sectionTitle = sectionTitles[sectionType] || section.title || sectionType.toUpperCase();
        
        html += `
          <div class="section">
            <div class="section-title">${sectionTitle}</div>
        `;

        section.blocks.forEach((block) => {
          if (block && (block.title || block.content)) {
            html += `
              <div class="block">
                ${block.title ? `<div class="block-title">${block.title}</div>` : ''}
                ${block.content ? `<div class="block-content">${processQuillContent(block.content)}</div>` : ''}
              </div>
            `;
          }
        });

        html += `</div>`;
      }
    });
  } else {
    // Modo de compatibilidade: verifica todas as chaves que podem ser seções
    const sectionKeys = Object.keys(sections).filter(key => 
      key !== 'formInfo' && 
      key !== 'sectionsList' &&
      sections[key] && 
      typeof sections[key] === 'object' && 
      Array.isArray(sections[key].blocks)
    );
    
    // Processar cada seção encontrada
    sectionKeys.forEach(sectionKey => {
      const section = sections[sectionKey];
      if (!section || !section.blocks || !Array.isArray(section.blocks)) {
        return;
      }
      
      const blocks = section.blocks;
      const hasContent = blocks.some(block => {
        const hasTitle = block && block.title && block.title.trim();
        const hasContent = block && block.content && block.content.trim();
        return hasTitle || hasContent;
      });

      if (hasContent) {
        // Determinar o título da seção
        let sectionTitle;
        if (sectionKey === 'dp') {
          sectionTitle = 'Departamento Pessoal';
        } else {
          sectionTitle = sectionTitles[sectionKey] || sectionKey.toUpperCase();
        }
        
        html += `
          <div class="section">
            <div class="section-title">${sectionTitle}</div>
        `;

        section.blocks.forEach((block) => {
          if (block && (block.title || block.content)) {
            html += `
              <div class="block">
                ${block.title ? `<div class="block-title">${block.title}</div>` : ''}
                ${block.content ? `<div class="block-content">${processQuillContent(block.content)}</div>` : ''}
              </div>
            `;
          }
        });

        html += `</div>`;
      }
    });
  }

  html += `</div></body></html>`;
  return html;
};
  
/**
 * Rota para obter os dados de um formulário
 */
app.get('/data/:formId', (req, res) => {
  try {
    const { formId } = req.params;
    const formData = readFormData(formId);
    res.json(formData);
  } catch (error) {
    console.error('Erro ao ler os dados:', error);
    res.status(500).json({ error: 'Erro ao ler os dados.' });
  }
});

/**
 * Rota para listar todos os formulários
 */
app.get('/forms', (req, res) => {
  try {
    const formList = readFormList();
    res.json(formList);
  } catch (error) {
    console.error('Erro ao listar os formulários:', error);
    res.status(500).json({ error: 'Erro ao listar os formulários.' });
  }
});

/**
 * Rota para criar um novo formulário
 */
app.post('/createForm', (req, res) => {
  try {
    const id = uuidv4();
    // Incluir campos assunto e responsável nos blocos padrão
    const defaultFormData = {
      // Novo formato de seções
      sectionsList: [
        {
          type: 'fiscal',
          title: 'Fiscal',
          blocks: [{ title: '', content: '', assunto: '', responsavel: '' }],
          completed: false
        },
        {
          type: 'pessoal',
          title: 'Pessoal',
          blocks: [{ title: '', content: '', assunto: '', responsavel: '' }],
          completed: false
        },
        {
          type: 'contabil',
          title: 'Contábil',
          blocks: [{ title: '', content: '', assunto: '', responsavel: '' }],
          completed: false
        }
      ],
      // Para compatibilidade
      fiscal: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      dp: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      contabil: { blocks: [{ title: '', content: '', assunto: '', responsavel: '' }], completed: false },
      headerData: {
        empresa: '',
        local: '',
        data: '',
        participantesEmpresa: '',
        participantesContabilidade: 'Eli, Cataryna e William',
      },
      // NOVO: Inicializar o campo pdfGerado
      pdfGerado: false,
      formInfo: {
        nomeEmpresa: '',
        cnpj: '',
        endereco: '',
        setorAtuacao: '',
        setorAtuacaoDetalhes: '',
        porteEmpresa: '',
        numeroFuncionarios: '',
        funcionarioIntermediario: '',
        departamentos: ['', '', ''],
        razoesParaMudanca: [],
        outrosMotivos: '',
        expectativas: '',
        servicosAnteriores: [],
        outrosServicos: '',
        // Novos campos para compatibilidade
        estadoDocumentos: '',
        responsavelDocumentosNome: '',
        responsavelDocumentosCargo: '',
        pendenciasRelatorios: '',
        temBalancoFechado: '',

        // Financeiro
        temParcelamentos: '',
        parcelamentosDetalhes: [''],

        // Controle
        necessidadeControleCND: '',

        // Fiscal
        emiteNF: '',
        quantidadeNotas: '',
        mediaFaturamento: '',
        temSistemaEmissao: '',
        qualSistemaEmissao: '',

        // Preferência de Comunicação
        preferenciaComunicacao: [],

        // Observações Gerais
        observacoesGerais: ''
      }
    };
    
    // Salvar os dados do formulário
    const formFilePath = path.resolve(formsDirectory, `${id}.json`);
    fs.writeFileSync(formFilePath, JSON.stringify(defaultFormData, null, 2));
    
    // Adicionar à lista de formulários
    const formList = readFormList();
    formList.push({
      id,
      title: 'Novo Formulário',
      date: ''
    });
    saveFormList(formList);
    
    res.json({ formId: id });
  } catch (error) {
    console.error('Erro ao criar o formulário:', error);
    res.status(500).json({ error: 'Erro ao criar o formulário.' });
  }
});

/**
 * Rota para atualizar um formulário existente
 */
app.post('/update/:formId', (req, res) => {
  const { formId } = req.params;
  const { sectionsList, headerData, formInfo, pdfGerado } = req.body;
  
  try {
    // Ler os dados existentes
    const existingData = readFormData(formId);
    
    // Criar um novo objeto para o formulário
    const formData = { ...existingData };
    
    // NOVO: Atualizar o campo pdfGerado se fornecido
    if (pdfGerado !== undefined) {
      formData.pdfGerado = pdfGerado;
    }
    
    // Atualizar sectionsList se fornecido
    if (sectionsList) {
      formData.sectionsList = JSON.parse(JSON.stringify(sectionsList));
      
      // Atualizar também o formato antigo para compatibilidade
      // Encontrar a seção fiscal
      const fiscalSection = sectionsList.find(section => section.type === 'fiscal');
      if (fiscalSection) {
        formData.fiscal = {
          blocks: fiscalSection.blocks,
          completed: fiscalSection.completed
        };
      }
      
      // Encontrar a seção pessoal (dp)
      const pessoalSection = sectionsList.find(section => section.type === 'pessoal');
      if (pessoalSection) {
        formData.dp = {
          blocks: pessoalSection.blocks,
          completed: pessoalSection.completed
        };
      }
      
      // Encontrar a seção contábil
      const contabilSection = sectionsList.find(section => section.type === 'contabil');
      if (contabilSection) {
        formData.contabil = {
          blocks: contabilSection.blocks,
          completed: contabilSection.completed
        };
      }
    }
    
    // Adicionar headerData se fornecido
    if (headerData) {
      formData.headerData = JSON.parse(JSON.stringify(headerData));
      
      // Atualizar o título na lista de formulários
      const formList = readFormList();
      const formIndex = formList.findIndex(f => f.id === formId);
      
      if (formIndex !== -1) {
        formList[formIndex].title = headerData.empresa || 'Formulário sem título';
        formList[formIndex].date = headerData.data || '';
        saveFormList(formList);
      }
    }
    
    // Adicionar formInfo se fornecido
    if (formInfo) {
      formData.formInfo = JSON.parse(JSON.stringify(formInfo));
    }
    
    // Salvar os dados atualizados
    saveFormData(formId, formData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar os dados:', error);
    res.status(500).json({ error: 'Erro ao salvar os dados.' });
  }
});

/**
 * Rota para gerar o PDF a partir dos dados do formulário
 */
app.post('/generate/:formId', async (req, res) => {
  const { formId } = req.params;
  const { sections, headerData, formInfo } = req.body;
  
  if (!sections || typeof sections !== 'object' || !headerData) {
    return res.status(400).json({ error: 'Dados inválidos: sections ou headerData ausentes' });
  }
  
  // Extrair o nome da empresa e formatar para uso no nome do arquivo
  const empresaNome = headerData.empresa || 'relatorio';
  // Remover caracteres especiais e substituir espaços por underscores
  const nomeArquivoSeguro = empresaNome.trim()
                           .replace(/[^\w\s]/gi, '') // Remove caracteres especiais
                           .replace(/\s+/g, '_');    // Substitui espaços por underscores
  
  const id = uuidv4();
  const pdfPath = `./temp/${id}.pdf`;
  const zipPath = `./temp/${id}.zip`;

  if (!fs.existsSync('./temp')) {
    try {
      fs.mkdirSync('./temp');
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error('Erro ao criar diretório temp:', err);
        return res.status(500).json({ error: 'Erro ao criar diretório temporário.' });
      }
    }
  }

  try {
    // Criar uma cópia limpa dos dados para evitar problemas de referência
    const sectionsWithFormInfo = JSON.parse(JSON.stringify({
      ...sections,
      formInfo: formInfo || {
        nomeEmpresa: '',
        cnpj: '',
        endereco: '',
        setorAtuacao: '',
        setorAtuacaoDetalhes: '',
        porteEmpresa: '',
        numeroFuncionarios: '',
        funcionarioIntermediario: '',
        departamentos: ['', '', ''],
        razoesParaMudanca: [],
        outrosMotivos: '',
        expectativas: '',
        servicosAnteriores: [],
        outrosServicos: ''
      }
    }));
    
    const headerDataCopy = JSON.parse(JSON.stringify(headerData));
    
    await generatePDF(sectionsWithFormInfo, headerDataCopy, pdfPath);
    const zip = new AdmZip();
    zip.addLocalFile(pdfPath);
    zip.writeZip(zipPath);
    
    // NOVO: Atualizar o campo pdfGerado no formulário
    try {
      const existingData = readFormData(formId);
      existingData.pdfGerado = true;
      saveFormData(formId, existingData);
    } catch (updateError) {
      console.error('Erro ao atualizar status pdfGerado:', updateError);
      // Continuar mesmo com erro para não interromper a geração do PDF
    }
    
    // Incluir o nome da empresa formatado na resposta
    res.json({ 
      filename: id,
      empresaNome: nomeArquivoSeguro // Nome da empresa formatado para o arquivo
    });
  } catch (error) {
    console.error('Erro ao gerar documentos:', error);
    res.status(500).json({ error: 'Erro ao gerar documentos' });
  }
});

/**
 * Rota para download do arquivo ZIP gerado
 */
app.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  // Pegar o nome da empresa a partir do parâmetro de consulta
  const { empresa } = req.query;
  
  const filePath = path.resolve(`./temp/${filename}.zip`);
  
  // Usar o nome da empresa se fornecido, senão usar 'relatorio'
  const fileName = empresa ? `${empresa}.zip` : 'relatorio.zip';
  
  console.log(`Fazendo download do arquivo: ${fileName}`); // Log para debug
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Arquivo não encontrado');
  }
  
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Erro ao fazer download:', err);
      return res.status(500).send('Erro ao fazer download do arquivo');
    }
    
    // Opcional - remover o arquivo temporário após o download
    // Descomente se quiser limpar os arquivos após o download
    fs.unlinkSync(filePath);
  });
});

/**
 * Rota para deletar um formulário
 */
app.delete('/form/:formId', (req, res) => {
  try {
    const { formId } = req.params;
    console.log(`Recebida solicitação para excluir formulário: ${formId}`);
    
    if (!formId) {
      console.error('ID do formulário não fornecido');
      return res.status(400).json({ error: 'ID do formulário não fornecido' });
    }
    
    const formFilePath = path.resolve(formsDirectory, `${formId}.json`);
    console.log(`Caminho do arquivo a ser excluído: ${formFilePath}`);
    
    if (fs.existsSync(formFilePath)) {
      console.log('Arquivo do formulário encontrado, procedendo com a exclusão');
      
      try {
        // Remover o arquivo JSON do formulário
        fs.unlinkSync(formFilePath);
        console.log('Arquivo do formulário excluído com sucesso');
      } catch (fileError) {
        console.error('Erro ao excluir arquivo:', fileError);
        return res.status(500).json({ error: 'Erro ao excluir arquivo do formulário' });
      }
      
      try {
        // Remover da lista de formulários
        const formList = readFormList();
        console.log(`Lista de formulários antes da exclusão: ${formList.length} formulários`);
        
        const updatedList = formList.filter(form => form.id !== formId);
        console.log(`Lista de formulários após filtro: ${updatedList.length} formulários`);
        
        saveFormList(updatedList);
        console.log('Lista de formulários atualizada salva');
      } catch (listError) {
        console.error('Erro ao atualizar lista de formulários:', listError);
        // Mesmo com erro na lista, o arquivo foi excluído, então consideramos parcialmente bem-sucedido
        return res.status(207).json({ 
          warning: 'Formulário excluído, mas houve erro ao atualizar a lista',
          error: listError.message
        });
      }
      
      return res.json({ success: true });
    } else {
      console.log('Arquivo do formulário não encontrado');
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao deletar o formulário:', error);
    return res.status(500).json({ error: 'Erro ao deletar o formulário.' });
  }
});

// Inicia o servidor na porta 3001
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Isso permite acesso de qualquer IP na rede

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`);
});