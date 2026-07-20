import { MotionConfig, motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Dialog, DialogClose, DialogContent } from "../components/dialog";
import type { Project } from "../data/portfolio-data";
import { portfolioData } from "../data/portfolio-data";

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

export const ProjectGallery = () => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { projects } = portfolioData;

  const openModal = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedProject) {
        if (e.key === "Escape") {
          closeModal();
        }
        return;
      }

      switch (e.key) {
        case "j": {
          e.preventDefault();
          const next = Math.min(activeIndex + 1, projects.length - 1);
          setActiveIndex(next);
          cardRefs.current[next]?.focus();
          break;
        }
        case "k": {
          e.preventDefault();
          const prev = Math.max(activeIndex - 1, 0);
          setActiveIndex(prev);
          cardRefs.current[prev]?.focus();
          break;
        }
        case "Enter": {
          if (activeIndex >= 0 && activeIndex < projects.length) {
            openModal(projects[activeIndex]);
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, selectedProject, openModal, closeModal]);

  return (
    <MotionConfig reducedMotion="user">
      <section id="projects" className="bg-horizontal-lines border-b-4 border-black">
        {/* Industrial Marquee Heading */}
        <div
          className="border-y-4 border-black bg-primary overflow-hidden py-4 select-none"
          aria-hidden="true"
        >
          <div className="flex animate-marquee md:animate-marquee-slow whitespace-nowrap">
            <span className="font-heading text-[clamp(2rem,5vw,4rem)] font-black italic uppercase tracking-tight text-black">
              {
                "// DEPLOYED ARCHITECTURE // FEATURED WORK // DEPLOYED ARCHITECTURE // FEATURED WORK // DEPLOYED ARCHITECTURE // FEATURED WORK // DEPLOYED ARCHITECTURE // FEATURED WORK // "
              }
            </span>
          </div>
        </div>
        <h2 className="sr-only">Featured Projects</h2>

        <div className="py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-xs md:text-sm tracking-[0.08em] border-2 border-black px-2 py-1 inline-block bg-bg-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                [ FILE_REF: 002 ]
              </span>
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-border-dark/50 hidden md:block">
                {"DEPLOYED.ARCHITECTURE /// VERIFIED"}
              </span>
            </div>
            <p className="text-sm font-mono text-border-dark/70 mb-12 hidden md:block">
              <kbd className="px-1.5 py-0.5 border-2 border-black bg-bg-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">
                j
              </kbd>
              {" / "}
              <kbd className="px-1.5 py-0.5 border-2 border-black bg-bg-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">
                k
              </kbd>
              {" to navigate · "}
              <kbd className="px-1.5 py-0.5 border-2 border-black bg-bg-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">
                Enter
              </kbd>
              {" to open · "}
              <kbd className="px-1.5 py-0.5 border-2 border-black bg-bg-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">
                Esc
              </kbd>
              {" to close"}
            </p>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={gridVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {projects.map((project, index) => (
                <motion.div key={project.id} variants={cardVariants}>
                  <Card
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                    accent={project.themeColor}
                    tabIndex={0}
                    role="button"
                    aria-label={`View project: ${project.title}`}
                    onClick={() => openModal(project)}
                    onFocus={() => setActiveIndex(index)}
                    className={`cursor-pointer h-full flex flex-col p-6 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-150 ${
                      activeIndex === index
                        ? "ring-4 ring-secondary shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1"
                        : ""
                    }`}
                  >
                    <h3 className="text-2xl font-heading font-bold mb-2">{project.title}</h3>
                    <p className="text-sm text-border-dark font-body mb-4 flex-1">
                      {project.shortDescription}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {project.techStack.slice(0, 4).map((tech) => (
                        <Badge key={tech}>{tech}</Badge>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <Dialog open={!!selectedProject} onClose={closeModal}>
              {selectedProject && (
                <DialogContent accent={selectedProject.themeColor}>
                  <DialogClose onClose={closeModal} />

                  <h3 className="text-3xl font-heading font-bold mb-4 pr-16">
                    {selectedProject.title}
                  </h3>
                  <p className="text-fluid-body font-body text-border-dark mb-6 leading-relaxed">
                    {selectedProject.fullDescription}
                  </p>

                  <div className="mb-6">
                    <h4 className="text-sm font-mono font-bold uppercase tracking-wider mb-3 text-border-dark/70">
                      Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.techStack.map((tech) => (
                        <Badge key={tech} variant="primary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 flex-wrap">
                    {selectedProject.link && (
                      <a href={selectedProject.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary">View Live ↗</Button>
                      </a>
                    )}
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
};
