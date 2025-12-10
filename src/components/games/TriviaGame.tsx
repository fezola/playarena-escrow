import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TriviaState, TriviaQuestion } from '@/types/game';
import { Timer, Brain, Check, X } from 'lucide-react';

interface TriviaGameProps {
  state: TriviaState;
  onAnswer: (answerIndex: number) => void;
  isPlayer1: boolean;
  disabled?: boolean;
}

export function TriviaGame({ state, onAnswer, isPlayer1, disabled }: TriviaGameProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  
  const myAnswer = isPlayer1 ? state.player1Answer : state.player2Answer;
  const opponentAnswer = isPlayer1 ? state.player2Answer : state.player1Answer;
  const hasAnswered = myAnswer !== null;
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const myScore = isPlayer1 ? state.player1Score : state.player2Score;
  const opponentScore = isPlayer1 ? state.player2Score : state.player1Score;

  // Timer countdown
  useEffect(() => {
    if (hasAnswered || state.revealed || !currentQuestion) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [hasAnswered, state.revealed, state.currentQuestionIndex]);

  // Reset timer on new question
  useEffect(() => {
    setTimeLeft(15);
    setSelectedAnswer(null);
  }, [state.currentQuestionIndex]);

  const handleAnswer = (index: number) => {
    if (hasAnswered || disabled || state.revealed) return;
    setSelectedAnswer(index);
    onAnswer(index);
  };

  const getOptionStyle = (index: number) => {
    if (!state.revealed) {
      if (selectedAnswer === index || myAnswer === index) {
        return 'bg-primary text-primary-foreground ring-2 ring-primary';
      }
      return 'bg-muted hover:bg-muted/80';
    }
    
    // Revealed
    const isCorrect = index === currentQuestion?.correctAnswer;
    const wasMyAnswer = myAnswer === index;
    const wasOpponentAnswer = opponentAnswer === index;
    
    if (isCorrect) {
      return 'bg-success text-success-foreground';
    }
    if (wasMyAnswer || wasOpponentAnswer) {
      return 'bg-destructive/20 text-destructive';
    }
    return 'bg-muted/50';
  };

  if (!currentQuestion) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      {/* Header with score and timer */}
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">You</p>
          <p className="text-2xl font-bold text-primary">{myScore}</p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            timeLeft <= 5 ? 'bg-destructive/20 text-destructive' : 'bg-muted'
          }`}>
            <Timer className="h-4 w-4" />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Question {state.currentQuestionIndex + 1}/{state.questions.length}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Opponent</p>
          <p className="text-2xl font-bold text-accent">{opponentScore}</p>
        </div>
      </div>

      {/* Progress */}
      <Progress value={(state.currentQuestionIndex / state.questions.length) * 100} />

      {/* Question */}
      <motion.div
        key={state.currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 bg-muted/50 rounded-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase">{currentQuestion.category}</span>
        </div>
        <p className="text-lg font-medium">{currentQuestion.question}</p>
      </motion.div>

      {/* Options */}
      <div className="grid gap-2">
        {currentQuestion.options.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="ghost"
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered || disabled || state.revealed}
              className={`w-full justify-start text-left p-4 h-auto ${getOptionStyle(index)}`}
            >
              <span className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center mr-3 text-sm">
                {String.fromCharCode(65 + index)}
              </span>
              {option}
              {state.revealed && index === currentQuestion.correctAnswer && (
                <Check className="ml-auto h-4 w-4 text-success" />
              )}
              {state.revealed && (myAnswer === index || opponentAnswer === index) && index !== currentQuestion.correctAnswer && (
                <X className="ml-auto h-4 w-4 text-destructive" />
              )}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Status */}
      <AnimatePresence>
        {hasAnswered && !state.revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-muted-foreground"
          >
            {opponentAnswer !== null 
              ? 'Both answered! Revealing...' 
              : 'Waiting for opponent...'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      {state.revealed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center p-3 rounded-lg ${
            myAnswer === currentQuestion.correctAnswer 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {myAnswer === currentQuestion.correctAnswer ? '✓ Correct!' : '✗ Wrong!'}
        </motion.div>
      )}

      {/* Game over */}
      {state.winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl"
        >
          <p className="text-2xl font-display font-bold mb-2">
            {state.winner === (isPlayer1 ? 'player1' : 'player2') ? '🎉 You Won!' : 'Game Over'}
          </p>
          <p className="text-muted-foreground">
            Final Score: {myScore} - {opponentScore}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// Sample trivia questions
const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"],
    correctAnswer: 2,
    category: "Art"
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which country invented pizza?",
    options: ["France", "Greece", "Italy", "Spain"],
    correctAnswer: 2,
    category: "Food"
  },
  {
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 1,
    category: "Math"
  },
];

export function createTriviaState(): TriviaState {
  // Shuffle and pick 5 questions
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 5);
  
  return {
    questions: selected,
    currentQuestionIndex: 0,
    player1Score: 0,
    player2Score: 0,
    player1Answer: null,
    player2Answer: null,
    revealed: false,
    winner: null,
  };
}