import axios from 'axios';

const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`;

async function criarUsuarios(qtd) {
  for (let i = 0; i < qtd; i++) {
    try {
      const email = `teste${i}@exemplo.com`;
      const senha = 'SenhaForte123!';
      
      const response = await axios.post(url, {
        email,
        password: senha,
        returnSecureToken: true
      });
      
      console.log(`Conta criada: ${response.data.email}`);
    } catch (err) {
      if (err.response) {
        console.log('Erro ao criar conta:', err.response.data.error.message);
      } else {
        console.log('Erro desconhecido:', err.message);
      }
    }
  }
}

criarUsuarios(5);
