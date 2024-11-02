import React, { useState, useEffect } from 'react';
import { ref, set, push, onValue } from 'firebase/database';
import { db } from '../fb';

const InquiryResponse = ({ inquiry, handleResponse }) => {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const responsesRef = ref(db, `inquiries/${inquiry.id}/responses`);
    onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      const responseList = data ? Object.values(data) : [];
      setResponses(responseList);
    });
  }, [inquiry.id]);

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold">{inquiry.title}</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const userAnswers = inquiry.questions.map(q => {
          const answer = document.querySelector(`#${inquiry.id}-${q.question}`)?.value || '';
          return answer;
        });
        handleResponse(inquiry.id, "user1", userAnswers); // substitua "user1" pelo ID do usuário real
      }}>
        {inquiry.questions.map((q, index) => (
          <div key={index} className="mb-4">
            <label className="block text-gray-700">{q.question}</label>
            {q.type === 'open' && (
              <input
                type="text"
                id={`${inquiry.id}-${q.question}`}
                className="border rounded-md p-2 w-full"
                required
              />
            )}
            {q.type === 'multiple' && (
              <select id={`${inquiry.id}-${q.question}`} className="border rounded-md p-2 w-full">
                {q.options.map((option, optionIndex) => (
                  <option key={optionIndex} value={option}>{option}</option>
                ))}
              </select>
            )}
          </div>
        ))}
        <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded">
          Enviar Respostas
        </button>
      </form>
    </div>
  );
};

const InqueritosModule = () => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', type: 'open', options: [''], required: false }
  ]);
  const [inquiries, setInquiries] = useState([]);

  useEffect(() => {
    const inquiriesRef = ref(db, 'inquiries');
    onValue(inquiriesRef, (snapshot) => {
      const data = snapshot.val();
      const inquiriesList = data ? Object.values(data) : [];
      setInquiries(inquiriesList);
    });
  }, []);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].question = value;
    setQuestions(updatedQuestions);
  };

  const handleTypeChange = (index, type) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].type = type;
    updatedQuestions[index].options = type === 'multiple' ? [''] : [];
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', type: 'open', options: [''], required: false }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newInquiryRef = push(ref(db, 'inquiries'));
      await set(newInquiryRef, {
        title,
        questions,
      });
      alert('Inquérito publicado com sucesso!');
      setTitle('');
      setQuestions([{ question: '', type: 'open', options: [''], required: false }]);
    } catch (error) {
      console.error('Erro ao salvar o inquérito:', error);
    }
  };

  const handleResponse = async (inquiryId, userId, answers) => {
    try {
      const responseRef = push(ref(db, `inquiries/${inquiryId}/responses`));
      await set(responseRef, {
        userId,
        answers,
      });
      alert('Respostas enviadas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar as respostas:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Inquéritos - Criação e Publicação</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Título do Inquérito:</label>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="border rounded-md p-2 w-full"
            required
          />
        </div>

        {questions.map((q, index) => (
          <div key={index} className="mb-4 border rounded p-4">
            <label className="block text-gray-700">Pergunta {index + 1}:</label>
            <input
              type="text"
              value={q.question}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
              className="border rounded-md p-2 w-full"
              required
            />
            <div className="mt-2">
              <label className="block text-gray-700">Tipo de Pergunta:</label>
              <select
                value={q.type}
                onChange={(e) => handleTypeChange(index, e.target.value)}
                className="border rounded-md p-2"
              >
                <option value="open">Aberta</option>
                <option value="multiple">Múltipla Escolha</option>
                <option value="scale">Escala de 1 a 5</option>
              </select>
            </div>

            {q.type === 'multiple' && (
              <div>
                {q.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center mt-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                      className="border rounded-md p-2 w-full mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index, optionIndex)}
                      className="text-red-500 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(index)}
                  className="text-blue-500 hover:underline"
                >
                  Adicionar Opção
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
        >
          Adicionar Pergunta
        </button>
        
        <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded">
          Publicar Inquérito
        </button>
      </form>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Inquéritos Existentes</h2>
      {inquiries.map((inquiry, index) => (
        <div key={index} className="border rounded p-4 mb-4">
          <InquiryResponse inquiry={inquiry} handleResponse={handleResponse} />
        </div>
      ))}
    </div>
  );
};

export default InqueritosModule;
