import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, onValue, push, ref, set, update } from 'firebase/database';
import { auth, db } from '../fb';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';

const CompanyDataForm = () => {
  const navigate = useNavigate();

  const [companyData, setCompanyData] = useState({
    nome: '',
    nuit: '',
    contacto: '',
    endereco: '',
    provincia: '',
    distrito: '',
    logo: null,
    sector: '',
    subsectores: [],
    tipoEntidade: '',
    subtipoEntidade: '',
    capacidadeProducao: '', // Adicionado para setores específicos
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [subsectores, setSubsectores] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [subtiposEntidade, setSubtiposEntidade] = useState([]);

  // Lista de setores que exigem Capacidade de Produção
  const sectoresComCapacidade = [
    'Recursos Naturais',
    'Indústria e Comércio',
    'Agronegócio',
    'Energia',
    'Água e Saneamento',
  ];

  useEffect(() => {
    // Carregar os dados iniciais
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const tipoEntidadeRef = ref(db, 'tipos_entidades');

    onValue(provinciasRef, (snapshot) => setProvincias(snapshot.val() || []));
    onValue(sectoresRef, (snapshot) => setSectores(snapshot.val() || []));
    onValue(tipoEntidadeRef, (snapshot) => setTiposEntidades(snapshot.val() || []));
  }, []);


  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
  
    // Atualiza a província selecionada e reseta o distrito
    setCompanyData((prevData) => ({
      ...prevData,
      provincia: selectedProvince,
      distrito: '', // Limpa o distrito
    }));
  
    // Encontra os distritos com base na província selecionada
    const foundProvince = provincias.find((prov) => prov.provincia === selectedProvince);
    setDistritos(foundProvince ? foundProvince.distritos : []);
  };
  
  const handleEntidadeChange = (e) => {
    const selectedTipoEntidade = e.target.value;
  
    // Atualiza o tipo de entidade e reseta o subtipo de entidade
    setCompanyData((prevData) => ({
      ...prevData,
      tipoEntidade: selectedTipoEntidade,
      subtipoEntidade: '', // Limpa o subtipo de entidade
    }));
  
    // Encontra os subtipos com base no tipo selecionado
    const foundEntidade = tiposEntidades.find((ent) => ent.tipo === selectedTipoEntidade);
    setSubtiposEntidade(foundEntidade ? foundEntidade.subtipos : []);
  };
  
  // Manipular mudanças nos campos gerais
  const handleChange = (e) => {
    const { name, value, type, files, multiple, options } = e.target;
    const newValue =
      type === 'file'
        ? files[0]
        : multiple
        ? Array.from(options)
            .filter((option) => option.selected)
            .map((option) => option.value)
        : value;

    setCompanyData((prevData) => ({ ...prevData, [name]: newValue }));
  };

  // Manipular mudança no setor
  const handleSectorChange = (e) => {
    const selectedSector = e.target.value;
    setCompanyData((prevData) => ({
      ...prevData,
      sector: selectedSector,
      subsectores: [],
      capacidadeProducao: '', // Limpa o campo ao mudar setor
    }));

    const foundSector = sectores.find((s) => s.setor === selectedSector);
    setSubsectores(foundSector ? foundSector.subsectores : []);
  };

  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (user) {
        let logoUrl = '';

        // Upload da imagem para o Firebase Storage
        if (companyData.logo) {
          const storage = getStorage();
          const fileRef = storageRef(storage, `logos/${user.uid}`);
          await uploadBytes(fileRef, companyData.logo);
          logoUrl = await getDownloadURL(fileRef);
        }

        const dataToSave = {
          ...companyData,
          id: user.uid,
          logoUrl,
          createdAt: new Date().toISOString(),
        };

        // Salvar no Realtime Database
        await set(ref(db, `company/${user.uid}`), dataToSave);
        await push(ref(db, `subscriptions/${user.uid}`), { status: 'active' });

        alert('Dados salvos com sucesso!');
        navigate('/dashboard');
      } else {
        throw new Error('Usuário não autenticado');
      }
    } catch (error) {
      setErrorMessage('Ocorreu um erro ao enviar os dados. Tente novamente.');
      console.error('Erro no handleSubmit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles =
    'mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500';


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl">
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-700">Complete o perfil da Empresa</h2>
        {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="nome" className="block text-sm font-medium text-gray-600">Nome da Empresa</label>
              <input 
                type="text" 
                id="nome" 
                name="nome" 
                value={companyData.nome} 
                onChange={handleChange} 
                required 
                className={inputStyles}
              />
            </div>
            <div className="form-group">
              <label htmlFor="nuit" className="block text-sm font-medium text-gray-600">NUIT</label>
              <input 
                type="text" 
                id="nuit" 
                name="nuit" 
                value={companyData.nuit} 
                onChange={handleChange} 
                required 
                className={inputStyles}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contacto" className="block text-sm font-medium text-gray-600">Contacto</label>
              <input 
                type="text" 
                id="contacto" 
                name="contacto" 
                value={companyData.contacto} 
                onChange={handleChange} 
                required 
                className={inputStyles}
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-600">
            Setor<span className="text-red-500">*</span>
            <select name="sector" value={companyData.sector} onChange={handleSectorChange} required className={inputStyles}>
              <option value="">Selecione o setor</option>
              {sectores.map((s) => (
                <option key={s.setor} value={s.setor}>
                  {s.setor}
                </option>
              ))}
            </select>
          </label>

          {/* Campo Dinâmico: Capacidade de Produção */}
          {sectoresComCapacidade.includes(companyData.sector) && (
            <div className="mt-4">
              <label htmlFor="capacidadeProducao" className="block text-sm font-medium text-gray-600">
                Capacidade de Produção<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="capacidadeProducao"
                name="capacidadeProducao"
                value={companyData.capacidadeProducao}
                onChange={handleChange}
                placeholder="Informe a capacidade de produção"
                required
                className={inputStyles}
              />
            </div>
          )}

          
          {subsectores.length > 0 && (
            <label className="block mt-4 text-sm font-medium text-gray-600">
              Subsetores
              <select
                name="subsectores"
                multiple
                value={companyData.subsectores}
                onChange={handleChange}
                className={inputStyles}
              >
                <option value="">Selecione os subsetores</option>
                {subsectores.map((sub, index) => (
                  <option key={index} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </label>
          )}
   <label className="block mt-4 text-sm font-medium text-gray-600">
            Tipo de Entidade
            <select name="tipoEntidade" value={companyData.tipoEntidade} onChange={handleEntidadeChange} required className={inputStyles}>
              <option value="">Selecione o tipo de entidade</option>
              {tiposEntidades.map((ent) => (
                <option key={ent.tipo} value={ent.tipo}>
                  {ent.tipo}
                </option>
              ))}
            </select>
          </label>

          {subtiposEntidade.length > 0 && (
            <label className="block mt-4 text-sm font-medium text-gray-600">
              Subtipo de Entidade
              <select name="subtipoEntidade" value={companyData.subtipoEntidade} onChange={handleChange} required className={inputStyles}>
                <option value="">Selecione o subtipo</option>
                {subtiposEntidade.map((sub, index) => (
                  <option key={index} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="form-group">
              <label htmlFor="endereco" className="block text-sm font-medium text-gray-600">Endereço</label>
              <input 
                type="text" 
                id="endereco" 
                name="endereco" 
                value={companyData.endereco} 
                onChange={handleChange} 
                required 
                className={inputStyles}
              />
            </div>
          <div className="form-group mt-4">
            <label htmlFor="provincia" className="block text-sm font-medium text-gray-600">Província</label>
            <select 
              id="provincia" 
              name="provincia" 
              value={companyData.provincia} 
              onChange={handleProvinceChange} 
              required
              className={inputStyles}
            >
              <option value="">Selecione uma Província</option>
              {provincias.map((prov, index) => (
                <option key={index} value={prov.provincia}>{prov.provincia}</option>
              ))}
            </select>
          </div>

          <div className="form-group mt-4">
            <label htmlFor="distrito" className="block text-sm font-medium text-gray-600">Distrito</label>
            <select 
              id="distrito" 
              name="distrito" 
              value={companyData.distrito} 
              onChange={handleChange} 
              required
              className={inputStyles}
            >
              <option value="">Selecione um Distrito</option>
              {distritos.map((dist, index) => (
                <option key={index} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
</div>  
          <div className="mt-4 form-group">
            <label htmlFor="logo" className="block text-sm font-medium text-gray-600">Logótipo da Empresa</label>
            <input 
              type="file" 
              id="logo" 
              name="logo" 
              accept="image/*" 
              onChange={handleChange} 
              required 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button 
            type="submit" 
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            disabled={isLoading}
          >
            {isLoading ? 'Aguardar...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyDataForm;
