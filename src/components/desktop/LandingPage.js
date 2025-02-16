import React from 'react';

const LandingPage = () => {
  return (
    <div className="bg-gray-100 font-sans">
      {/* Header Section */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-gray-800">UNASHUVO</div>
            <nav className="hidden md:flex space-x-10">
              <a href="#" className="text-gray-800 hover:text-gray-600">About</a>
              <a href="#" className="text-gray-800 hover:text-gray-600">Search</a>
              <a href="#" className="text-gray-800 hover:text-gray-600">Purchase</a>
              <a href="#" className="text-gray-800 hover:text-gray-600">Cleans</a>
              <a href="#" className="text-gray-800 hover:text-gray-600">Videos</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Where Vision Meets Identity, Empowering Brands for a Bold Tomorrow.
          </h1>
          <p className="text-xl mb-8">Our working podcast</p>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <span className="text-3xl font-bold">10+</span>
              <p>Years of Experience</p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold">800+</span>
              <p>Projects Done</p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold">800+</span>
              <p>Happy Clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">Graphic Design</h3>
              <p className="text-gray-700">
                Where Vision Meets Identity, Empowering Brands for a Bold Tomorrow.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">UI/UX Design</h3>
              <p className="text-gray-700">
                Where Vision Meets Identity, Empowering Brands for a Bold Tomorrow.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">Development</h3>
              <p className="text-gray-700">
                Where Vision Meets Identity, Empowering Brands for a Bold Tomorrow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="bg-gray-800 text-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Our Projects</h2>
          <p className="text-center text-xl mb-8">
            Building Brands That Stand the Test of Time
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Project items go here */}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2023 UNASHUVO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;