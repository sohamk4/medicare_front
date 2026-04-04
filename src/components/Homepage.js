import React from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Departments from "./Departments";
import About from "./About";
import Doctors from "./Doctors";
import Contact from "./Contact";
import Footer from "./Footer";

export default function Homepage() {
  return (
    <div className="font-sans">
      <Navbar />
      <Hero />
      <Departments />
      <About />
      <Doctors />
      <Contact />
      <Footer />
    </div>
  );
}
