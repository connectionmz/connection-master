import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../fb';

const CreateUsers = () => {
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);

    const fetchCompanies = async () => {
        try {
            const companiesRef = ref(db, 'company');
            const snapshot = await get(companiesRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                const companyList = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
                setCompanies(companyList);

                // Criar usuários para cada empresa
                for (const company of companyList) {
                    if (company.email) {
                        const randomPassword = Math.floor(100000 + Math.random() * 900000).toString(); // Gera senha numérica de 6 dígitos
                        try {
                            const userCredential = await createUserWithEmailAndPassword(
                                auth,
                                company.email,
                                company.password
                            );

                            console.log(`Usuário criado para ${company.email}:`, userCredential.user);

                     
                        } catch (error) {
                            console.error(`Erro ao criar usuário para ${company.email}:`, error.message);
                        }
                    } else {
                        console.warn(`Empresa ${company.id} não possui email.`);
                    }
                }
            } else {
                console.log('Nenhuma empresa encontrada.');
            }
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    return (
        <div>
            {loading ? (
                <p>Carregando...</p>
            ) : (
                <p>Usuários criados para todas as empresas com email válido.</p>
            )}
        </div>
    );
};

export default CreateUsers;
