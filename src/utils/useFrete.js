// hooks/useFrete.js
import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../fb';

const useFrete = () => {
  const [tarifas, setTarifas] = useState({});
  const [cidades, setCidades] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDadosFrete = async () => {
      try {
        // Buscar tarifas da base de dados
        const tarifasRef = ref(db, 'tarifas');
        const cidadesRef = ref(db, 'cidades');
        
        const [tarifasSnapshot, cidadesSnapshot] = await Promise.all([
          get(tarifasRef),
          get(cidadesRef)
        ]);

        if (tarifasSnapshot.exists()) {
          setTarifas(tarifasSnapshot.val());
        }

        if (cidadesSnapshot.exists()) {
          setCidades(cidadesSnapshot.val());
        }
      } catch (error) {
        console.error('Erro ao buscar dados de frete:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDadosFrete();
  }, []);

  const calcularFrete = (origem, destino, pesoTotal) => {
    if (!tarifas || Object.keys(tarifas).length === 0) {
      return { error: 'Dados de frete não disponíveis' };
    }

    if (!origem || !destino) {
      return { error: 'Origem e destino são obrigatórios' };
    }

    // Encontrar tarifa para a rota específica
    const tarifaEncontrada = Object.values(tarifas).find(tarifa => 
      tarifa.origem === origem && 
      tarifa.destino === destino && 
      tarifa.ativa !== false
    );

    if (!tarifaEncontrada) {
      return { error: 'Frete não disponível para esta rota' };
    }

    // Determinar faixa de preço baseada no peso total
    let precoPorKg;
    if (pesoTotal >= 1000) {
      precoPorKg = tarifaEncontrada.precos['+1000'];
    } else if (pesoTotal >= 500) {
      precoPorKg = tarifaEncontrada.precos['+500'];
    } else if (pesoTotal >= 250) {
      precoPorKg = tarifaEncontrada.precos['+250'];
    } else {
      precoPorKg = tarifaEncontrada.precos['+100'];
    }

    if (!precoPorKg) {
      return { error: 'Faixa de peso não suportada' };
    }

    const custoFrete = precoPorKg * pesoTotal;
    const iva = tarifaEncontrada.ivaIncluido ? 0 : custoFrete * 0.17;

    return {
      custoFrete,
      iva,
      total: custoFrete + iva,
      precoPorKg,
      pesoTotal,
      tempoEntrega: tarifaEncontrada.tempoEntrega,
      transportadora: tarifaEncontrada.transportadora,
      tipoServico: tarifaEncontrada.tipoServico,
      success: true
    };
  };

  return {
    tarifas,
    cidades,
    loading,
    calcularFrete
  };
};

export default useFrete;