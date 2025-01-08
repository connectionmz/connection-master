import React, { useState } from 'react';
import { FaSearch, FaMicrophone } from 'react-icons/fa';
import logo from '../../img/bg.png'
const ConnectionsSearchDesk = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);

    const results = [
      { id: 1, title: `Resultado para "${query}"`, description: `Descrição do resultado para "${query}".` },
      { id: 2, title: `Mais sobre "${query}"`, description: `Mais detalhes sobre "${query}" encontrados.` },
    ];

    setTimeout(() => {
      setSearchResults(results);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-900">
      <h1 className="text-6xl font-google text-blue-600 mb-8"><img src={logo}/></h1>
      
      <form onSubmit={handleSearch} className="w-full max-w-lg flex items-center bg-white border border-gray-200 rounded-full shadow-md px-4 py-2 mb-6">
        <FaSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite sua pesquisa ou fale"
          className="flex-grow px-2 py-2 focus:outline-none text-lg"
        />
        <FaMicrophone className="text-blue-500 ml-2" />
      </form>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={handleSearch}
          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
        >
          Connections Search
        </button>
        <button
          type="button"
          onClick={() => setQuery('Estou com sorte')}
          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
        >
          Estou com sorte
        </button>
      </div>

      <div className="mt-8 w-full max-w-2xl">
        {isSearching && <p className="text-center text-blue-500">Buscando...</p>}

        {searchResults.length > 0 && (
          <div>
            {searchResults.map((result) => (
              <div key={result.id} className="mb-4 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-blue-800 hover:underline cursor-pointer">{result.title}</h2>
                <p className="text-gray-600">{result.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsSearchDesk;
