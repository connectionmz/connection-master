import React from 'react';
import { useState } from "react";
import { Menu, X } from "lucide-react"

const LandingPage = () => {

  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-gray-100 font-sans">
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">UIXSHUVO</h1>
        
        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-gray-700">
          <li className="font-semibold text-black px-4 py-2 rounded-lg bg-black text-white">Home</li>
          <li className="hover:text-black transition">About</li>
          <li className="hover:text-black transition">Service</li>
          <li className="hover:text-black transition">Portfolio</li>
          <li className="hover:text-black transition">Clients</li>
        </ul>
        
        <button className="hidden md:block bg-yellow-400 px-4 py-2 rounded-lg font-semibold text-black hover:bg-yellow-500 transition">
          We're Hiring
        </button>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <ul className="md:hidden flex flex-col items-center space-y-4 bg-white p-4 border-t shadow-md">
          <li className="text-black font-semibold">Home</li>
          <li className="hover:text-black transition">About</li>
          <li className="hover:text-black transition">Service</li>
          <li className="hover:text-black transition">Portfolio</li>
          <li className="hover:text-black transition">Clients</li>
          <button className="bg-yellow-400 px-4 py-2 rounded-lg font-semibold text-black hover:bg-yellow-500 transition">
            We're Hiring
          </button>
        </ul>
      )}
    </nav>

      <div className="bg-gray-50 py-16 px-6 md:px-12 lg:px-24 flex flex-col lg:flex-row items-center">
      {/* Esquerda */}
      <div className="lg:w-1/2 text-center lg:text-left">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Unlocking the Power of Your Brand.
        </h2>
        <p className="text-gray-600 mb-6">
          Where Vision Meets Identity. Empowering Brands for a Bold Tomorrow.
        </p>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg">
          Get Connected
        </button>
      </div>

      {/* Direita */}
      <div className="lg:w-1/2 flex flex-col gap-6 mt-10 lg:mt-0">
        <div className="relative">
          <img
            src="/mnt/data/3c94e798889da3d04ba97d828014b784.jpg"
            alt="Working"
            className="rounded-lg shadow-lg w-full h-auto object-cover"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-900">10+</h3>
            <p className="text-gray-600">Years Experience</p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-900">600+</h3>
            <p className="text-gray-600">Projects Done</p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-900">800+</h3>
            <p className="text-gray-600">Happy Clients</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default LandingPage;