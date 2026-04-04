import React from "react";

export default function Doctors() {
  return (
    <section id="Doctors" className="py-16 px-8 text-center bg-[#2C6975] text-white">
      <h3 className="text-3xl font-bold mb-8">Our Doctors</h3>
      <p className="max-w-3xl mx-auto mb-8">
        Experienced, compassionate, and committed — our doctors ensure the best healthcare experience for every individual.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="bg-white text-[#2C6975] p-6 rounded-lg shadow">
          <img src="images/d1.jpg" alt="Doctor" className="mx-auto rounded-full mb-4" />
          <h4 className="font-bold">Elina Josh</h4>
          <p>Doctor</p>
        </div>
        <div className="bg-white text-[#2C6975] p-6 rounded-lg shadow">
          <img src="images/d2.jpg" alt="Doctor" className="mx-auto rounded-full mb-4" />
          <h4 className="font-bold">Adam View</h4>
          <p>Doctor</p>
        </div>
        <div className="bg-white text-[#2C6975] p-6 rounded-lg shadow">
          <img src="images/d3.jpg" alt="Doctor" className="mx-auto rounded-full mb-4" />
          <h4 className="font-bold">Mia Mike</h4>
          <p>Doctor</p>
        </div>
      </div>
    </section>
  );
}
