import { getDatabase, ref, push, set } from "firebase/database";
import { db } from '../fb';

export const saveContentToInbox = (content, idCompany, title) => {
  if (content && idCompany && title) { 
    const inboxRef = ref(db, `company/${idCompany}/inbox`);
    
    const newMessageRef = push(inboxRef);

    const newMessage = {
      title, 
      content, 
      timestamp: new Date().toISOString() 
    };

    return set(newMessageRef, newMessage)
      .then(() => {
        console.log('Mensagem salva com sucesso no inbox!');
      })
      .catch((error) => {
        console.error('Erro ao salvar a mensagem no inbox: ', error);
      });
  }
  return Promise.reject('Content, idCompany, or title is missing.');
};
