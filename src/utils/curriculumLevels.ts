import type { CourseModule } from "@/types";

export type CurriculumLevelId =
  | "Beginner"
  | "Core Concepts"
  | "Object Oriented (OOP)"
  | "Advanced C++ & STL"
  | "Projects & Deep Dives";

export interface CurriculumLevel {
  id: CurriculumLevelId;
  /** Public marketing label */
  label: string;
  modules: CourseModule[];
  firstModuleId: string;
}

const LEVEL_ORDER: CurriculumLevelId[] = [
  "Beginner",
  "Core Concepts",
  "Object Oriented (OOP)",
  "Advanced C++ & STL",
  "Projects & Deep Dives",
];

const LEVEL_LABELS: Record<CurriculumLevelId, string> = {
  Beginner: "Beginner",
  "Core Concepts": "Core Concepts",
  "Object Oriented (OOP)": "Object-Oriented",
  "Advanced C++ & STL": "Advanced and STL",
  "Projects & Deep Dives": "Projects",
};

export function getCurriculumLevels(
  modules: CourseModule[],
): CurriculumLevel[] {
  return LEVEL_ORDER.map((id) => {
    const levelModules = modules
      .filter((m) => m.category === id)
      .sort((a, b) => a.moduleNumber - b.moduleNumber);
    return {
      id,
      label: LEVEL_LABELS[id],
      modules: levelModules,
      firstModuleId: levelModules[0]?.id ?? "",
    };
  }).filter((level) => level.modules.length > 0);
}

export function moduleCountLabel(modules: CourseModule[]): string {
  const n = modules.length;
  return `${n} module${n === 1 ? "" : "s"}`;
}
