import React, { useEffect, useState } from 'react';

const CreditCardCheckout = () => {
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const meticalToUSD = (mzn) => {
    const exchangeRate = 63.45; 
    return (mzn / exchangeRate).toFixed(2); 
  };

  useEffect(() => {
    const loadPayPalScript = () => {
      if (!window.paypal) {
        const script = document.createElement('script');
        script.src = 'https://www.paypal.com/sdk/js?client-id=AWcsjZQEu-WVWR6db5yfR-lEL7uRrvGWfVXHcZ54CtRmcPH93Z2MJmE_0S0PZ9dfeIHLyyhVvZ-6bmpx'; // Adicione seu client-id aqui
        script.async = true;
        script.onload = () => setPaypalLoaded(true);
        document.body.appendChild(script);
      } else {
        setPaypalLoaded(true);
      }
    };

    loadPayPalScript();
  }, []);

  useEffect(() => {
    if (paypalLoaded) {
      const paypalContainer = document.getElementById('paypal-button-container');
      if (paypalContainer) {
        paypalContainer.innerHTML = ''; // Limpa o contêiner

        window.paypal.Buttons({
          createOrder: function (data, actions) {
            const mznAmount = 250; 
            const usdAmount = meticalToUSD(mznAmount); 
            
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: usdAmount, 
                },
              }],
            });
          },
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              alert('Pagamento concluído com sucesso! Transação: ' + details.id);
              console.log('Transação de sucesso: ', details);
            });
          },
          onError: function (err) {
            alert('Ocorreu um erro durante o pagamento: ' + err);
            console.error('Erro no pagamento: ', err);
          }
        }).render('#paypal-button-container');
      }
    }
  }, [paypalLoaded]);

  return (
    <div className="p-4 bg-blue-100 rounded-lg">
      <h2 className="text-lg font-semibold">Pagamento com Cartão de Débito</h2>
      <p>Insira os dados do seu cartão para concluir a compra.</p>
      
      <div id="paypal-button-container"></div>
    </div>
  );
};

export default CreditCardCheckout;
