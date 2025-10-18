import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaRegFolder,
  FaTools,
  FaAd,
  FaImage,
  FaCog,
  FaDatabase,
  FaChevronDown,
} from "react-icons/fa";

const Sidebar = ({ isOpen, setIsOpen, setCategory }) => {
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-[#1a1d24] text-white p-5 z-50 transform transition-transform duration-300 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center justify-between mb-6 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h2 className="text-3xl font-bold">Brandpeak</h2>
        </div>

        {/* Divider below Brand name */}
        <div className="border-b border-gray-700 mb-6"></div>

        {/* Navigation */}
        <nav className="space-y-6">
          {/* Top Section */}
          <ul className="space-y-5">
            <li className="group cursor-pointer flex items-center gap-8 text-lg font-semibold font-sans hover:text-green-400 transition-all duration-300">
              <FaTools className="group-hover:text-green-400 transition-colors duration-300" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                Data & Tools
              </span>
            </li>
            <li className="group cursor-pointer flex items-center gap-8 text-lg font-semibold font-sans hover:text-green-400 transition-all duration-300">
              <FaRegFolder className="group-hover:text-green-400 transition-colors duration-300" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                Campaigns
              </span>
            </li>
            <li className="group cursor-pointer flex items-center gap-8 text-lg font-semibold font-sans hover:text-green-400 transition-all duration-300">
              <FaAd className="group-hover:text-green-400 transition-colors duration-300" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                Adsets
              </span>
            </li>
            <li className="group cursor-pointer flex items-center gap-8 text-lg font-semibold font-sans hover:text-green-400 transition-all duration-300">
              <FaAd className="group-hover:text-green-400 transition-colors duration-300" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                Ads
              </span>
            </li>
          </ul>

          {/* Templates Section */}
          <ul className="space-y-5 pt-4">
            <li
              className="group cursor-pointer flex items-center gap-4 text-xl font-bold font-sans text-white transition-all duration-300"
              onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
            >
              <FaImage className="group-hover:text-green-400 transition-colors duration-300" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                Templates
              </span>
              <FaChevronDown
                className={`ml-auto transition-transform ${
                  isTemplatesOpen ? "rotate-180" : ""
                }`}
              />
            </li>

            {isTemplatesOpen && (
              <ul className="pl-7 space-y-5">
                <li className="group cursor-pointer flex items-center gap-4 text-lg font-medium hover:text-green-400 transition-all duration-300">
                  <FaCog className="group-hover:text-green-400 transition-colors duration-300" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    Client Pages Config
                  </span>
                </li>
                <li className="group cursor-pointer flex items-center gap-4 text-lg font-medium hover:text-green-400 transition-all duration-300">
                  <FaDatabase className="group-hover:text-green-400 transition-colors duration-300" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    Facebook Data
                  </span>
                </li>
                <li className="group cursor-pointer flex items-center gap-4 text-lg font-medium hover:text-green-400 transition-all duration-300">
                  <FaCog className="group-hover:text-green-400 transition-colors duration-300" />
                  <Link
                    to="/image-processor"
                    className="group-hover:translate-x-1 transition-transform duration-300"
                  >
                    Image Processor
                  </Link>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-green-600 hover:text-white transition"
                    onClick={() => {
                      setCategory("ECOMMERCE");
                      navigate("/client-level");
                    }}
                  >
                    E-commerce Level
                  </button>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-green-600 hover:text-white transition"
                    onClick={() => {
                      setCategory("LEADS");
                      navigate("/client-level");
                    }}
                  >
                    Leads Level
                  </button>
                </li>
              </ul>
            )}
          </ul>

          {/* Additional Navigation Links */}
          <div className="mt-auto">
            <Link
              to="/client-level"
              className={`block px-4 py-2 rounded text-white hover:bg-[#23262e] transition ${
                location.pathname === "/client-level" ? "bg-[#23262e]" : ""
              }`}
            >
              Clients
            </Link>
            <Link
              to="/add-client"
              className="mt-4 block px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition text-center"
            >
              + Add Client
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
