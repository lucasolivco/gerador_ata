import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, Row, Col, Modal, ListGroup, Dropdown, Pagination, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { FaSun, FaMoon, FaPlus, FaTrash, FaCheck, FaEdit, FaArrowLeft, FaSearch } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// URL da API obtida das variáveis de ambiente
const API_URL = process.env.REACT_APP_API_URL;

// Mapeamento de todos os tipos de seção disponíveis para seleção
const SECTION_TYPES = {
  fiscal: 'Fiscal',
  contabil: 'Contábil',
  pessoal: 'Pessoal',
  legalizacao: 'Legalização',
  controle: 'Controle',
  estudos: 'Estudos Tributários',
  financeiro: 'Financeiro',
  atendimento: 'Atendimento',
  outros: 'Outros'
};

/**
 * Componente para selecionar formulários existentes ou criar um novo
 * @param {Object} props - Propriedades do componente
 * @param {Function} props.onSelectForm - Função callback para selecionar um formulário
 */
const FormSelection = ({ onSelectForm}) => {
  // Estado para armazenar a lista de formulários
  const [forms, setForms] = useState([]);
  // Estados para controlar o modal de exclusão
  const [showDeleteFormModal, setShowDeleteFormModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  // Estados para busca e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formsPerPage] = useState(10);

  /**
   * Formata uma data no formato ISO para o formato brasileiro
   * @param {string} dateString - Data no formato ISO (YYYY-MM-DD)
   * @returns {string} Data formatada como DD/MM/YYYY ou string vazia se não houver data
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  /**
   * Carrega a lista de formulários do servidor
   */
  const loadForms = () => {
    axios.get(`${API_URL}/forms`)
      .then(response => {
        setForms(response.data);
      })
      .catch(error => {
        console.error('Erro ao carregar os formulários:', error);
      });
  };

  // Carrega os formulários ao montar o componente
  useEffect(() => {
    loadForms();
  }, []);

  /**
   * Exclui um formulário pelo ID
   * @param {string} formId - ID do formulário a ser excluído
   */
  const deleteForm = (formId) => {
    console.log(`Tentando excluir formulário com ID: ${formId}`);
    
    if (!formId) {
      console.error('ID do formulário não fornecido para exclusão');
      return;
    }
    
    // Garantir que a URL esteja correta
    const deleteUrl = `${API_URL}/form/${formId}`;
    console.log(`URL de exclusão: ${deleteUrl}`);
    
    axios.delete(deleteUrl)
      .then(response => {
        console.log('Resposta do servidor após exclusão:', response.data);
        alert('Formulário excluído com sucesso!');
        // Após a exclusão, recarregue a lista de formulários
        loadForms();
      })
      .catch(error => {
        console.error('Erro ao deletar o formulário:', error);
        alert(`Erro ao excluir o formulário: ${error.message}`);
      });
  };

  /**
   * Seleciona um formulário para edição
   * @param {string} id - ID do formulário ou 'new' para criar um novo
   */
  const handleSelectForm = (id) => {
    // Chama a função passada pelo componente pai, que selecionará o formulário
    onSelectForm(id);
  };

  // Filtra os formulários com base no termo de pesquisa
  const filteredForms = forms.filter(form => 
    form.title && form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculo para paginação
  const indexOfLastForm = currentPage * formsPerPage;
  const indexOfFirstForm = indexOfLastForm - formsPerPage;
  const currentForms = filteredForms.slice(indexOfFirstForm, indexOfLastForm);

  // Muda a página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Gera itens de paginação
  const pageItems = [];
  for (let number = 1; number <= Math.ceil(filteredForms.length / formsPerPage); number++) {
    pageItems.push(
      <Pagination.Item 
        key={number} 
        active={number === currentPage}
        onClick={() => paginate(number)}
      >
        {number}
      </Pagination.Item>,
    );
  }

  return (
    <div>
      <h2 className="form-title" style={{ marginBottom: '1.5rem' }}>
        Selecione um Formulário
      </h2>

      {/* Campo de busca */}
      <Form className="mb-4">
        <InputGroup>
          <InputGroup.Text><FaSearch /></InputGroup.Text>
          <Form.Control
            placeholder="Buscar formulários..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Resetar para a primeira página ao buscar
            }}
          />
        </InputGroup>
      </Form>

      <ListGroup className="mb-4">
        {currentForms.length > 0 ? (
          currentForms.map(form => (
            <ListGroup.Item 
              key={form.id}
              className="form-list-item d-flex justify-content-between align-items-center"
              style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
            >
              <span className="ms-2" style={{ flexGrow: 1 }}>
                {form.title} {form.date && `- ${formatDate(form.date)}`}
              </span>
              <div>
                <Button 
                  variant="outline-primary" 
                  onClick={() => handleSelectForm(form.id)}
                  className="custom-button px-3 py-1 me-2"
                >
                  Abrir
                </Button>
                <Button 
                  variant="outline-danger" 
                  onClick={() => {
                    setFormToDelete(form.id);
                    setShowDeleteFormModal(true);
                  }}
                  className="custom-button delete-form-btn px-3 py-1"
                >
                  <FaTrash />
                </Button>
              </div>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item className="text-center">
            {searchTerm ? "Nenhum formulário encontrado para a busca." : "Nenhum formulário disponível."}
          </ListGroup.Item>
        )}
      </ListGroup>

      {/* Paginação */}
      {filteredForms.length > formsPerPage && (
        <div className="d-flex justify-content-center mb-4">
          <Pagination>
            <Pagination.First onClick={() => paginate(1)} />
            <Pagination.Prev 
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            />
            {pageItems}
            <Pagination.Next 
              onClick={() => paginate(Math.min(Math.ceil(filteredForms.length / formsPerPage), currentPage + 1))}
              disabled={currentPage === Math.ceil(filteredForms.length / formsPerPage)}
            />
            <Pagination.Last onClick={() => paginate(Math.ceil(filteredForms.length / formsPerPage))} />
          </Pagination>
        </div>
      )}

      <Button 
        variant="success" 
        onClick={() => handleSelectForm('new')} 
        className="custom-button d-block mx-auto px-4 py-2"
      >
        Criar Novo Formulário
      </Button>
      {/* Modal de Confirmação de Exclusão */}
      <Modal show={showDeleteFormModal} onHide={() => setShowDeleteFormModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteFormModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => {
            deleteForm(formToDelete);
            setShowDeleteFormModal(false);
          }}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

/**
 * Componente principal da aplicação
 */
function App() {
  // Estados para controlar os modais
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formId, setFormId] = useState(null);
  const [sectionsList, setSectionsList] = useState([]); // Array para armazenar seções dinâmicas
  const [selectedSectionType, setSelectedSectionType] = useState('fiscal'); // Tipo de seção selecionado no dropdown
  const [showAddSectionModal, setShowAddSectionModal] = useState(false); // Modal para adicionar nova seção
  // loading visual
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Estado para o cabeçalho do formulário
  const [headerData, setHeaderData] = useState({
    empresa: '',
    local: '',
    data: '',
    participantesEmpresa: '',
    participantesContabilidade: 'Eli, Cataryna e William',
  });
  
  // Estados de controle da aplicação
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState({ sectionIndex: null, blockIndex: null });
  const [sectionToDelete, setSectionToDelete] = useState(null); // State para deletar seção
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false); // Modal para confirmar exclusão de seção
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [pdfGerado, setPdfGerado] = useState(false);
  
  // Estado para o modo escuro com persistência no localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  
  // Estado para o formulário de informações do cliente
  const [formInfo, setFormInfo] = useState({
    // Informações Gerais da Empresa
    nomeEmpresa: '',
    cnpj: '',
    endereco: '',
    setorAtuacao: '',
    porteEmpresa: '',
    setorAtuacaoDetalhes: '', // NOVO: detalhes do setor de atuação
    
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
    escritorioContabilAnterior: '',  // NOVO: escritório contábil anterior

    // Documentação e Processos
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
    regimeTributario: '',  // NOVO: regime tributário

    // Preferência de Comunicação
    preferenciaComunicacao: [],

    // Observações Gerais
    observacoesGerais: '',

    // NOVOS CAMPOS
    // Informações de Contato
    email: '',
    telefone: '',
    whatsapp: '',
    outrosContatos: '',

    // Responsável (não impresso no PDF)
    responsavel: ''
  });

  // Estado para controlar a exibição do modal de informações
  const [showFormInfoModal, setShowFormInfoModal] = useState(false);

  // Atualiza o localStorage sempre que o modo dark for alterado
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  /**
   * Atualiza os campos do cabeçalho e salva no servidor
   * @param {string} field - Nome do campo a ser atualizado
   * @param {string} value - Novo valor do campo
   */
  const updateHeaderField = (field, value) => {
    // Clone profundo para evitar referências compartilhadas
    const newHeaderData = JSON.parse(JSON.stringify({...headerData, [field]: value}));
    setHeaderData(newHeaderData);
    
    if (formId && formId !== 'new') {
      try {
        // Clone profundo para evitar modificações indesejadas
        const sectionsListCopy = JSON.parse(JSON.stringify(sectionsList));
        
        axios.post(`${API_URL}/update/${formId}`, { 
          sectionsList: sectionsListCopy, 
          headerData: newHeaderData,
          formInfo: JSON.parse(JSON.stringify(formInfo))
        });
      } catch (error) {
        console.error('Erro ao atualizar o cabeçalho:', error);
      }
    }
  };
  
  /**
   * Atualiza as informações do formulário e salva no servidor
   * @param {Object} newFormInfo - Novas informações do formulário
   */
  const updateFormInfo = async (newFormInfo) => {
    // Clone profundo para garantir que todos os arrays existam
    const updatedFormInfo = {
      // Informações Gerais da Empresa
      nomeEmpresa: newFormInfo?.nomeEmpresa || '',
      cnpj: newFormInfo?.cnpj || '',
      endereco: newFormInfo?.endereco || '',
      setorAtuacao: newFormInfo?.setorAtuacao || '',
      setorAtuacaoDetalhes: newFormInfo?.setorAtuacaoDetalhes || '',
      porteEmpresa: newFormInfo?.porteEmpresa || '',
      
      // Estrutura Organizacional
      numeroFuncionarios: newFormInfo?.numeroFuncionarios || '',
      funcionarioIntermediario: newFormInfo?.funcionarioIntermediario || '',
      departamentos: newFormInfo?.departamentos || ['', '', ''],
      
      // Motivação para a Mudança
      razoesParaMudanca: newFormInfo?.razoesParaMudanca || [],
      outrosMotivos: newFormInfo?.outrosMotivos || '',
      expectativas: newFormInfo?.expectativas || '',
      
      // Histórico Contábil
      servicosAnteriores: newFormInfo?.servicosAnteriores || [],
      outrosServicos: newFormInfo?.outrosServicos || '',
      escritorioContabilAnterior: newFormInfo?.escritorioContabilAnterior || '',  // NOVO
      
      // Documentação e Processos
      estadoDocumentos: newFormInfo?.estadoDocumentos || '',
      responsavelDocumentosNome: newFormInfo?.responsavelDocumentosNome || '',
      responsavelDocumentosCargo: newFormInfo?.responsavelDocumentosCargo || '',
      pendenciasRelatorios: newFormInfo?.pendenciasRelatorios || '',
      temBalancoFechado: newFormInfo?.temBalancoFechado || '',

      // Financeiro
      temParcelamentos: newFormInfo?.temParcelamentos || '',
      parcelamentosDetalhes: newFormInfo?.parcelamentosDetalhes || [''],

      // Controle
      necessidadeControleCND: newFormInfo?.necessidadeControleCND || '',

      // Fiscal
      emiteNF: newFormInfo?.emiteNF || '',
      quantidadeNotas: newFormInfo?.quantidadeNotas || '',
      mediaFaturamento: newFormInfo?.mediaFaturamento || '',
      temSistemaEmissao: newFormInfo?.temSistemaEmissao || '',
      qualSistemaEmissao: newFormInfo?.qualSistemaEmissao || '',
      regimeTributario: newFormInfo?.regimeTributario || '',  // NOVO

      // Preferência de Comunicação
      preferenciaComunicacao: newFormInfo?.preferenciaComunicacao || [],

      // Observações Gerais
      observacoesGerais: newFormInfo?.observacoesGerais || '',

      // NOVOS CAMPOS
      // Informações de Contato
      email: newFormInfo?.email || '',
      telefone: newFormInfo?.telefone || '',
      whatsapp: newFormInfo?.whatsapp || '',
      outrosContatos: newFormInfo?.outrosContatos || '',

      // Responsável (não impresso no PDF)
      responsavel: newFormInfo?.responsavel || ''
    };
    
    setFormInfo(updatedFormInfo);
    
    if (formId && formId !== 'new') {
      try {
        // Envie uma cópia, não uma referência
        await axios.post(`${API_URL}/update/${formId}`, { 
          sectionsList: JSON.parse(JSON.stringify(sectionsList)), 
          headerData: JSON.parse(JSON.stringify(headerData)),
          formInfo: {...updatedFormInfo}
        });
      } catch (error) {
        console.error('Erro ao atualizar informações do formulário:', error);
      }
    }
  };

  // Carrega dados do formulário quando formId muda
  useEffect(() => {
    if (!formId) {
      // Nenhum formulário selecionado, resetar o estado
      setSectionsList([]);
      setHeaderData({
        empresa: '',
        local: '',
        data: '',
        participantesEmpresa: '',
        participantesContabilidade: 'Eli, Cataryna e William',
      });
      setFormInfo({
        nomeEmpresa: '',
        cnpj: '',
        endereco: '',
        setorAtuacao: '',
        setorAtuacaoDetalhes: '', // NOVO: detalhes do setor de atuação
        porteEmpresa: '',
        numeroFuncionarios: '',
        funcionarioIntermediario: '',
        departamentos: ['', '', ''],
        razoesParaMudanca: [],
        outrosMotivos: '',
        expectativas: '',
        servicosAnteriores: [],
        outrosServicos: '',
        escritorioContabilAnterior: '',  // NOVO
        email: '',                       // NOVO
        telefone: '',                    // NOVO
        whatsapp: '',                    // NOVO
        outrosContatos: '',              // NOVO
        responsavel: ''                  // NOVO
      });
      setLoading(false);
      setPdfGerado(false); // Reiniciar o estado
      return;
    }
    
    setLoading(true);
    
    if (formId === 'new') {
      // Resetar o estado antes de criar um novo formulário
      setSectionsList([]);
      setHeaderData({
        empresa: '',
        local: '',
        data: '',
        participantesEmpresa: '',
        participantesContabilidade: 'Eli, Cataryna e William',
      });
      
      // Inicializar o formInfo com valores vazios
      setFormInfo({
        nomeEmpresa: '',
        cnpj: '',
        endereco: '',
        setorAtuacao: '',
        setorAtuacaoDetalhes: '', // NOVO: detalhes do setor de atuação
        porteEmpresa: '',
        numeroFuncionarios: '',
        funcionarioIntermediario: '',
        departamentos: ['', '', ''],
        razoesParaMudanca: [],
        outrosMotivos: '',
        expectativas: '',
        servicosAnteriores: [],
        outrosServicos: '',
        escritorioContabilAnterior: '',  // NOVO
        email: '',                       // NOVO
        telefone: '',                    // NOVO
        whatsapp: '',                    // NOVO
        outrosContatos: '',              // NOVO
        responsavel: ''                  // NOVO
      });
      
      // Criar novo formulário
      axios.post(`${API_URL}/createForm`)
        .then(response => {
          const newFormId = response.data.formId;

            setPdfGerado(false); // NOVO: Um novo formulário nunca tem PDF gerado
          
          // Carregar os dados do servidor para evitar dados desatualizados
          return axios.get(`${API_URL}/data/${newFormId}`)
            .then(dataResponse => {
              setFormId(newFormId);
              
              const data = dataResponse.data;
              
              // Inicializar sectionsList - converter formato antigo se necessário
              if (data.sectionsList) {
                // Novo formato - usar diretamente
                setSectionsList(JSON.parse(JSON.stringify(data.sectionsList)));
              } else {
                // Formato antigo - converter para o novo formato
                const newSections = [];
                
                // Adicionar seções antigas se existirem
                if (data.fiscal) {
                  newSections.push({
                    type: 'fiscal',
                    title: SECTION_TYPES.fiscal,
                    blocks: data.fiscal.blocks || [{}],
                    completed: data.fiscal.completed || false
                  });
                }
                
                if (data.dp) {
                  newSections.push({
                    type: 'pessoal',
                    title: SECTION_TYPES.pessoal,
                    blocks: data.dp.blocks || [{}],
                    completed: data.dp.completed || false
                  });
                }
                
                if (data.contabil) {
                  newSections.push({
                    type: 'contabil',
                    title: SECTION_TYPES.contabil,
                    blocks: data.contabil.blocks || [{}],
                    completed: data.contabil.completed || false
                  });
                }
                
                // Se não houver seções antigas, adicionar uma seção fiscal padrão
                if (newSections.length === 0) {
                  newSections.push({
                    type: 'fiscal',
                    title: SECTION_TYPES.fiscal,
                    blocks: [{}],
                    completed: false
                  });
                }
                
                setSectionsList(newSections);
              }
              
              setHeaderData(data.headerData || {
                empresa: '',
                local: '',
                data: '',
                participantesEmpresa: '',
                participantesContabilidade: 'Eli, Cataryna e William',
              });
              
              // Carregar dados do formulário de informações
              const formInfoData = data.formInfo || {};
              setFormInfo({
                nomeEmpresa: formInfoData.nomeEmpresa || '',
                cnpj: formInfoData.cnpj || '',
                endereco: formInfoData.endereco || '',
                setorAtuacao: formInfoData.setorAtuacao || '',
                setorAtuacaoDetalhes: formInfoData.setorAtuacaoDetalhes || '', // NOVO: detalhes do setor de atuação
                porteEmpresa: formInfoData.porteEmpresa || '',
                numeroFuncionarios: formInfoData.numeroFuncionarios || '',
                funcionarioIntermediario: formInfoData.funcionarioIntermediario || '',
                departamentos: formInfoData.departamentos || ['', '', ''],
                razoesParaMudanca: formInfoData.razoesParaMudanca || [],
                outrosMotivos: formInfoData.outrosMotivos || '',
                expectativas: formInfoData.expectativas || '',
                servicosAnteriores: formInfoData.servicosAnteriores || [],
                outrosServicos: formInfoData.outrosServicos || '',
                escritorioContabilAnterior: formInfoData.escritorioContabilAnterior || '', // NOVO

                // Documentação e Processos
                estadoDocumentos: formInfoData.estadoDocumentos || '',
                responsavelDocumentosNome: formInfoData.responsavelDocumentosNome || '',
                responsavelDocumentosCargo: formInfoData.responsavelDocumentosCargo || '',
                pendenciasRelatorios: formInfoData.pendenciasRelatorios || '',

                // NOVOS CAMPOS
                email: formInfoData.email || '',
                telefone: formInfoData.telefone || '',
                whatsapp: formInfoData.whatsapp || '',
                outrosContatos: formInfoData.outrosContatos || '',
                responsavel: formInfoData.responsavel || '',
                regimeTributario: formInfoData.regimeTributario || ''
              });
            });
        })
        .catch(error => {
          console.error('Erro ao criar/carregar novo formulário:', error);
          setFormId(null); // Voltar para a tela de seleção em caso de erro
        })
        .finally(() => setLoading(false));
    } else {
      // Carregar formulário existente
      axios.get(`${API_URL}/data/${formId}`)
        .then(response => {
          const data = response.data || {};
          
          // Verificar se o PDF foi gerado
          if (data.pdfGerado) {
            setPdfGerado(true);
          } else {
            setPdfGerado(false);
          }
          
          // Inicializar sectionsList - converter formato antigo se necessário
          if (data.sectionsList) {
            // Novo formato - usar diretamente
            setSectionsList(JSON.parse(JSON.stringify(data.sectionsList)));
          } else {
            // Formato antigo - converter para o novo formato
            const newSections = [];
            
            // Adicionar seções antigas se existirem
            if (data.fiscal) {
              newSections.push({
                type: 'fiscal',
                title: SECTION_TYPES.fiscal,
                blocks: data.fiscal.blocks || [{}],
                completed: data.fiscal.completed || false
              });
            }
            
            if (data.dp) {
              newSections.push({
                type: 'pessoal',
                title: SECTION_TYPES.pessoal,
                blocks: data.dp.blocks || [{}],
                completed: data.dp.completed || false
              });
            }
            
            if (data.contabil) {
              newSections.push({
                type: 'contabil',
                title: SECTION_TYPES.contabil,
                blocks: data.contabil.blocks || [{}],
                completed: data.contabil.completed || false
              });
            }
            
            // Se não houver seções antigas, adicionar uma seção fiscal padrão
            if (newSections.length === 0) {
              newSections.push({
                type: 'fiscal',
                title: SECTION_TYPES.fiscal,
                blocks: [{}],
                completed: false
              });
            }
            
            setSectionsList(newSections);
          }
          
          setHeaderData(data.headerData || {
            empresa: '',
            local: '',
            data: '',
            participantesEmpresa: '',
            participantesContabilidade: 'Eli, Cataryna e William',
          });
          
          // Carregar dados do formulário de informações
          const formInfoData = data.formInfo || {};
          setFormInfo({
            nomeEmpresa: formInfoData.nomeEmpresa || '',
            cnpj: formInfoData.cnpj || '',
            endereco: formInfoData.endereco || '',
            setorAtuacao: formInfoData.setorAtuacao || '',
            setorAtuacaoDetalhes: formInfoData.setorAtuacaoDetalhes || '', // NOVO: detalhes do setor de atuação
            porteEmpresa: formInfoData.porteEmpresa || '',
            numeroFuncionarios: formInfoData.numeroFuncionarios || '',
            funcionarioIntermediario: formInfoData.funcionarioIntermediario || '',
            departamentos: formInfoData.departamentos || ['', '', ''],
            razoesParaMudanca: formInfoData.razoesParaMudanca || [],
            outrosMotivos: formInfoData.outrosMotivos || '',
            expectativas: formInfoData.expectativas || '',
            servicosAnteriores: formInfoData.servicosAnteriores || [],
            outrosServicos: formInfoData.outrosServicos || '',
            escritorioContabilAnterior: formInfoData.escritorioContabilAnterior || '', // NOVO
            
            // Documentação e Processos
            estadoDocumentos: formInfoData.estadoDocumentos || '',
            responsavelDocumentosNome: formInfoData.responsavelDocumentosNome || '',
            responsavelDocumentosCargo: formInfoData.responsavelDocumentosCargo || '',
            pendenciasRelatorios: formInfoData.pendenciasRelatorios || '',
            temBalancoFechado: formInfoData.temBalancoFechado || '',

            // Financeiro
            temParcelamentos: formInfoData.temParcelamentos || '',
            parcelamentosDetalhes: formInfoData.parcelamentosDetalhes || [''],

            // Controle
            necessidadeControleCND: formInfoData.necessidadeControleCND || '',

            // Fiscal
            emiteNF: formInfoData.emiteNF || '',
            quantidadeNotas: formInfoData.quantidadeNotas || '',
            mediaFaturamento: formInfoData.mediaFaturamento || '',
            temSistemaEmissao: formInfoData.temSistemaEmissao || '',
            qualSistemaEmissao: formInfoData.qualSistemaEmissao || '',
            regimeTributario: formInfoData.regimeTributario || '', // NOVO

            // Preferência de Comunicação
            preferenciaComunicacao: formInfoData.preferenciaComunicacao || [],

            // Observações Gerais
            observacoesGerais: formInfoData.observacoesGerais || '',

            // NOVOS CAMPOS
            email: formInfoData.email || '',
            telefone: formInfoData.telefone || '',
            whatsapp: formInfoData.whatsapp || '',
            outrosContatos: formInfoData.outrosContatos || '',
            responsavel: formInfoData.responsavel || ''
          });
        })
        .catch(error => {
          console.error('Erro ao carregar os dados:', error);
          setFormId(null); // Voltar para a tela de seleção em caso de erro
        })
        .finally(() => setLoading(false));
    }
  }, [formId]);

  /**
   * Alterna entre modo claro e escuro
   */
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Aplica a classe de modo escuro ao body
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  /**
   * Adiciona uma nova seção ao formulário
   */
  const addSection = async () => {
    // Verificar se o tipo de seção já existe
    const sectionTypeExists = sectionsList.some(section => section.type === selectedSectionType);
    
    // Se o tipo já existe, mostre um alerta e não adicione a seção
    if (sectionTypeExists) {
      alert(`Uma seção do tipo ${SECTION_TYPES[selectedSectionType]} já existe no formulário.`);
      setShowAddSectionModal(false);
      return;
    }
    
    // Criar nova seção
    const newSection = {
      type: selectedSectionType,
      title: SECTION_TYPES[selectedSectionType],
      blocks: [{}],
      completed: false
    };
    
    // Adicionar à lista de seções
    const updatedSectionsList = [...sectionsList, newSection];
    setSectionsList(updatedSectionsList);
    
    // Fechar o modal
    setShowAddSectionModal(false);
    
    // Salvar no servidor
    if (formId && formId !== 'new') {
      try {
        await axios.post(`${API_URL}/update/${formId}`, { 
          sectionsList: updatedSectionsList, 
          headerData: JSON.parse(JSON.stringify(headerData)),
          formInfo: JSON.parse(JSON.stringify(formInfo))
        });
      } catch (error) {
        console.error('Erro ao adicionar seção:', error);
      }
    }
  };

  /**
   * Inicia o processo de exclusão de uma seção
   * @param {number} sectionIndex - Índice da seção a ser excluída
   */
  const deleteSection = async (sectionIndex) => {
    // Confirmar exclusão
    setSectionToDelete(sectionIndex);
    setShowDeleteSectionModal(true);
  };

  /**
   * Confirma a exclusão da seção selecionada
   */
  const confirmDeleteSection = async () => {
    if (sectionToDelete !== null) {
      const updatedSectionsList = [...sectionsList];
      updatedSectionsList.splice(sectionToDelete, 1);
      setSectionsList(updatedSectionsList);
      
      // Salvar no servidor
      if (formId && formId !== 'new') {
        try {
          await axios.post(`${API_URL}/update/${formId}`, { 
            sectionsList: updatedSectionsList, 
            headerData: JSON.parse(JSON.stringify(headerData)),
            formInfo: JSON.parse(JSON.stringify(formInfo))
          });
        } catch (error) {
          console.error('Erro ao excluir seção:', error);
        }
      }
    }
    
    setShowDeleteSectionModal(false);
    setSectionToDelete(null);
  };

  /**
   * Atualiza o conteúdo de um bloco em uma seção
   * @param {number} sectionIndex - Índice da seção
   * @param {number} blockIndex - Índice do bloco
   * @param {string} field - Campo a ser atualizado
   * @param {string} value - Novo valor do campo
   */
  const updateBlock = async (sectionIndex, blockIndex, field, value) => {
    if (!formId || formId === 'new') return; // Não atualize se não houver formulário válido selecionado
    
    // Clone profundo para evitar modificações indesejadas
    const updatedSectionsList = JSON.parse(JSON.stringify(sectionsList));
    updatedSectionsList[sectionIndex].blocks[blockIndex][field] = value;
    
    setSectionsList(updatedSectionsList);
    
    try {
      await axios.post(`${API_URL}/update/${formId}`, { 
        sectionsList: updatedSectionsList, 
        headerData: JSON.parse(JSON.stringify(headerData)),
        formInfo: JSON.parse(JSON.stringify(formInfo))
      });
    } catch (error) {
      console.error('Erro ao atualizar o bloco:', error);
    }
  };

  /**
   * Marca uma seção como completa
   * @param {number} sectionIndex - Índice da seção
   */
  const completeSection = async (sectionIndex) => {
    const updatedSectionsList = JSON.parse(JSON.stringify(sectionsList));
    updatedSectionsList[sectionIndex].completed = true;
    
    setSectionsList(updatedSectionsList);
    if (formId) {
      await axios.post(`${API_URL}/update/${formId}`, { 
        sectionsList: updatedSectionsList, 
        headerData: JSON.parse(JSON.stringify(headerData)),
        formInfo: JSON.parse(JSON.stringify(formInfo))
      });
    }
  };

  /**
   * Reabre uma seção para edição
   * @param {number} sectionIndex - Índice da seção
   */
  const reopenSection = async (sectionIndex) => {
    const updatedSectionsList = JSON.parse(JSON.stringify(sectionsList));
    updatedSectionsList[sectionIndex].completed = false;
    
    setSectionsList(updatedSectionsList);
    if (formId) {
      await axios.post(`${API_URL}/update/${formId}`, { 
        sectionsList: updatedSectionsList, 
        headerData: JSON.parse(JSON.stringify(headerData)),
        formInfo: JSON.parse(JSON.stringify(formInfo))
      });
    }
  };

  /**
   * Adiciona um novo bloco a uma seção
   * @param {number} sectionIndex - Índice da seção
   */
  const addBlock = async (sectionIndex) => {
    const updatedSectionsList = JSON.parse(JSON.stringify(sectionsList));
    // MODIFICAÇÃO: Incluir campos assunto e responsável nos novos blocos
    updatedSectionsList[sectionIndex].blocks.push({
      title: '',
      content: '',
      assunto: '',  // Novo campo assunto
      responsavel: '' // Novo campo responsável
    });
    
    setSectionsList(updatedSectionsList);
    if (formId) {
      await axios.post(`${API_URL}/update/${formId}`, { 
        sectionsList: updatedSectionsList, 
        headerData: JSON.parse(JSON.stringify(headerData)),
        formInfo: JSON.parse(JSON.stringify(formInfo))
      });
    }
  };

  /**
   * Exclui um bloco de uma seção
   * @param {number} sectionIndex - Índice da seção
   * @param {number} blockIndex - Índice do bloco
   */
  const deleteBlock = async (sectionIndex, blockIndex) => {
    const updatedSectionsList = JSON.parse(JSON.stringify(sectionsList));
    updatedSectionsList[sectionIndex].blocks.splice(blockIndex, 1);
    
    setSectionsList(updatedSectionsList);
    if (formId) {
      await axios.post(`${API_URL}/update/${formId}`, { 
        sectionsList: updatedSectionsList, 
        headerData: JSON.parse(JSON.stringify(headerData)),
        formInfo: JSON.parse(JSON.stringify(formInfo))
      });
    }
  };

  /**
   * Prepara a exclusão de um bloco
   * @param {number} sectionIndex - Índice da seção
   * @param {number} blockIndex - Índice do bloco
   */
  const handleDeleteClick = (sectionIndex, blockIndex) => {
    setBlockToDelete({ sectionIndex, blockIndex });
    setShowDeleteModal(true);
  };

  /**
   * Confirma a exclusão do bloco selecionado
   */
  const confirmDelete = () => {
    if (blockToDelete.sectionIndex !== null && blockToDelete.blockIndex !== null) {
      deleteBlock(blockToDelete.sectionIndex, blockToDelete.blockIndex);
    }
    setShowDeleteModal(false);
  };

  /**
   * Gera os documentos PDF a partir dos dados do formulário
   */
  const generateDocuments = async () => {
    try {
      setDownloadLoading(true);
      setGeneratingPdf(true); // Indica que o PDF está sendo gerado
      
      // Enviar a lista de seções diretamente para o servidor
      const response = await axios.post(`${API_URL}/generate/${formId}`, { 
        sections: {
          // Incluir formInfo
          formInfo: JSON.parse(JSON.stringify(formInfo)),
          // Incluir a lista completa de seções
          sectionsList: JSON.parse(JSON.stringify(sectionsList))
        }, 
        headerData: JSON.parse(JSON.stringify(headerData)),
        formInfo: JSON.parse(JSON.stringify(formInfo))
      });
      
      // NOVO: Marcar que o PDF foi gerado
      setPdfGerado(true);
      
      // NOVO: Salvar este estado no servidor
      if (formId && formId !== 'new') {
        try {
          await axios.post(`${API_URL}/update/${formId}`, { 
            sectionsList: JSON.parse(JSON.stringify(sectionsList)), 
            headerData: JSON.parse(JSON.stringify(headerData)),
            formInfo: JSON.parse(JSON.stringify(formInfo)),
            pdfGerado: true // NOVO: Salvar o status de PDF gerado
          });
        } catch (error) {
          console.error('Erro ao atualizar estado de PDF gerado:', error);
        }
      }
      
      // Obter o nome da empresa da resposta
      const empresaNome = response.data.empresaNome || '';
      console.log(`Nome da empresa para download: ${empresaNome}`); // Log para debug
      
      // Incluir o nome da empresa na URL de download
      window.open(`${API_URL}/download/${response.data.filename}?empresa=${empresaNome}`, '_blank');
      
    } catch (error) {
      console.error('Erro ao gerar documentos:', error);
      alert('Erro ao gerar documentos!');
    } finally {
      setDownloadLoading(false);
      setGeneratingPdf(false); // Finaliza o estado de geração de PDF
      setShowGenerateModal(false); // Fechar o modal após a conclusão
    }
  };

  if (!formId) {
    // Exibe a tela de seleção se nenhum formulário estiver selecionado
    return <Container className="my-5">
      <FormSelection onSelectForm={(id) => setFormId(id)} />
    </Container>;
  }

  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (!sectionsList) {
    return <div>Erro ao carregar os dados.</div>;
  }

  return (
    <div className={darkMode ? 'dark-mode' : 'light-mode'}>
      {/* botão de alternância no canto superior direito */}
      <button onClick={toggleDarkMode} className="dark-mode-toggle">
        {darkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
      </button>

      {/* Botão de voltar */}
      <Button 
        variant="outline-secondary" 
        onClick={() => setFormId(null)}
        className="custom-button back-button"
        style={{ background: 'transparent', border: 'none' }}
      >
        <FaArrowLeft size={20} />
      </Button>

      <Container className="my-5">
        <h1 className="form-title">Ata Multissetorial</h1>

        {/* Cabeçalho */}
        <Card className={`custom-card ${darkMode ? 'dark-mode' : 'light-mode'}`}>
          <Card.Header className="custom-card card-header">
            <h3>Cabeçalho</h3>
          </Card.Header>
          <Card.Body>
            <Row className="custom-row mb-3">
              <Col md={6} className="custom-col">
                <Form.Control
                  className="custom-input"
                  type="text"
                  placeholder="Empresa"
                  value={headerData.empresa}
                  onChange={(e) => updateHeaderField('empresa', e.target.value)}
                />
              </Col>
              <Col md={6} className="custom-col">
                <Form.Control
                  className="custom-input"
                  type="text"
                  placeholder="Local"
                  value={headerData.local}
                  onChange={(e) => updateHeaderField('local', e.target.value)}
                />
              </Col>
            </Row>
            <Row className="custom-row mb-3">
              <Col md={6} className="custom-col">
                <Form.Control
                  className="custom-input"
                  type="date"
                  placeholder="Data"
                  value={headerData.data}
                  onChange={(e) => updateHeaderField('data', e.target.value)}
                />
              </Col>
              <Col md={6} className="custom-col">
                <Form.Control
                  className="custom-input"
                  type="text"
                  placeholder="Participantes da Empresa"
                  value={headerData.participantesEmpresa}
                  onChange={(e) => updateHeaderField('participantesEmpresa', e.target.value)}
                />
              </Col>
            </Row>
            <Row className="custom-row mb-3">
              <Col md={12} className="custom-col">
                <Form.Control
                  className="custom-input"
                  type="text"
                  placeholder="Participantes da Contabilidade"
                  value={headerData.participantesContabilidade}
                  onChange={(e) => updateHeaderField('participantesContabilidade', e.target.value)}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Botão para acessar o formulário de perfil do cliente */}
        <div className="text-center my-4">
          <Button 
            variant="primary"
            onClick={() => setShowFormInfoModal(true)}
            className="custom-button"
          >
            <FaEdit className="me-2" /> Formulário de Perfil do Cliente
          </Button>
        </div>

        {/* Modal do formulário de informações */}
        <FormInfoModal 
          show={showFormInfoModal}
          onHide={() => setShowFormInfoModal(false)}
          formInfo={formInfo}
          updateFormInfo={updateFormInfo}
          pdfGerado={pdfGerado} // NOVO: Passar o estado para o modal
        />

        {/* Seções dinâmicas */}
        {sectionsList.map((section, index) => (
          <div key={index} className="mb-4">
            <Section
              title={section.title}
              section={section}
              onAddBlock={() => addBlock(index)}
              onComplete={() => completeSection(index)}
              onReopen={() => reopenSection(index)}
              onUpdate={(blockIndex, field, value) => updateBlock(index, blockIndex, field, value)}
              onDelete={(blockIndex) => handleDeleteClick(index, blockIndex)}
              onDeleteSection={() => deleteSection(index)}
            />
          </div>
        ))}

        {/* Botão para adicionar nova seção */}
        <div className="text-center mb-4">
          <Button 
            variant="primary" 
            onClick={() => setShowAddSectionModal(true)}
            className="custom-button"
          >
            <FaPlus className="me-2" /> Adicionar Nova Seção
          </Button>
        </div>

        {/* Botão finalizar */}
        <div className="text-center mt-4">
          <Button 
            variant="success"
            onClick={() => setShowGenerateModal(true)}
            disabled={downloadLoading}
          >
            {downloadLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span className="ms-2">Gerando...</span>
              </>
            ) : (
              "Gerar Documentos"
            )}
          </Button>
        </div>
      </Container>

      {/* Modal de adicionar seção */}
      <Modal show={showAddSectionModal} onHide={() => setShowAddSectionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Nova Seção</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Selecione o tipo de seção:</Form.Label>
            <Form.Select 
              value={selectedSectionType}
              onChange={(e) => setSelectedSectionType(e.target.value)}
            >
              {Object.entries(SECTION_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddSectionModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={addSection}>
            Adicionar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* modal de confirmação de exclusão de bloco */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir este bloco?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>

      {/* modal de confirmação de exclusão de seção */}
      <Modal show={showDeleteSectionModal} onHide={() => setShowDeleteSectionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão de Seção</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir esta seção e todos os seus blocos?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteSectionModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDeleteSection}>
            Excluir Seção
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmação para Gerar Documento */}
      <Modal show={showGenerateModal} onHide={() => !generatingPdf && setShowGenerateModal(false)}>
        <Modal.Header closeButton={!generatingPdf}>
          <Modal.Title>{generatingPdf ? 'Gerando PDF...' : 'Confirmar Geração'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {generatingPdf ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <p className="mb-0">Aguarde enquanto geramos o PDF do seu formulário...</p>
              <p className="text-muted small mt-2">Isso pode levar alguns segundos.</p>
            </div>
          ) : (
            <p>Confirmar download do PDF?
              <br /><br />
              Caso tenha problemas com o download, desabilite o bloqueador de pop-ups.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!generatingPdf && (
            <>
              <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={generateDocuments}>
                Confirmar
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

/**
 * Componente para exibir uma seção do formulário
 * @param {Object} props - Propriedades do componente
 */
const Section = ({ title, section, onAddBlock, onComplete, onReopen, onUpdate, onDelete, onDeleteSection }) => {
  if (!section) {
    return <div>Erro: Seção não está definida.</div>;
  }

  return (
    <Card className={`custom-card ${section.completed ? 'completed' : ''}`}>
      <Card.Header className="custom-card card-header d-flex justify-content-between align-items-center">
        <h3>{title}</h3>
        <div>
          {!section.completed ? (
            <>
              <Button className="custom-button btn-primary me-2" onClick={onAddBlock}>
                <FaPlus />
              </Button>
              <Button className="custom-button btn-danger" onClick={onDeleteSection}>
                <FaTrash />
              </Button>
            </>
          ) : (
            <>
              <Button className="custom-button btn-warning me-2" onClick={onReopen}>
                <FaEdit />
              </Button>
              <Button className="custom-button btn-danger" onClick={onDeleteSection}>
                <FaTrash />
              </Button>
            </>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {section.blocks.map((block, index) => (
          <Row key={index} className="custom-row mb-4">
            {/* MODIFICAÇÃO: Adicionados campos assunto e responsável */}
            <Col md={12} className="custom-col mb-2">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="assunto-label">Assunto</Form.Label>
                    <Form.Control
                      className="custom-input"
                      type="text"
                      placeholder="Assunto"
                      value={block.assunto || ''}
                      onChange={(e) => onUpdate(index, 'assunto', e.target.value)}
                      disabled={section.completed}
                    />
                    <Form.Text className="text-muted">
                      Este campo não será impresso no PDF. É apenas para controle interno.
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="assunto-label">Responsável</Form.Label>
                    <Form.Control
                      className="custom-input"
                      type="text"
                      placeholder="Responsável"
                      value={block.responsavel || ''}
                      onChange={(e) => onUpdate(index, 'responsavel', e.target.value)}
                      disabled={section.completed}
                    />
                    <Form.Text className="text-muted">
                      Este campo não será impresso no PDF. É apenas para controle interno.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
            
            <Col md={6} className="custom-col">
              <Form.Group>
                <Form.Label className="assunto-label">Título</Form.Label>
                <Form.Control
                  className="custom-input"
                  type="text"
                  placeholder="Título"
                  value={block.title || ''}
                  onChange={(e) => onUpdate(index, 'title', e.target.value)}
                  disabled={section.completed}
                />
              </Form.Group>
            </Col>
            
            <Col md={6} className="custom-col">
              <Form.Group>
                <Form.Label className="assunto-label">Conteúdo</Form.Label>
                <ReactQuill
                  theme="snow"
                  value={block.content || ''}
                  onChange={(value) => onUpdate(index, 'content', value)}
                  modules={modules}
                  formats={formats}
                  readOnly={section.completed}
                />
              </Form.Group>
            </Col>
            
            {!section.completed && (
              <Col md={12} className="custom-col mt-2 text-end">
                <Button className="custom-button btn-danger" onClick={() => onDelete(index)}>
                  <FaTrash /> Excluir Bloco
                </Button>
              </Col>
            )}
          </Row>
        ))}
        {!section.completed && (
          <Button className="custom-button btn-outline-success" onClick={onComplete}>
            <FaCheck /> Finalizar Seção
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

/**
 * Componente do Modal de Informações do Cliente
 * @param {Object} props - Propriedades do componente
 */
const FormInfoModal = ({ show, onHide, formInfo, updateFormInfo, pdfGerado }) => {
  // Inicialize com uma cópia profunda do formInfo e garanta que todos os arrays existam
  const [localFormInfo, setLocalFormInfo] = useState(() => ({
    // Informações Gerais da Empresa
    nomeEmpresa: formInfo?.nomeEmpresa || '',
    cnpj: formInfo?.cnpj || '',
    endereco: formInfo?.endereco || '',
    setorAtuacao: formInfo?.setorAtuacao || '',
    setorAtuacaoDetalhes: formInfo?.setorAtuacaoDetalhes || '',
    porteEmpresa: formInfo?.porteEmpresa || '',
    
    // Estrutura Organizacional
    numeroFuncionarios: formInfo?.numeroFuncionarios || '',
    funcionarioIntermediario: formInfo?.funcionarioIntermediario || '',
    departamentos: formInfo?.departamentos || ['', '', ''],
    
    // Motivação para a Mudança
    razoesParaMudanca: formInfo?.razoesParaMudanca || [],
    outrosMotivos: formInfo?.outrosMotivos || '',
    expectativas: formInfo?.expectativas || '',
    
    // Histórico Contábil
    servicosAnteriores: formInfo?.servicosAnteriores || [],
    outrosServicos: formInfo?.outrosServicos || '',
    escritorioContabilAnterior: formInfo?.escritorioContabilAnterior || '',  // NOVO

    // Documentação e Processos (novos campos)
    estadoDocumentos: formInfo?.estadoDocumentos || '',
    responsavelDocumentosNome: formInfo?.responsavelDocumentosNome || '',
    responsavelDocumentosCargo: formInfo?.responsavelDocumentosCargo || '',
    pendenciasRelatorios: formInfo?.pendenciasRelatorios || '',
    temBalancoFechado: formInfo?.temBalancoFechado || '',

    // NOVO: Financeiro
    temParcelamentos: formInfo?.temParcelamentos || '',
    parcelamentosDetalhes: formInfo?.parcelamentosDetalhes || [''],

    // NOVO: Controle
    necessidadeControleCND: formInfo?.necessidadeControleCND || '',

    // NOVO: Fiscal (nova seção 8)
    emiteNF: formInfo?.emiteNF || '',
    quantidadeNotas: formInfo?.quantidadeNotas || '',
    mediaFaturamento: formInfo?.mediaFaturamento || '',
    temSistemaEmissao: formInfo?.temSistemaEmissao || '',
    qualSistemaEmissao: formInfo?.qualSistemaEmissao || '',
    regimeTributario: formInfo?.regimeTributario || '',  // NOVO

    // NOVO: Preferência de Comunicação
    preferenciaComunicacao: formInfo?.preferenciaComunicacao || [],

    // NOVO: Observações Gerais
    observacoesGerais: formInfo?.observacoesGerais || '',

    // NOVOS CAMPOS
    // Informações de Contato
    email: formInfo?.email || '',
    telefone: formInfo?.telefone || '',
    whatsapp: formInfo?.whatsapp || '',
    outrosContatos: formInfo?.outrosContatos || '',

    // Responsável (não impresso no PDF)
    responsavel: formInfo?.responsavel || ''
  }));
  
  // Atualize sempre que o formInfo externo mudar
  useEffect(() => {
    if (show) { // Só atualize quando o modal estiver sendo exibido
      setLocalFormInfo({
        // Informações Gerais da Empresa
        nomeEmpresa: formInfo?.nomeEmpresa || '',
        cnpj: formInfo?.cnpj || '',
        endereco: formInfo?.endereco || '',
        setorAtuacao: formInfo?.setorAtuacao || '',
        setorAtuacaoDetalhes: formInfo?.setorAtuacaoDetalhes || '', // NOVO: detalhes do setor de atuação
        porteEmpresa: formInfo?.porteEmpresa || '',
        
        // Estrutura Organizacional
        numeroFuncionarios: formInfo?.numeroFuncionarios || '',
        funcionarioIntermediario: formInfo?.funcionarioIntermediario || '',
        departamentos: formInfo?.departamentos || ['', '', ''],
        
        // Motivação para a Mudança
        razoesParaMudanca: formInfo?.razoesParaMudanca || [],
        outrosMotivos: formInfo?.outrosMotivos || '',
        expectativas: formInfo?.expectativas || '',
        
        // Histórico Contábil
        servicosAnteriores: formInfo?.servicosAnteriores || [],
        outrosServicos: formInfo?.outrosServicos || '',
        escritorioContabilAnterior: formInfo?.escritorioContabilAnterior || '',  // NOVO

        // Documentação e Processos (novos campos)
        estadoDocumentos: formInfo?.estadoDocumentos || '',
        responsavelDocumentosNome: formInfo?.responsavelDocumentosNome || '',
        responsavelDocumentosCargo: formInfo?.responsavelDocumentosCargo || '',
        pendenciasRelatorios: formInfo?.pendenciasRelatorios || '',
        temBalancoFechado: formInfo?.temBalancoFechado || '',

        // NOVO: Financeiro
        temParcelamentos: formInfo?.temParcelamentos || '',
        parcelamentosDetalhes: formInfo?.parcelamentosDetalhes || [''],

        // NOVO: Controle
        necessidadeControleCND: formInfo?.necessidadeControleCND || '',

        // NOVO: Fiscal (nova seção 8)
        emiteNF: formInfo?.emiteNF || '',
        quantidadeNotas: formInfo?.quantidadeNotas || '',
        mediaFaturamento: formInfo?.mediaFaturamento || '',
        temSistemaEmissao: formInfo?.temSistemaEmissao || '',
        qualSistemaEmissao: formInfo?.qualSistemaEmissao || '',
        regimeTributario: formInfo?.regimeTributario || '',  // NOVO

        // NOVO: Preferência de Comunicação
        preferenciaComunicacao: formInfo?.preferenciaComunicacao || [],

        // NOVO: Observações Gerais
        observacoesGerais: formInfo?.observacoesGerais || '',

        // NOVOS CAMPOS
        // Informações de Contato
        email: formInfo?.email || '',
        telefone: formInfo?.telefone || '',
        whatsapp: formInfo?.whatsapp || '',
        outrosContatos: formInfo?.outrosContatos || '',

        // Responsável (não impresso no PDF)
        responsavel: formInfo?.responsavel || ''
      });
    }
  }, [formInfo, show]);
  
  /**
   * Atualiza um campo simples do formulário
   * @param {string} field - Nome do campo
   * @param {any} value - Novo valor
   */
  const handleInputChange = (field, value) => {
    // Não é necessário verificar pdfGerado aqui
    setLocalFormInfo({...localFormInfo, [field]: value});
  };
  
  /**
   * Atualiza um departamento específico no array de departamentos
   * @param {number} index - Índice do departamento
   * @param {string} value - Novo valor
   */
  const handleDepartamentoChange = (index, value) => {
    const newDepartamentos = [...localFormInfo.departamentos];
    newDepartamentos[index] = value;
    setLocalFormInfo({...localFormInfo, departamentos: newDepartamentos});
  };
  
  /**
   * Atualiza o array de razões para mudança (checkboxes)
   * @param {string} razao - Razão a ser adicionada ou removida
   */
  const handleRazoesChange = (razao) => {
    const newRazoes = [...localFormInfo.razoesParaMudanca];
    
    if (newRazoes.includes(razao)) {
      // Remove a razão se já estiver selecionada
      const index = newRazoes.indexOf(razao);
      newRazoes.splice(index, 1);
    } else {
      // Adiciona a razão se não estiver selecionada
      newRazoes.push(razao);
    }
    
    setLocalFormInfo({...localFormInfo, razoesParaMudanca: newRazoes});
  };
  
  /**
   * Atualiza o array de serviços anteriores (checkboxes)
   * @param {string} servico - Serviço a ser adicionado ou removido
   */
  const handleServicosChange = (servico) => {
    const newServicos = [...localFormInfo.servicosAnteriores];
    
    if (newServicos.includes(servico)) {
      // Remove o serviço se já estiver selecionado
      const index = newServicos.indexOf(servico);
      newServicos.splice(index, 1);
    } else {
      // Adiciona o serviço se não estiver selecionado
      newServicos.push(servico);
    }
    
    setLocalFormInfo({...localFormInfo, servicosAnteriores: newServicos});
  };

  /**
   * Adiciona um novo campo de parcelamento
   */
  const addParcelamentoField = () => {
    const newParcelamentos = [...localFormInfo.parcelamentosDetalhes, ''];
    setLocalFormInfo({...localFormInfo, parcelamentosDetalhes: newParcelamentos});
  };
  
  /**
   * Atualiza um campo de parcelamento específico
   * @param {number} index - Índice do parcelamento
   * @param {string} value - Novo valor
   */
  const handleParcelamentoChange = (index, value) => {
    const newParcelamentos = [...localFormInfo.parcelamentosDetalhes];
    newParcelamentos[index] = value;
    setLocalFormInfo({...localFormInfo, parcelamentosDetalhes: newParcelamentos});
  };
  
  /**
   * Remove um campo de parcelamento
   * @param {number} index - Índice do parcelamento a ser removido
   */
  const removeParcelamentoField = (index) => {
    const newParcelamentos = [...localFormInfo.parcelamentosDetalhes];
    newParcelamentos.splice(index, 1);
    setLocalFormInfo({...localFormInfo, parcelamentosDetalhes: newParcelamentos});
  };

  /**
   * Adiciona um novo campo de departamento
   */
  const addDepartamentoField = () => {
    const newDepartamentos = [...localFormInfo.departamentos, ''];
    setLocalFormInfo({...localFormInfo, departamentos: newDepartamentos});
  };

  /**
   * Remove um campo de departamento
   * @param {number} index - Índice do departamento a ser removido
   */
  const removeDepartamentoField = (index) => {
    if (index === 0) return; // Não permite remover o primeiro departamento
    const newDepartamentos = [...localFormInfo.departamentos];
    newDepartamentos.splice(index, 1);
    setLocalFormInfo({...localFormInfo, departamentos: newDepartamentos});
  };
  
  /**
   * Atualiza o array de preferências de comunicação (checkboxes)
   * @param {string} preferencia - Preferência a ser adicionada ou removida
   */
  const handlePreferenciaComunicacaoChange = (preferencia) => {
    const newPreferencias = [...localFormInfo.preferenciaComunicacao];
    
    if (newPreferencias.includes(preferencia)) {
      // Remove a preferência se já estiver selecionada
      const index = newPreferencias.indexOf(preferencia);
      newPreferencias.splice(index, 1);
    } else {
      // Adiciona a preferência se não estiver selecionada
      newPreferencias.push(preferencia);
    }
    
    setLocalFormInfo({...localFormInfo, preferenciaComunicacao: newPreferencias});
  };
  
  /**
   * Salva as alterações do formulário
   */
  const handleSave = () => {
    // Só salva se o PDF não foi gerado
    if (!pdfGerado) {
      updateFormInfo(localFormInfo);
    }
    onHide();
  };
  
  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Formulário de Perfil do Cliente
          {pdfGerado && <span className="ms-2 text-danger">(Somente visualização)</span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pdfGerado && (
          <div className="alert alert-warning mb-3">
            <strong>Atenção:</strong> Este formulário está em modo somente leitura pois o PDF já foi gerado.
          </div>
        )}
        
        {/* Aplicamos a classe readonly-form quando o PDF foi gerado */}
        <Form className={pdfGerado ? "readonly-form" : ""}>
          {/* Campo de Responsável (não impresso no PDF) */}
          <h4 className="mt-3 mb-3">Responsável Interno</h4>
          <Form.Group className="mb-3">
            <Form.Label>Responsável pelo Cliente (apenas para controle interno)</Form.Label>
            <Form.Control
              type="text"
              value={localFormInfo.responsavel || ''}
              onChange={(e) => handleInputChange('responsavel', e.target.value)}
              placeholder="Nome do responsável interno pelo cliente"
            />
            <Form.Text className="text-muted">
              Este campo não será impresso no PDF. É apenas para controle interno.
            </Form.Text>
          </Form.Group>

          {/* 1. Informações Gerais da Empresa */}
          <h4 className="mt-3 mb-3">1. Informações Gerais da Empresa</h4>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nome da Empresa</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.nomeEmpresa || ''}
                  onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>CNPJ</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.cnpj || ''}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Endereço (Sede/Filiais)</Form.Label>
            <Form.Control
              type="text"
              value={localFormInfo.endereco || ''}
              onChange={(e) => handleInputChange('endereco', e.target.value)}
            />
          </Form.Group>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Setor de Atuação</Form.Label>
                <Form.Select
                  value={localFormInfo.setorAtuacao || ''}
                  onChange={(e) => handleInputChange('setorAtuacao', e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="Comércio">Comércio</option>
                  <option value="Serviço">Serviço</option>
                  <option value="Fabricação">Fabricação</option>
                  <option value="Varejo">Varejo</option>
                  <option value="Atacado">Atacado</option>
                  <option value="Outros">Outros</option>
                </Form.Select>
              </Form.Group>
              {(localFormInfo.setorAtuacao === 'Outros' || localFormInfo.setorAtuacaoDetalhes) && (
                <Form.Group className="mb-3">
                  <Form.Label>Especifique o setor de atuação:</Form.Label>
                  <Form.Control
                    type="text"
                    value={localFormInfo.setorAtuacaoDetalhes || ''}
                    onChange={(e) => handleInputChange('setorAtuacaoDetalhes', e.target.value)}
                    placeholder="Descreva o setor de atuação"
                    disabled={localFormInfo.setorAtuacao !== 'Outros'}
                  />
                  {localFormInfo.setorAtuacao !== 'Outros' && localFormInfo.setorAtuacaoDetalhes && (
                    <Form.Text className="text-muted">
                      Este campo está preenchido, mas desabilitado porque o setor de atuação não é 'Outros'. 
                      Mude para 'Outros' para editar.
                    </Form.Text>
                  )}
                </Form.Group>
              )}
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Porte da Empresa</Form.Label>
                <Form.Select
                  value={localFormInfo.porteEmpresa || ''}
                  onChange={(e) => handleInputChange('porteEmpresa', e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="Microempresa">Microempresa</option>
                  <option value="Pequena">Pequena</option>
                  <option value="Média">Média</option>
                  <option value="Grande">Grande</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* NOVA SEÇÃO: Informações de Contato */}
          <h4 className="mt-4 mb-3">1.1. Informações de Contato</h4>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={localFormInfo.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.telefone || ''}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(00) 0000-0000"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>WhatsApp</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.whatsapp || ''}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Outros Contatos</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.outrosContatos || ''}
                  onChange={(e) => handleInputChange('outrosContatos', e.target.value)}
                  placeholder="Skype, Telegram, etc."
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* 2. Estrutura Organizacional */}
          <h4 className="mt-4 mb-3">2. Estrutura Organizacional</h4>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Número de Funcionários</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.numeroFuncionarios || ''}
                  onChange={(e) => handleInputChange('numeroFuncionarios', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Funcionário Intermediário</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.funcionarioIntermediario || ''}
                  onChange={(e) => handleInputChange('funcionarioIntermediario', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Principais Departamentos</Form.Label>
            {localFormInfo.departamentos.map((departamento, index) => (
              <div key={index} className="d-flex mb-2">
                <Form.Control
                  type="text"
                  placeholder={`Departamento ${index + 1}`}
                  value={departamento || ''}
                  onChange={(e) => handleDepartamentoChange(index, e.target.value)}
                  className="me-2"
                />
                {index > 0 && (
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => removeDepartamentoField(index)}
                    disabled={pdfGerado}
                  >
                    -
                  </Button>
                )}
              </div>
            ))}
            {!pdfGerado && (
              <Button 
                variant="success" 
                size="sm" 
                onClick={addDepartamentoField}
                className="mt-2"
              >
                + Adicionar Departamento
              </Button>
            )}
          </Form.Group>
          
          {/* 3. Motivação para a Mudança */}
          <h4 className="mt-4 mb-3">3. Motivação para a Mudança</h4>
          
          <Form.Group className="mb-3">
            <Form.Label>Razões para a Mudança de Contabilidade</Form.Label>
            <div>
              <Form.Check
                type="checkbox"
                id="razao-insatisfacao"
                label="Insatisfação com a contabilidade anterior"
                checked={localFormInfo.razoesParaMudanca?.includes('Insatisfação com a contabilidade anterior') || false}
                onChange={() => handleRazoesChange('Insatisfação com a contabilidade anterior')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="razao-necessidade"
                label="Necessidade de mais serviços"
                checked={localFormInfo.razoesParaMudanca?.includes('Necessidade de mais serviços') || false}
                onChange={() => handleRazoesChange('Necessidade de mais serviços')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="razao-custo"
                label="Melhor custo-benefício"
                checked={localFormInfo.razoesParaMudanca?.includes('Melhor custo-benefício') || false}
                onChange={() => handleRazoesChange('Melhor custo-benefício')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="razao-outros"
                label="Outros"
                checked={localFormInfo.razoesParaMudanca?.includes('Outros') || false}
                onChange={() => handleRazoesChange('Outros')}
                className="mb-2"
              />
              
              {localFormInfo.razoesParaMudanca?.includes('Outros') && (
                <Form.Control
                  type="text"
                  placeholder="Especifique"
                  value={localFormInfo.outrosMotivos || ''}
                  onChange={(e) => handleInputChange('outrosMotivos', e.target.value)}
                  className="mt-2 mb-3"
                />
              )}
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Expectativas com a Nova Contabilidade</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={localFormInfo.expectativas || ''}
              onChange={(e) => handleInputChange('expectativas', e.target.value)}
            />
          </Form.Group>
          
          {/* 4. Histórico Contábil */}
          <h4 className="mt-4 mb-3">4. Histórico Contábil</h4>
          
          {/* NOVO: Escritório contábil anterior */}
          <Form.Group className="mb-3">
            <Form.Label>Escritório Contábil Anterior</Form.Label>
            <Form.Control
              type="text"
              value={localFormInfo.escritorioContabilAnterior || ''}
              onChange={(e) => handleInputChange('escritorioContabilAnterior', e.target.value)}
              placeholder="Nome do escritório contábil anterior"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Serviços Utilizados Anteriormente</Form.Label>
            <div>
              <Form.Check
                type="checkbox"
                id="servico-folha"
                label="Folha de pagamento"
                checked={localFormInfo.servicosAnteriores?.includes('Folha de pagamento') || false}
                onChange={() => handleServicosChange('Folha de pagamento')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="servico-contabilidade"
                label="Fiscal"
                checked={localFormInfo.servicosAnteriores?.includes('Fiscal') || false}
                onChange={() => handleServicosChange('Fiscal')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="servico-contabil"
                label="Contábil"
                checked={localFormInfo.servicosAnteriores?.includes('Contábil') || false}
                onChange={() => handleServicosChange('Contábil')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="servico-planejamento"
                label="Planejamento Tributário"
                checked={localFormInfo.servicosAnteriores?.includes('Planejamento Tributário') || false}
                onChange={() => handleServicosChange('Planejamento Tributário')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="servico-outros"
                label="Outros"
                checked={localFormInfo.servicosAnteriores?.includes('Outros') || false}
                onChange={() => handleServicosChange('Outros')}
                className="mb-2"
              />
              
              {localFormInfo.servicosAnteriores?.includes('Outros') && (
                <Form.Control
                  type="text"
                  placeholder="Especifique"
                  value={localFormInfo.outrosServicos || ''}
                  onChange={(e) => handleInputChange('outrosServicos', e.target.value)}
                  className="mt-2 mb-3"
                />
              )}
            </div>
          </Form.Group>

          {/* 5. Documentação e Processos */}
          <h4 className="mt-4 mb-3">5. Documentação e Processos</h4>

          <Form.Group className="mb-3">
            <Form.Label>Estado Atual dos Documentos Contábeis</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="documentos-atualizados"
                name="estadoDocumentos"
                label="Atualizados"
                checked={localFormInfo.estadoDocumentos === 'Atualizados'}
                onChange={() => handleInputChange('estadoDocumentos', 'Atualizados')}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="documentos-atraso"
                name="estadoDocumentos"
                label="Em atraso"
                checked={localFormInfo.estadoDocumentos === 'Em atraso'}
                onChange={() => handleInputChange('estadoDocumentos', 'Em atraso')}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="documentos-incompletos"
                name="estadoDocumentos"
                label="Incompletos"
                checked={localFormInfo.estadoDocumentos === 'Incompletos'}
                onChange={() => handleInputChange('estadoDocumentos', 'Incompletos')}
                className="mb-2"
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Responsável Interno pelo Envio de Documentos</Form.Label>
            <Row>
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="Nome"
                  value={localFormInfo.responsavelDocumentosNome || ''}
                  onChange={(e) => handleInputChange('responsavelDocumentosNome', e.target.value)}
                  className="mb-2"
                />
              </Col>
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="Cargo"
                  value={localFormInfo.responsavelDocumentosCargo || ''}
                  onChange={(e) => handleInputChange('responsavelDocumentosCargo', e.target.value)}
                  className="mb-2"
                />
              </Col>
            </Row>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Existem pendências nos relatórios e-cac e estado?</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={localFormInfo.pendenciasRelatorios || ''}
              onChange={(e) => handleInputChange('pendenciasRelatorios', e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tem Balanço / livro contábil fechado?</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="balanco-sim"
                name="temBalancoFechado"
                label="Sim"
                checked={localFormInfo.temBalancoFechado === 'Sim'}
                onChange={() => handleInputChange('temBalancoFechado', 'Sim')}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="balanco-nao"
                name="temBalancoFechado"
                label="Não"
                checked={localFormInfo.temBalancoFechado === 'Não'}
                onChange={() => handleInputChange('temBalancoFechado', 'Não')}
                className="mb-2"
              />
            </div>
          </Form.Group>

          {/* 6. Financeiro */}
          <h4 className="mt-4 mb-3">6. Financeiro</h4>
          
          <Form.Group className="mb-3">
            <Form.Label>Tem parcelamentos?</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="parcelamentos-sim"
                name="temParcelamentos"
                label="Sim"
                checked={localFormInfo.temParcelamentos === 'Sim'}
                onChange={() => handleInputChange('temParcelamentos', 'Sim')}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="parcelamentos-nao"
                name="temParcelamentos"
                label="Não"
                checked={localFormInfo.temParcelamentos === 'Não'}
                onChange={() => handleInputChange('temParcelamentos', 'Não')}
                className="mb-2"
              />
            </div>
          </Form.Group>
          
          {/* Campos de parcelamento dinâmicos */}
          {localFormInfo.temParcelamentos === 'Sim' && (
            <div className="mb-3">
              <Form.Label>Detalhes dos Parcelamentos:</Form.Label>
              {localFormInfo.parcelamentosDetalhes.map((parcelamento, index) => (
                <div key={index} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    placeholder={`Parcelamento ${index + 1}`}
                    value={parcelamento}
                    onChange={(e) => handleParcelamentoChange(index, e.target.value)}
                    className="me-2"
                  />
                  {index > 0 && (
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => removeParcelamentoField(index)}
                    >
                      -
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                variant="success" 
                size="sm" 
                onClick={addParcelamentoField}
                className="mt-2"
              >
                + Adicionar Parcelamento
              </Button>
            </div>
          )}

          {/* 7. Controle */}
          <h4 className="mt-4 mb-3">7. Controle</h4>
          
          <Form.Group className="mb-3">
            <Form.Label>Tem necessidade de controle CND?</Form.Label>
            <Form.Control
              type="text"
              value={localFormInfo.necessidadeControleCND || ''}
              onChange={(e) => handleInputChange('necessidadeControleCND', e.target.value)}
            />
          </Form.Group>

          {/* 8. Fiscal */}
          <h4 className="mt-4 mb-3">8. Fiscal</h4>
          
          {/* NOVO: Regime Tributário */}
          <Form.Group className="mb-3">
            <Form.Label>Regime Tributário</Form.Label>
            <Form.Select
              value={localFormInfo.regimeTributario || ''}
              onChange={(e) => handleInputChange('regimeTributario', e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Simples Nacional">Simples Nacional</option>
              <option value="MEI">MEI</option>
              <option value="Lucro Real">Lucro Real</option>
              <option value="Lucro Presumido">Lucro Presumido</option>
              <option value="Isenta">Isenta</option>
              <option value="Não tributada">Não tributada</option>
              <option value="Imune">Imune</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Emite NF?</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="emite-nf-sim"
                name="emiteNF"
                label="Sim"
                checked={localFormInfo.emiteNF === 'Sim'}
                onChange={() => handleInputChange('emiteNF', 'Sim')}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="emite-nf-nao"
                name="emiteNF"
                label="Não"
                checked={localFormInfo.emiteNF === 'Não'}
                onChange={() => handleInputChange('emiteNF', 'Não')}
                className="mb-2"
              />
            </div>
          </Form.Group>
          
          {/* Campos condicionais para emissão de NF */}
          {localFormInfo.emiteNF === 'Sim' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Quantas notas?</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.quantidadeNotas || ''}
                  onChange={(e) => handleInputChange('quantidadeNotas', e.target.value)}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Qual a média de faturamento?</Form.Label>
                <Form.Control
                  type="text"
                  value={localFormInfo.mediaFaturamento || ''}
                  onChange={(e) => handleInputChange('mediaFaturamento', e.target.value)}
                />
              </Form.Group>
            </>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Tem sistema de emissão de nota?</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="tem-sistema-sim"
                name="temSistemaEmissao"
                label="Sim"
                checked={localFormInfo.temSistemaEmissao === 'Sim'}
                onChange={() => handleInputChange('temSistemaEmissao', 'Sim')}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="tem-sistema-nao"
                name="temSistemaEmissao"
                label="Não"
                checked={localFormInfo.temSistemaEmissao === 'Não'}
                onChange={() => handleInputChange('temSistemaEmissao', 'Não')}
                className="mb-2"
              />
            </div>
          </Form.Group>
          
          {/* Campo condicional para sistema de emissão */}
          {localFormInfo.temSistemaEmissao === 'Sim' && (
            <Form.Group className="mb-3">
              <Form.Label>Qual o sistema?</Form.Label>
              <Form.Control
                type="text"
                value={localFormInfo.qualSistemaEmissao || ''}
                onChange={(e) => handleInputChange('qualSistemaEmissao', e.target.value)}
              />
            </Form.Group>
          )}

          {/* Observações Gerais */}
          <h4 className="mt-4 mb-3">Observações Gerais</h4>
          
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={4}
              value={localFormInfo.observacoesGerais || ''}
              onChange={(e) => handleInputChange('observacoesGerais', e.target.value)}
              placeholder="Insira observações gerais aqui..."
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {pdfGerado ? "Fechar" : "Cancelar"}
        </Button>
        {!pdfGerado && ( // NOVO: Só mostrar o botão Salvar se o PDF não foi gerado
          <Button variant="primary" onClick={handleSave}>
            Salvar
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

/**
 * Configuração do editor de texto Quill
 */
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'circle' }, { 'list': 'square' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

/**
 * Formatos permitidos no editor Quill
 */
const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'indent',
  'direction',
  'align',
];

export default App;