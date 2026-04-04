import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      id="Home"
      className="relative h-[90vh] flex items-center px-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/hero-bg.png')" }}
    >
      <div className="absolute inset-0 bg-[#FFFFFF]/1"></div>

      <div className="relative z-10 max-w-xl text-left text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          We Provide Best Healthcare
        </h2>
        <p className="mb-6 text-lg">
          Transforming the way Healthcare works -  Medicare uses blockchain to ensure transparency, security, and trust. Connect with doctors, manage your health records, and access consultations anytime, anywhere.
        </p>
        {/* Use Link instead of plain button */}
        <Link to="/explore">
          <button className="bg-white text-[#2C6975] px-6 py-3 rounded-lg font-semibold hover:bg-[#CDE0C9]">
            Explore Now
          </button>
        </Link>
      </div>
    </section>
  );
}
