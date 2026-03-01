import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Project, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectCardProps {
  project: Project;
  index?: number;
  className?: string;
  heightClass?: string;
  isLarge?: boolean;
}

export default function ProjectCard({
  project,
  index = 0,
  className = '',
  heightClass = 'h-[420px]',
  isLarge = false,
}: ProjectCardProps) {
  const { language } = useLanguage();
  const projectImage = Array.isArray(project.images) && project.images[0] || null;

  const { data: dbCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const getCategoryLabel = (categorySlug: string) => {
    const projectCategories = dbCategories.filter(cat => cat.type === 'project' && cat.active);
    const foundCategory = projectCategories.find(c => c.slug === categorySlug);
    if (foundCategory) {
      return language === 'vi' ? (foundCategory.nameVi || foundCategory.name) : foundCategory.name;
    }
    return categorySlug;
  };

  const title = project.title;

  return (
    <div
      className={`project-card group relative overflow-hidden cursor-pointer w-full h-full ${className}`}
      data-index={index}
    >
      <Link href={project.slug ? `/portfolio/${project.slug}` : `/project/${project.id}`} className="block w-full h-full">
        {projectImage ? (
          <img
            src={projectImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            data-testid={`img-project-${project.id}`}
          />
        ) : (
          <div className="w-full h-full bg-zinc-900" data-testid={`img-project-${project.id}`} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <p
            className="text-white/55 text-[12px] uppercase tracking-[0.25em] mb-2 font-light"
            data-testid={`text-category-${project.id}`}
          >
            {getCategoryLabel(project.category)}
            {project.location && (
              <span className="ml-3 text-white/40">· {project.location}</span>
            )}
          </p>
          <h3
            className="text-white uppercase tracking-wide text-sm md:text-base font-light"
            data-testid={`text-title-${project.id}`}
          >
            {title}
          </h3>
        </div>
      </Link>
    </div>
  );
}
