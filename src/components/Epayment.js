import axios from "axios";

const Payment = () =>{

    const requestToken  = () =>{
     
        
        axios.post('https://e2payments.explicador.co.mz/oauth/token',
            {
            grant_type: 'client_credentials',
            client_id: '9c8f1179-66ce-44bb-999d-e292f62e1860',
            client_secret: 'zOprXuRQzJaKuM27LhZjKxzlJsLcCHWrPMVnIWh1'
            }).then(function (response) {
           console.log(response.data)// Armazendo o token de acesso no browser, veja o Exemplo 03, na sessão que segue. 
            }).catch(function (err) {
            console.log('token error',err);
            });


    }


    requestToken()

    return(<>Payment</>)

}
export default Payment