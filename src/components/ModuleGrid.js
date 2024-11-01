import { useNavigate } from 'react-router-dom';
import { FaTools, FaReceipt, FaStore, FaSms, FaChartBar, FaAd } from 'react-icons/fa'; 

const ModuleGrid = ({ activeModules }) => {
  const navigate = useNavigate(); 

  const allModules = [
    { name: 'Analytics', link: '/analytics', icon: <FaChartBar size={40} />, key: 'moduloAnalytics' },
    { name: 'Proforma', link: '/faturacao', icon: <FaReceipt size={40} />, key: 'moduloFaturacao' },
    { name: 'Market', link: '/market', icon: <FaStore size={40} />, key: 'moduloMarket' },
    { name: 'Anunciar', link: '/anunciar', icon: <FaAd size={40} />, key: 'moduloCampaign' },
    { name: 'SMS', link: '/sms', icon: <FaSms size={40} />, key: 'moduloSMS' }
  ];

  const activeModulesArray = allModules.filter(module => activeModules[module.key]);

  const handleModuleClick = (module) => {
    navigate(module.link); 
  };

  return (
    <div className="mt-6">
      <h2 className="text-gray-700 text-lg font-semibold">Módulos Ativos</h2>
      <div className="grid grid-cols-4 gap-4 mt-4">
        {activeModulesArray.length > 0 ? (
          activeModulesArray.map((module) => (
            <div
              key={module.name}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleModuleClick(module)} 
            >
              <div className="bg-gray-100 p-4 rounded-md">
                {module.icon} 
              </div>
              <p className="mt-2 text-sm text-gray-600">{module.name}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">Nenhum módulo ativo disponível.</p>
        )}
      </div>
    </div>
  );
};

export default ModuleGrid;
