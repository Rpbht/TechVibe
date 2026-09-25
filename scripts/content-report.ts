type Technology = { id: string; name: string; questionCount: number };

const targetPerCategory = 1_000;
const apiBase = (process.env.CONTENT_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');
const response = await fetch(`${apiBase}/technologies?default=true`);
if (!response.ok) throw new Error(`Could not load categories (${response.status}).`);
const technologies = await response.json() as Technology[];
const totalQuestions = technologies.reduce((total, technology) => total + technology.questionCount, 0);
const targetQuestions = technologies.length * targetPerCategory;

console.log(JSON.stringify({
  categories: technologies.length,
  populatedCategories: technologies.filter(({ questionCount }) => questionCount > 0).length,
  totalQuestions,
  targetPerCategory,
  targetQuestions,
  remainingQuestions: Math.max(0, targetQuestions - totalQuestions),
  minimumPerCategory: Math.min(...technologies.map(({ questionCount }) => questionCount)),
  maximumPerCategory: Math.max(...technologies.map(({ questionCount }) => questionCount)),
  lowestCoverage: [...technologies]
    .sort((left, right) => left.questionCount - right.questionCount || left.name.localeCompare(right.name))
    .slice(0, 10)
    .map(({ id, name, questionCount }) => ({ id, name, questionCount })),
}, null, 2));
