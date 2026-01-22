export interface SentenceData {
    id: number;
    text: string;
    // Arrays of indices for each component
    answerKey: {
      subject: number[]; // Indices of words that form the subject
      verb: number[];    // Indices of words that form the predicate verb
      object: number[];  // Indices of words that form the object
    };
    translation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    source: string; // e.g., "2023 National Paper I"
  }
  
  export const TRAINING_LEVELS: SentenceData[] = [
    {
      id: 1,
      text: "The experiment that the scientists conducted failed due to the temperature changes.",
      answerKey: {
        subject: [0, 1], // The experiment
        verb: [6],       // failed (Note: 'conducted' is inside the clause, not the main verb!)
        object: []       // Intransitive verb here, no object
      },
      translation: "科学家们进行的那个实验因为温度变化而失败了。",
      difficulty: "Medium",
      source: "Syntax Logic 101"
    },
    {
      id: 2,
      text: "Understanding the cultural differences helps tourists avoid embarrassing situations.",
      answerKey: {
        subject: [0, 1, 2], // Understanding the cultural differences (Gerund phrase)
        verb: [3],          // helps
        object: [4, 5, 6]   // tourists avoid embarrassing situations (Complex object)
      },
      translation: "理解文化差异有助于游客避免尴尬的处境。",
      difficulty: "Hard",
      source: "2022 National Paper II (Adapted)"
    },
    {
      id: 3,
      text: "What matters is not what you say but what you do.",
      answerKey: {
        subject: [0, 1], // What matters (Noun clause)
        verb: [2],       // is
        object: [4, 5, 6, 7, 8, 9, 10] // not what you say but what you do (Predictive)
      },
      translation: "重要的不是你说什么，而是你做什么。",
      difficulty: "Hard",
      source: "Classic Proverb"
    }
  ];
