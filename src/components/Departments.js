import { Heart, Stethoscope, Scissors, Plus } from "lucide-react";

const departments = [
  {
    icon: Heart,
    title: "CARDIOLOGY",
    description:
      "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit at consequat.",
  },
  {
    icon: Stethoscope,
    title: "DIAGNOSIS",
    description:
      "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit at consequat.",
  },
  {
    icon: Scissors,
    title: "SURGERY",
    description:
      "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit at consequat.",
  },
  {
    icon: Plus,
    title: "FIRST AID",
    description:
      "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit at consequat.",
  },
];

const Departments = () => {
  return (
    <section id="Departments" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            HEALTHCARE DEPARTMENTS
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            The Healthcare Department ensures efficient delivery of medical services and promotes quality patient care through innovation and collaboration.
          </p>
        </div>

        {/* Departments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {departments.map((dept, index) => (
            <div
              key={index}
              className="p-8 text-center border rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2C6975] transition-colors">
                <dept.icon className="w-8 h-8 text-[#2C6975] group-hover:text-white" />
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {dept.title}
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed">
                {dept.description}
              </p>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="bg-[#2C6975] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#6BB2A0] transition-all">
            View All
          </button>
        </div>
      </div>
    </section>
  );
};

export default Departments;
