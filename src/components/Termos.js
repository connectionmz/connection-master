const Terms = () => {
    return (
      <div className="p-6 bg-gray-100 text-gray-800">
        <h1 className="text-3xl font-bold mb-4">Termos de Uso da Plataforma Connections</h1>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">1. Aceitação dos Termos</h2>
          <p>
            Ao utilizar a plataforma Connections, os utilizadores concordam com os presentes Termos de Uso, que regem o uso
            dos serviços oferecidos, como pedidos de cotação e participação em concursos públicos.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">2. Descrição dos Serviços</h2>
          <p>
            Connections facilita a conexão entre empresas do setor público e privado em Moçambique, permitindo interações
            comerciais como pedidos de cotação e concursos públicos.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">3. Regras de Utilização</h2>
          <ul className="list-disc list-inside">
            <li>Os utilizadores devem fornecer informações precisas ao criar contas e utilizar os serviços.</li>
            <li>É proibido uso indevido da plataforma, envio de spam, práticas de hacking ou qualquer ação que comprometa a integridade da plataforma.</li>
          </ul>
        </section>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">4. Coleta de Dados</h2>
          <p>
            Recolhemos dados como nome, email, NUIT, contacto, endereço e logotipo das empresas, conforme detalhado na{' '}
            <a href="/privacy" className="text-blue-500 hover:underline">Política de Privacidade</a>.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">5. Limitação de Responsabilidade</h2>
          <p>
            A Connections não se responsabiliza por danos causados por falhas no serviço ou pelo uso indevido da plataforma.
            A responsabilidade será limitada conforme permitido pela lei aplicável.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">6. Cancelamento ou Suspensão de Contas</h2>
          <p>
            O cancelamento de contas requer uma justificativa plausível e será analisado caso a caso.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">7. Pagamentos e Política de Reembolso</h2>
          <p>
            Os pagamentos são feitos mediante acordo entre as empresas. Em situações de dificuldade no acesso à plataforma,
            os reembolsos podem ser realizados na forma de outros serviços dentro da plataforma. Para reembolsos monetários,
            até 60% do valor poderá ser devolvido.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">8. Alterações aos Termos</h2>
          <p>
            Os Termos de Uso podem ser alterados, com notificação prévia aos utilizadores através da plataforma.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">9. Informações Legais</h2>
          <p>
            A sede da Connections está localizada em Pemba, Av. 25 de setembro, Moçambique. As disputas relacionadas ao uso
            da plataforma serão resolvidas sob a jurisdição das leis de Moçambique.
          </p>
        </section>
      </div>
    );
  };
  
  export default Terms;
  