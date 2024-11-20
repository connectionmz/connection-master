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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [subsectores, setSubsectores] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [subtiposEntidade, setSubtiposEntidade] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('-OAdf-ytJBr1y8KFk328'); 
  const [selectedMetodo, setSelectedMetodo] = useState('cash'); 
  const [recorrente, setRecorrente] = useState(false); 


  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const tipoEntidadeRef = ref(db, 'tipos_entidades');

    onValue(provinciasRef, (snapshot) => setProvincias(snapshot.val() || []));
    onValue(sectoresRef, (snapshot) => setSectores(snapshot.val() || []));
    onValue(tipoEntidadeRef, (snapshot) => setTiposEntidades(snapshot.val() || []));
  }, []);

  
  const fetchPlanos = async () => {
    const planosRef = ref(db, `planos`);
    try {
      const planosSnapshot = await get(planosRef);
      const planosData = planosSnapshot.val();

      if (planosData) {
        const planosArray = Object.keys(planosData).map((key) => ({
          id: key,
          ...planosData[key],
        }));
        setPlanos(planosArray);
      } else {
        console.log("Nenhum plano encontrado.");
      }
    } catch (error) {
      console.error("Erro ao obter os planos:", error);
    } 
  };

  const handleSectorChange = (e) => {
    const selectedSector = e.target.value;
    setCompanyData((prevData) => ({ ...prevData, sector: selectedSector, subsectores: [] }));
    const foundSector = sectores.find(s => s.setor === selectedSector);
    setSubsectores(foundSector ? foundSector.subsectores : []);
  };

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setCompanyData((prevData) => ({ ...prevData, provincia: selectedProvince, distrito: '' }));
    const foundProvince = provincias.find(prov => prov.provincia === selectedProvince);
    setDistritos(foundProvince ? foundProvince.distritos : []);
  };

  const handleEntidadeChange = (e) => {
    const selectedTipoEntidade = e.target.value;
    setCompanyData((prevData) => ({ ...prevData, tipoEntidade: selectedTipoEntidade, subtipoEntidade: '' }));
    const foundEntidade = tiposEntidades.find(ent => ent.tipo === selectedTipoEntidade);
    setSubtiposEntidade(foundEntidade ? foundEntidade.subtipos : []);
  };

  const handleChange = (e) => {
    const { name, value, type, files, multiple, options } = e.target;
    const newValue = type === 'file' ? files[0] : multiple ? Array.from(options).filter(option => option.selected).map(option => option.value) : value;
    setCompanyData((prevData) => ({ ...prevData, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      const user = auth.currentUser;
      if (user) {
        let logoUrl = '';
        if (companyData.logo) {
          const storage = getStorage();
          const fileRef = storageRef(storage, `logos/${user.uid}`);
          await uploadBytes(fileRef, companyData.logo);
          logoUrl = await getDownloadURL(fileRef);
        }
  
        const planoSelecionado = planos.find((plano) => plano.id === selectedPlan);
        const currentDate = new Date();
        const expiryDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1)).toISOString().split('T')[0];
  
        const dataWithLogoUrl = {
          ...companyData,
          id: user.uid,
          logoUrl,
          subscriptions: {
            plan: {
              name: planoSelecionado?.name,
              price: planoSelecionado?.price,
              modules: planoSelecionado?.modules,
              duration: '1 mês',
            },
            payment: { amount: planoSelecionado?.price, method: selectedMetodo },
            status: 'active',
            expiryDate,
            recurring: recorrente,
          },
          activeModules: planoSelecionado?.modules,
        };
  
        // Salva os dados da empresa e da assinatura no Firebase
        await set(ref(db, `company/${user.uid}`), dataWithLogoUrl);
        await push(ref(db, `subscriptions/${user.uid}`), dataWithLogoUrl.subscriptions);
  
        alert('Dados salvos e pagamento realizado com sucesso!');
        // navigate('/pricing');
  
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
  

 
  fetchPlanos()

  const inputStyles = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";


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

          <label className="block mt-4 text-sm font-medium text-gray-600">
            Setor<span style={{ color: 'red' }}>*</span>
            <select name="sector" value={companyData.sector} onChange={handleSectorChange} required className={inputStyles}>
              <option value="">Selecione o setor</option>
              {sectores.map((s) => (
                <option key={s.setor} value={s.setor}>
                  {s.setor}
                </option>
              ))}
            </select>
          </label>
          
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
