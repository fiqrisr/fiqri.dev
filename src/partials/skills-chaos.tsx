import { MotionConfig, motion, useMotionValue } from "framer-motion";
import { portfolioData } from "../data/portfolio-data";

const categoryColors = ["bg-primary", "bg-secondary", "bg-accent"];

const getRandomRotation = () => Math.floor(Math.random() * 16 - 8);

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

type SkillTagProps = {
  skill: string;
  color: string;
};

const SkillTag = ({ skill, color }: SkillTagProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <motion.div
      drag
      dragMomentum
      dragElastic={0.2}
      whileDrag={{
        scale: 1.1,
        rotate: 5,
        boxShadow: "12px 12px 0px 0px rgba(0,0,0,1)",
        zIndex: 100,
      }}
      whileHover={{ scale: 1.05, rotate: -2 }}
      style={{
        x,
        y,
        rotate: getRandomRotation(),
      }}
      variants={tagVariants}
      className={`${color} border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-grab active:cursor-grabbing select-none touch-none`}
    >
      <span className="font-mono text-sm font-bold whitespace-nowrap">{skill}</span>
    </motion.div>
  );
};

type SkillCategoryPanelProps = {
  category: string;
  items: string[];
  colorIndex: number;
};

const SkillCategoryPanel = ({ category, items, colorIndex }: SkillCategoryPanelProps) => {
  const color = categoryColors[colorIndex % categoryColors.length];

  return (
    <div className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col">
      <div
        className={`${color} border-b-4 border-black px-4 py-2 flex items-center justify-between`}
      >
        <span className="font-mono text-xs font-bold uppercase tracking-wider">{category}</span>
        <span className="font-mono text-[10px] text-black/60 border-2 border-black/30 px-2 py-0.5 bg-black/10">
          {items.length}
        </span>
      </div>
      <motion.div
        className="bg-bg-base p-4 min-h-[100px] flex-1"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="flex flex-wrap gap-3">
          {items.map((skill) => (
            <SkillTag key={skill} skill={skill} color={color} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export const SkillsChaos = () => {
  const { skills } = portfolioData;
  const allItems = skills.flatMap((s) => s.items);

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="skills"
        className="bg-diagonal-stripes border-b-4 border-black relative overflow-hidden"
      >
        <div className="absolute top-4 left-6 font-mono text-xs text-black/40 select-none pointer-events-none">
          {'<section id="skills">'}
        </div>
        <div className="absolute bottom-4 right-6 font-mono text-xs text-black/40 select-none pointer-events-none">
          {"</section>"}
        </div>

        <div className="py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto w-full">
            <h2 className="sr-only">Skills</h2>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs md:text-sm tracking-[0.08em] border-2 border-black px-2 py-1 inline-block bg-bg-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                [ FILE_REF: 003 ]
              </span>
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-border-dark/50 hidden md:block">
                {"SYS.CAPABILITIES /// INDEXED"}
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-1 mb-10 select-none">
              {[
                { char: "S", id: "s1" },
                { char: "K", id: "k" },
                { char: "I", id: "i" },
                { char: "L", id: "l1" },
                { char: "L", id: "l2" },
                { char: "S", id: "s2" },
              ].map(({ char, id }, i) => {
                const colors = ["bg-secondary", "bg-accent", "bg-primary", "bg-bg-base"];
                const rotations = [
                  "-rotate-3",
                  "rotate-2",
                  "-rotate-1",
                  "rotate-3",
                  "rotate-1",
                  "-rotate-2",
                ];
                return (
                  <span
                    key={id}
                    className={`${colors[i % colors.length]} ${rotations[i % rotations.length]} font-heading text-[clamp(1.5rem,5vw,4.5rem)] font-black leading-none border-2 md:border-4 border-black px-2 py-1 md:px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block`}
                  >
                    {char}
                  </span>
                );
              })}
              <span className="mt-2 md:mt-0 font-mono text-xs border-4 border-black bg-bg-base px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ml-4 self-center">
                DRAG TO REARRANGE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skills.map((group, ci) => (
                <SkillCategoryPanel
                  key={group.category}
                  category={group.category}
                  items={group.items}
                  colorIndex={ci}
                />
              ))}
            </div>

            <div className="mt-4 text-right font-mono text-[10px] text-black/30 select-none pointer-events-none">
              {allItems.length} items · {skills.length} categories · framer-motion physics
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
};
