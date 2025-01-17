import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from "../../fb";
import { ref, get } from "firebase/database";
import SurveyFormDesk from './SurveyFormDesk.js';

const SurveyPageDesk = ({user}) => {
  const { surveyId } = useParams(); // Pega o ID do inquérito na URL
  const [surveyData, setSurveyData] = useState(null);

  useEffect(() => {
    // Carrega os dados do inquérito do Firebase
    const surveyRef = ref(db, `surveys/${surveyId}`);
    get(surveyRef).then(snapshot => {
      if (snapshot.exists()) {
        setSurveyData(snapshot.val());
      } else {
        console.log("Inquérito não encontrado");
      }
    });
  }, [surveyId]);

  if (!surveyData) {
    return <div>Carregando...</div>;
  }

  return <SurveyFormDesk surveyData={surveyData} user={user} surveyId={surveyId}/>;
};

export default SurveyPageDesk;
