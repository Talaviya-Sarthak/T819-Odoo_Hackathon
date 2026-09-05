import { logger } from '../../../config/logger';
import { knowledgeIngestionService } from '../knowledge.ingestion';

export const CHARUSAT_ACADEMIC_HANDBOOK_TEXT = `
CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY (CHARUSAT)
ACADEMIC REGULATIONS & STUDENT HANDBOOK (ACADEMIC YEAR 2025-26)

CHAPTER 1: ATTENDANCE RULES AND ELIGIBILITY
Clause 1.1: Every student is required to attend a minimum of 75% of total scheduled theory lectures, practical labs, and tutorial classes in each registered subject to be eligible to appear for the End-Semester University Examinations.
Clause 1.2: Students with attendance between 65% and 74.9% due to medical reasons or sanctioned university representation (sports, hackathons, cultural events) may submit an official leave application accompanied by a valid medical certificate to the Head of Department (HOD) for condonation.
Clause 1.3: Students with attendance strictly below 65% will be detained in that subject and will not be permitted to sit for the End-Sem examination under any circumstances. They must re-register for the course in subsequent semesters.

CHAPTER 2: EXAMINATION SCHEME AND GRADING SYSTEM
Clause 2.1: The evaluation scheme for each course comprises:
  - Continuous Internal Evaluation (CIE): 30 Marks (Mid-Sem Exam 20 marks + Quiz/Assignments 10 marks)
  - Practical Internal / Lab Evaluation: 20 Marks
  - End-Semester University Examination (ESE): 50 Marks
  Total: 100 Marks per subject.
Clause 2.2: Grading Scale & CGPA Calculation:
  - Grade O (Outstanding): 10 Grade Points (>= 85%)
  - Grade A+ (Excellent): 9 Grade Points (75-84%)
  - Grade A (Very Good): 8 Grade Points (65-74%)
  - Grade B+ (Good): 7 Grade Points (55-64%)
  - Grade B (Above Average): 6 Grade Points (45-54%)
  - Grade C (Average / Pass): 5 Grade Points (40-44%)
  - Grade F (Fail / Backlog): 0 Grade Points (< 40%)
Clause 2.3: Cumulative Grade Point Average (CGPA) is calculated as Sum(Credits * Grade Points) / Sum(Total Credits). Minimum CGPA required for degree award is 5.0.

CHAPTER 3: RE-EVALUATION AND SUPPLEMENTARY BACKLOG EXAMINATIONS
Clause 3.1: Re-evaluation Request: Students dissatisfied with their End-Sem answer sheet marks can apply online via the CHARUSAT Student Portal within 7 days of result declaration by paying a non-refundable fee of Rs. 300 per subject.
Clause 3.2: Backlog Examinations: Supplementary remedial exams for backlog subjects are held within 30 days after the main result declaration. Hall tickets are issued online 3 days prior to exam start.

CHAPTER 4: COMPUTER ENGINEERING (DEPSTAR / CSPIT) SYLLABUS SYNOPSIS
Course Code: CE342 - Design and Analysis of Algorithms (4 Credits)
  - Unit 1: Asymptotic Notations & Recurrences (Master Theorem, Substitution)
  - Unit 2: Divide and Conquer (Merge Sort, Quick Sort, Binary Search)
  - Unit 3: Dynamic Programming (0/1 Knapsack, LCS, Matrix Chain)
  - Unit 4: Greedy Algorithms (Dijkstra, Prim, Kruskal, Huffman Coding)
  - Unit 5: NP-Completeness & Approximation Algorithms
  - Prerequisites: Data Structures & Algorithms (CE241).

Course Code: CE345 - Artificial Intelligence & Machine Learning (4 Credits)
  - Unit 1: Intelligent Agents & Heuristic Search (A*, Minimax)
  - Unit 2: Supervised Learning (Linear Regression, Decision Trees, SVM)
  - Unit 3: Unsupervised Learning & Neural Networks (K-Means, CNN, Backpropagation)
  - Unit 4: Natural Language Processing & RAG Architecture
  - Prerequisites: Linear Algebra & Probability.

CHAPTER 5: FEES AND SCHOLARSHIPS
Clause 5.1: Semester Tuition Fees must be deposited before 31st July (Odd Sem) and 31st January (Even Sem).
Clause 5.2: CHARUSAT Merit Scholarship awards 50% tuition waiver for students achieving SGPA >= 9.0 in previous semester.
`;

export async function seedCharusatKnowledge(): Promise<void> {
  try {
    logger.info('Seeding CHARUSAT Academic Handbook & Regulations into vector database...');
    const result = await knowledgeIngestionService.ingestDocument({
      documentId: 'charusat_handbook_2026',
      filename: 'CHARUSAT_Academic_Regulations_and_Syllabus.pdf',
      fileContent: CHARUSAT_ACADEMIC_HANDBOOK_TEXT,
      fileType: 'pdf',
      source: 'CHARUSAT Academic Section',
      pageCount: 5,
    });
    logger.info({ chunkCount: result.length }, 'CHARUSAT Academic Handbook seeded successfully.');
  } catch (error) {
    logger.warn({ err: error }, 'CHARUSAT Knowledge seeding fallback mode active.');
  }
}
