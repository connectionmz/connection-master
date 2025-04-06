import { useNavigate } from 'react-router-dom';
import { 
  FaReceipt, 
  FaStore, 
  FaAd, 
  FaSms, 
  FaPhone, 
  FaPoll, 
  FaTruckLoading, 
  FaStar, 
  FaChartLine,
  FaUserTie 
} from 'react-icons/fa';

const ModuleGrid = ({ activeModules }) => {
  const navigate = useNavigate();

  const allModules = [
    { name: 'Proforma', link: '/faturacao', icon: <FaReceipt size={40} />, key: 'moduloProforma' },
    { name: 'Market', link: '/market', icon: <FaStore size={40} />, key: 'moduloMarket' },
    { name: 'Anunciar', link: '/anunciar', icon: <FaAd size={40} />, key: 'moduloAnunciar', alwaysEnabled: true },
    { name: 'SMS', link: '/sms', icon: <FaSms size={40} />, key: 'moduloSMS' },
    { name: 'Call Center', link: '/callcenter', icon: <FaPhone size={40} />, key: 'moduloCallCenter', alwaysEnabled: true },
    { name: 'Procurement', link: '/procurement', icon: <FaTruckLoading size={40} />, key: 'moduloProcurement', alwaysEnabled: true },
    { name: 'Inquéritos', link: '/inqueritos', icon: <FaPoll size={40} />, key: 'moduloInquerito' },
    { name: 'Análises', link: '/analises', icon: <FaChartLine size={40} />, key: 'moduloAnalises' },
    { name: 'Recrutamento', link: '/recrutamento', icon: <FaUserTie size={40} />, key: 'moduloRecrutamento', alwaysEnabled: true }
  ];
  
  const handleAcquireModule = (module) => {
    navigate(`/pagamento-modulo/${module.key}`);
  };

  const handleModuleClick = (module) => {
    if (module.alwaysEnabled || activeModules[module.key]) {
      navigate(module.link);
    } else {
      handleAcquireModule(module);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-gray-700 text-lg font-semibold">Módulos Disponíveis</h2>
      <div className="grid grid-cols-4 gap-4 mt-4">
        {allModules.map((module) => (
          <div
            key={module.name}
            className={`flex flex-col items-center cursor-pointer p-4 rounded-md transition-all duration-150 ${
              module.alwaysEnabled || activeModules[module.key] ? 'hover:bg-gray-200' : 'opacity-50 hover:bg-gray-300'
            }`}
            onClick={() => handleModuleClick(module)}
          >
            <div className="bg-gray-100 p-4 rounded-md">{module.icon}</div>
            <p className="mt-2 text-sm text-gray-600">{module.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleGrid;