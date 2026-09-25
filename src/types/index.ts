export type TechnologyId = string;

export interface CodeData {
  language: string;
  snippet: string;
}

export interface ComplexityData {
  time: string;
  space: string;
}

export type QuestionType =
  | 'conceptual'
  | 'code-explanation'
  | 'debugging'
  | 'scenario'
  | 'comparison'
  | 'algorithm'
  | 'system-design';

export interface QuestionSource {
  title: string;
  url: string;
}

/**
 * Generic Question schema: clean, database-ready, and standardized for Node.js REST APIs
 */
export interface QuestionItem {
  id: string;
  technology: TechnologyId;
  title: string;
  questionType?: QuestionType;
  summary?: string;
  explanation: string[];
  code?: CodeData;
  pseudoCode?: string[];
  complexity?: ComplexityData;
  source?: QuestionSource;
}

export interface TechnologyMeta {
  id: TechnologyId;
  name: string;
  iconName: string;
  description: string;
  subtopics?: string[];
  questionCount: number;
}
