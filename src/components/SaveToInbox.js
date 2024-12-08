import { getDatabase, ref, push, set, get } from "firebase/database";
import { db } from '../fb';
import { SaveLogError } from "../utils/SaveLogError";


export const saveContentToInbox = (content, idCompany, title) => {
  if (!content || !idCompany || !title) {
    return Promise.reject('Content, idCompany, or title is missing.');
  }

  const inboxRef = ref(db, `company/${idCompany}/inbox`);

  return get(inboxRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const existingMessages = snapshot.val();

        const isDuplicate = Object.values(existingMessages).some(
          (message) => message.title === title.trim() || message.content === content.trim()
        );

        if (isDuplicate) {

          SaveLogError('savetoInbox','Mensagem duplicada detectada. Não será salva novamente.')
          return Promise.resolve('Mensagem duplicada detectada.');
        }
      }

      const newMessageRef = push(inboxRef);
      const newMessage = {
        title: title.trim(),
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      return set(newMessageRef, newMessage).then(() => {
        console.log('Mensagem salva com sucesso no inbox!');
      });
    })
    .catch((error) => {
      console.error('Erro ao verificar ou salvar a mensagem no inbox: ', error);
      SaveLogError('savetoInbox','Erro ao verificar ou salvar a mensagem no inbox: '+ error)

      return Promise.reject(error);
    });
};


export const saveContentToInboxBasedSector = (content, idCompany, title, sector) => {
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
        SaveLogError('savetoInbox','Erro ao verificar ou salvar a mensagem no inbox: '+ error)

      });
  }
  return Promise.reject('Content, idCompany, or title is missing.');
};
