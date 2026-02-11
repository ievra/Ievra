import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Project, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
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

  return (
    <div 
      className="project-card group relative overflow-hidden cursor-pointer h-[28rem] w-full flex-shrink-0 rounded-none border border-white/10 hover:bg-white/5 transition-all duration-500 ease-out hover:shadow-2xl hover:shadow-white/10"
      data-index={index}
    >
      <Link href={project.slug ? `/portfolio/${project.slug}` : `/project/${project.id}`}>
        {projectImage ? (
          <img 
            src={projectImage}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            data-testid={`img-project-${project.id}`}
          />
        ) : (
          <div className="w-full h-full bg-transparent" data-testid={`img-project-${project.id}`} />
        )}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-500" />
        
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-white text-xl font-light mb-2" data-testid={`text-title-${project.id}`}>
              {project.title}
            </h3>
            <p className="text-white/80 text-sm uppercase tracking-wide mb-1" data-testid={`text-category-${project.id}`}>
              {getCategoryLabel(project.category)}
            </p>
            {project.area && (
              <p className="text-white/60 text-xs" data-testid={`text-area-${project.id}`}>
                {project.area}
              </p>
            )}
          </div>
          
          {(project.duration || project.completionYear) && (
            <div className="grid grid-cols-2 gap-4 text-white">
              {project.completionYear && (
                <div>
                  <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                    {language === 'vi' ? 'Năm' : 'Year'}
                  </p>
                  <p className="font-light text-sm" data-testid={`text-year-${project.id}`}>
                    {project.completionYear}
                  </p>
                </div>
              )}
              {project.duration && (
                <div>
                  <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">
                    {language === 'vi' ? 'Thời gian' : 'Duration'}
                  </p>
                  <p className="font-light text-sm" data-testid={`text-duration-${project.id}`}>
                    {project.duration}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
