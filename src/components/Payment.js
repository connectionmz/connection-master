import { useNavigate } from 'react-router-dom';

const Payment = () => {
  const navigate = useNavigate();

  const handlePlanSelection = (plan) => {
    navigate(`/checkout/${plan}`); // Redireciona para a página de checkout com o plano escolhido
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Escolha o seu plano</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Pacote Básico */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800">Básico</h2>
            <p className="mt-4 text-gray-500">Plano ideal para pequenas empresas.</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-800">250 MZN</span>
              <span className="text-gray-500">/ mês</span>
            </div>
            <ul className="mt-6 space-y-4 text-gray-600">
              <li>Módulo SMS - 20 mensagens</li>
            </ul>
            <button 
              className="mt-8 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition duration-200"
              onClick={() => handlePlanSelection('Basico')}
            >
              Escolher Plano
            </button>
          </div>

          {/* Pacote Pro */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800">Pro</h2>
            <p className="mt-4 text-gray-500">Plano recomendado para médias empresas.</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-800">500 MZN</span>
              <span className="text-gray-500">/ mês</span>
            </div>
            <ul className="mt-6 space-y-4 text-gray-600">
              <li>Módulo SMS - 50 mensagens</li>
              <li>Módulo de Faturação</li>
            </ul>
            <button 
              className="mt-8 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition duration-200"
              onClick={() => handlePlanSelection('Pro')}
            >
              Escolher Plano
            </button>
          </div>

          {/* Pacote Premium */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800">Premium</h2>
            <p className="mt-4 text-gray-500">Para grandes empresas e soluções avançadas.</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-800">750 MZN</span>
              <span className="text-gray-500">/ mês</span>
            </div>
            <ul className="mt-6 space-y-4 text-gray-600">
              <li>Módulo de Faturação</li>
              <li>Market</li>
              <li>Relatórios Analíticos</li>
            </ul>
            <button 
              className="mt-8 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition duration-200"
              onClick={() => handlePlanSelection('Premium')}
            >
              Escolher Plano
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
