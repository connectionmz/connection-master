import axios from "axios";

const sendMessage = async (contatos, message) => {
    const messages = contatos.map(numero => ({
        number: numero,  
        text: message     
    }));

    try {
        const data = {
            messages: messages, 
        };


        await axios.post('https://mohvi-sms.vercel.app/send-sms', data)
            .then((response) => {
                console.log(response)
            })
            .catch((error) => {
                console.log(error)
            });
    } catch (error) {
    }
};

export default sendMessage;
