import { Calculator, Microscope, Globe, Languages, Palette, Activity, ArrowRight } from "lucide-react";

const programs = [
  {
    title: "Mathematics",
    icon: Calculator,
    desc: "Develop critical thinking and problem-solving skills through algebra, geometry, and calculus.",
    tags: ["Algebra", "Geometry", "Calculus"],
  },
  {
    title: "Sciences",
    icon: Microscope,
    desc: "Explore the natural world through biology, chemistry, and physics laboratories.",
    tags: ["Biology", "Chemistry", "Physics"],
  },
  {
    title: "Humanities",
    icon: Globe,
    desc: "Understand human society through history, geography, and social studies.",
    tags: ["History", "Geography", "Civics"],
  },
  {
    title: "Languages",
    icon: Languages,
    desc: "Master communication skills in primary and foreign languages.",
    tags: ["English", "Arabic", "French"],
  },
  {
    title: "Arts & Activities",
    icon: Palette,
    desc: "Express creativity through visual arts and maintain physical wellbeing.",
    tags: ["Drawing", "Music", "P.E."],
  },
];

const Programs = () => {
  return (
    <section id="programs" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <h2 className="text-[#3ecf8e] font-bold tracking-widest uppercase text-sm">
              Academic Programs
            </h2>
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
              Find Your Domain
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Our curriculum is designed in partnership with industry giants to
            ensure our graduates are day-one ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, idx) => (
            <div
              key={idx}
              className="group relative bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 p-8 rounded-2xl hover:border-[#3ecf8e]/50 transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-10">
                <program.icon
                  size={80}
                  className="text-gray-300 dark:text-white"
                />
              </div>

              <div className="bg-white dark:bg-[#1c1c1c] w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-gray-100 dark:border-gray-700">
                <program.icon className="text-[#3ecf8e] w-7 h-7" />
              </div>

              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {program.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {program.desc}
              </p>

              <div className="flex flex-wrap gap-2">
                {program.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-3 py-1 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button className="mt-8 flex items-center text-[#3ecf8e] font-bold group-hover:translate-x-2 transition-transform">
                Learn More <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;
