import React from 'react';

const Sobre = () => {
  return (
    <div className="bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-8">
        {/* Título */}
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Sobre a Plataforma</h2>

        {/* Histórico */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Histórico</h3>
          <p className="text-gray-700 leading-relaxed">
            A plataforma foi criada em [ano de fundação] com o objetivo de [objetivo principal]. Desde então, temos
            trabalhado continuamente para oferecer [soluções/serviços específicos] que atendam às necessidades dos
            nossos usuários. Nossa trajetória reflete um compromisso com a inovação, qualidade e satisfação do cliente.
          </p>
        </div>

        {/* Missão */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Missão</h3>
          <p className="text-gray-700 leading-relaxed">
            Nossa missão é [descreva a missão da plataforma]. Buscamos [resultado esperado], impactando positivamente
            [beneficiários ou comunidades].
          </p>
        </div>

        {/* Visão */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Visão</h3>
          <p className="text-gray-700 leading-relaxed">
            Ser reconhecidos como [descrição do objetivo futuro ou posição de mercado], promovendo [benefício ou
            impacto esperado] para nossos usuários.
          </p>
        </div>

        {/* Valores */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Valores</h3>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed">
            <li><strong>Inovação:</strong> Buscamos constantemente novas formas de resolver problemas e oferecer
              soluções criativas.</li>
            <li><strong>Compromisso:</strong> Estamos comprometidos com a excelência e a satisfação do usuário.</li>
            <li><strong>Transparência:</strong> Valorizamos a confiança e mantemos uma comunicação aberta e honesta.</li>
            <li><strong>Inclusão:</strong> Acreditamos que a diversidade fortalece nossa comunidade.</li>
          </ul>
        </div>

        {/* Conclusão */}
        <div className="mt-6 text-center">
          <p className="text-gray-700">
            Estamos constantemente evoluindo para oferecer a melhor experiência possível. Obrigado por fazer parte da
            nossa jornada!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sobre;
