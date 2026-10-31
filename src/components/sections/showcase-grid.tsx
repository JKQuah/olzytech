import { Tilt } from "@/components/motion/tilt";
import { Reveal } from "@/components/shared/reveal";
import { formatCompleted, projectAssets, type ProjectGroup, type ProjectSlug } from "@/content/projects";
import { localeMeta } from "@/i18n/config";
import { getLocale, type Dictionary } from "@/i18n/dictionaries";
import { ProjectCard } from "./project-card";

type ShowcaseGridProps = {
  dict: Dictionary["showcase"];
  /** Limit the number of projects, e.g. 3 on the home page. */
  limit?: number;
  /** Slugs to leave out, e.g. a project already featured elsewhere on the page. */
  exclude?: ProjectSlug[];
  /** Only projects of this showcase section. Omit for all. */
  group?: ProjectGroup;
};

export async function ShowcaseGrid({ dict, limit, exclude = [], group }: ShowcaseGridProps) {
  const htmlLang = localeMeta[await getLocale()].htmlLang;
  const all = dict.projects.filter(
    (p) => !exclude.includes(p.slug as ProjectSlug) && (!group || projectAssets[p.slug as ProjectSlug].group === group),
  );
  const projects = limit ? all.slice(0, limit) : all;
  const categoryLabels = dict.categories as Record<string, string>;

  return (
    <ul className="flex flex-wrap justify-center gap-6">
      {projects.map((project, i) => {
        const asset = projectAssets[project.slug as ProjectSlug];
        const completed = asset.completed;
        return (
          <Reveal
            as="li"
            key={project.slug}
            delay={(i % 3) * 80}
            variant="scale"
            className="w-full md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
          >
            <Tilt max={5} className="h-full">
              <ProjectCard
                project={{
                  ...project,
                  url: asset.url,
                  image: asset.image,
                  comingSoon: "comingSoon" in asset ? asset.comingSoon : undefined,
                  completedISO: completed,
                  completedLabel: completed ? formatCompleted(completed, htmlLang) : undefined,
                }}
                categoryLabel={categoryLabels[project.category] ?? project.category}
                labels={dict.labels}
              />
            </Tilt>
          </Reveal>
        );
      })}
    </ul>
  );
}
