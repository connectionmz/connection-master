import React, { useEffect, useState } from 'react';
import { get, ref, onValue } from 'firebase/database';
import { db } from '../fb';
import { useNavigate } from 'react-router-dom';

const Explore = ({ user }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedTipoEntidade, setSelectedTipoEntidade] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);


  const defaultLogoUrl = 'https://via.placeholder.com/150';

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesRef = ref(db, 'company');
        const snapshot = await get(companiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const companyList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setCompanies(companyList);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetching provincias, sectores, and tipos de entidades
    onValue(ref(db, 'provincias'), (snapshot) => {
      setProvincias(snapshot.val() || []);
    });

    onValue(ref(db, 'sectores_de_atividade'), (snapshot) => {
      setSectores(snapshot.val() || []);
    });

    onValue(ref(db, 'tipos_entidades'), (snapshot) => {
      setTiposEntidades(snapshot.val() || []);
    });

    fetchCompanies();
  }, []);

  const filteredCompanies = companies
  .filter((company) => {
    const matchesSearch = company.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector ? company.sector === selectedSector : true;
    const matchesProvince = selectedProvince ? company.provincia === selectedProvince : true;
    const matchesTipoEntidade = selectedTipoEntidade ? company.tipoEntidade === selectedTipoEntidade : true;
    return matchesSearch && matchesSector && matchesProvince && matchesTipoEntidade;
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));

const totalCompanies = filteredCompanies.length;

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const applyFilters = () => closeModal();

  if (loading) return <div className="text-center py-6 text-gray-600">Carregando...</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-gray-700">Empresas Disponiveis</h2>
      <p className="text-gray-600 text-sm">Encontradas ({totalCompanies})</p>
    </div>
      <div className="filters flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-white rounded-lg shadow-lg mb-8">
        <input
          type="text"
          placeholder="Pesquisar empresas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/3 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={openModal}
          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Filtros
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-overlay fixed inset-0 bg-black opacity-50" onClick={closeModal}></div>
          <div className="modal-content bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Filtros</h2>
            <div className="space-y-4">
              <label className="block">
                Setor
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="block w-full mt-1 p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todos</option>
                  {sectores.map((s) => (
                    <option key={s.setor} value={s.setor}>
                      {s.setor}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Província
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="block w-full mt-1 p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todas</option>
                  {provincias.map((prov) => (
                    <option key={prov.provincia} value={prov.provincia}>
                      {prov.provincia}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Tipo de Entidade
                <select
                  value={selectedTipoEntidade}
                  onChange={(e) => setSelectedTipoEntidade(e.target.value)}
                  className="block w-full mt-1 p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todos</option>
                  {tiposEntidades.map((ent) => (
                    <option key={ent.tipo} value={ent.tipo}>
                      {ent.tipo}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={applyFilters}
                className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
              >
                Aplicar
              </button>
              <button
                onClick={closeModal}
                className="ml-2 text-gray-500 rounded-lg px-4 py-2 hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="company-list grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredCompanies.map((company) => (
        <div
          key={company.id}
          className="company-card bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={() => handleCompanyClick(company.id)}>
          <img
            src={company.logoUrl || defaultLogoUrl}
            alt={`${company.nome} logo`}
            className="h-16 w-16 object-cover mb-4 rounded-full mx-auto"
          />
          <h3 className="font-semibold text-center text-gray-800">{company.nome}</h3>
          <p className="text-gray-600 text-center"><small>{company.sector}</small></p>
        </div>
      ))}
      </div>
    </div>
  );
};

export default Explore;
