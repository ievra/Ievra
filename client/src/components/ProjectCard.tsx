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
  const p = project as any;

  const categoryLabel = getCategoryLabel(project.category);
  const subInfoItems = [p.style, p.area].filter(Boolean);

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

        {/* Top-left: Category (large) / Style / Area (small) */}
        <div className="absolute top-0 left-0 p-5 md:p-6 flex flex-col gap-1">
          {categoryLabel && (
            <p className="text-white text-sm md:text-base uppercase tracking-[0.15em] font-light leading-tight">
              {categoryLabel}
            </p>
          )}
          {subInfoItems.map((item, i) => (
            <p key={i} className="text-white/60 text-[11px] tracking-[0.1em] font-light">
              {item}
            </p>
          ))}
        </div>

        {/* Bottom: Title + Year/Location row */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <h3
            className="text-white uppercase tracking-wide text-sm md:text-base font-light mb-3"
            data-testid={`text-title-${project.id}`}
          >
            {title}
          </h3>
          <div className="flex items-end justify-between">
            {p.completionYear && (
              <div className="text-white">
                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                  {language === 'vi' ? 'Năm' : 'Year'}
                </p>
                <p className="text-white/90 text-xs font-light">{p.completionYear}</p>
              </div>
            )}
            {p.location && (
              <div className="text-right text-white">
                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                  {language === 'vi' ? 'Khu vực' : 'Location'}
                </p>
                <p className="text-white/90 text-xs font-light">{p.location}</p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
