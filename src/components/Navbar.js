import React, { useState } from "react";

export default function Navbar() {
  const [active, setActive] = useState("Home"); // Default active link

  const links = ["Home", "Departments", "About", "Doctors", "Contact"];

  return (
    <nav className="bg-[#2C6975] text-white px-8 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-2xl font-bold flex items-center space-x-2">
        <img src="/images/logo.png" alt="Logo" className="h-8 w-8" />
        <span>MEDICARE</span>
      </h1>
      <ul className="flex space-x-6">
        {links.map((link) => (
          <li key={link}>
            <a
              href={`#${link}`}
              onMouseEnter={() => setActive(link)} // change active when hovered
              className={`transition-colors duration-300 ${
                active === link ? "text-[#CDE0C9]" : "hover:text-[#CDE0C9]"
              }`}
            >
              {link}
            </a>
          </li>
        ))}

        {/* Search box */}
        <li className="relative group flex items-center">
          <span className="cursor-pointer transition-opacity duration-500 group-hover:opacity-100 group-hover:hidden">
            Search
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="ml-2 w-40 opacity-100 hidden group-hover:block group-hover:w-40 group-hover:opacity-100 transition-all duration-500 px-2 py-1 text-black rounded"
          />
        </li>
      </ul>
    </nav>
  );
}
