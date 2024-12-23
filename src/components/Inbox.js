import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../fb';
import { Clear, DoneAll } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Inbox = () => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (user) {
      const inboxRef = ref(db, `company/${user.uid}/inbox`);
      onValue(inboxRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messagesArray = Object.keys(data)
            .map(key => ({
              id: key,
              ...data[key],
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // Ordenar por timestamp decrescente
            setMessages(messagesArray);
          console.log(messagesArray)
        }
      });
    }
  }, [user]);

  const markAsRead = (messageId) => {
    const messageRef = ref(db, `company/${user.uid}/inbox/${messageId}`);
    update(messageRef, { opened: true });
  };

  const deleteMessage = (messageId) => {
    const messageRef = ref(db, `company/${user.uid}/inbox/${messageId}`);
    remove(messageRef).then(() => {
      setMessages(prevMessages => prevMessages.filter(message => message.id !== messageId));
    }).catch((error) => {
      console.error('Error deleting message:', error);
    });
  };

  const handleOpenMessage = (message) => {
    setSelectedMessage(message);
    markAsRead(message.id);
  };

  const unreadMessages = messages.filter(message => !message.opened);
  const readMessages = messages.filter(message => message.opened);

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="font-bold mb-6">Caixa de entrada</h1>
      {selectedMessage ? (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-bold">{selectedMessage.title}</h2>
          <p>{new Date(selectedMessage.timestamp).toLocaleString()}</p>
          <p className="text-gray-600 text-lg mb-6" dangerouslySetInnerHTML={{ __html: selectedMessage.proposal }}></p>
          <p>
            <Link to={selectedMessage.content.url} rel="noopener noreferrer">
              Ir ao conteúdo
            </Link>
          </p>
          <button onClick={() => setSelectedMessage(null)} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg">Voltar</button>
        </div>
      ) : (
        <>
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-4">
              <button
                className={`py-2 px-4 border-b-2 ${tabIndex === 0 ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTabIndex(0)}
              >
                Não lidas ({unreadMessages.length})
              </button>
              <button
                className={`py-2 px-4 border-b-2 ${tabIndex === 1 ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTabIndex(1)}
              >
                Lidas ({readMessages.length})
              </button>
              <button
                className={`py-2 px-4 border-b-2 ${tabIndex === 2 ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTabIndex(2)}
              >
                Todas ({messages.length})
              </button>
            </nav>
          </div>
          <div className="tab-content">
            {tabIndex === 0 && (
              <div>
                {unreadMessages.length > 0 ? (
                  unreadMessages.map((message) => (
                    <div key={message.id} className="flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-4">
                      <div onClick={() => handleOpenMessage(message)} className="cursor-pointer">
                        <h3 className="font-bold">{message.title || 'No Title'}</h3>
                        <p className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="space-x-2">
                        <span className="text-green hover:bg-blue-600" onClick={() => markAsRead(message.id)}>
                          <DoneAll />
                        </span>
                        <span className="text-red hover:bg-red-600" onClick={() => deleteMessage(message.id)}>
                          <Clear />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Nenhuma mensagem não lida.</p>
                )}
              </div>
            )}

            {tabIndex === 1 && (
              <div>
                {readMessages.length > 0 ? (
                  readMessages.map((message) => (
                    <div key={message.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-4">
                      <div onClick={() => handleOpenMessage(message)} className="cursor-pointer">
                        <h3 className="font-semibold text-gray-700">{message.title || 'No Title'}</h3>
                        <p className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleString()}</p>
                      </div>
                      <button className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600" onClick={() => deleteMessage(message.id)}>
                        Excluir
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Nenhuma mensagem lida.</p>
                )}
              </div>
            )}

            {tabIndex === 2 && (
              <div>
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id} className={`flex justify-between items-center p-4 rounded-lg mb-4 ${message.opened ? 'bg-gray-50' : 'bg-gray-100'}`}>
                      <div onClick={() => handleOpenMessage(message)} className="cursor-pointer">
                        <h3 className={`font-${message.opened ? 'normal' : 'bold'} text-${message.opened ? 'gray-700' : 'black'}`}>
                          {message.title || 'No Title'}
                        </h3>
                        <p className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="space-x-2">
                        {!message.opened && (
                          <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600" onClick={() => markAsRead(message.id)}>
                            Marcar como lida
                          </button>
                        )}
                        <button className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600" onClick={() => deleteMessage(message.id)}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Nenhuma notificação.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Inbox;
