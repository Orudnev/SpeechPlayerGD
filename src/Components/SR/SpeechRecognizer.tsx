import React, { useEffect, useRef } from 'react';
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;
type SpeechRecognitionErrorEvent = any;
type SpeechRecognizerProps = {
  onWordsRecognized: (words: string[]) => void;
  listening: boolean; // Управление запуском/остановкой извне
  lang?: string; // Язык распознавания (по умолчанию ru-RU)
};

export const SpeechRecognizer: React.FC<SpeechRecognizerProps> = ({
  onWordsRecognized,
  listening,
  lang = 'ru-RU',
}) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecognizingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.error('SpeechRecognition API is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result:any) => result[0].transcript)
        .join(' ');

      const words = transcript
        .trim()
        .toLowerCase()
        .replace(/[.,!?;:]/g, '')
        .split(/\s+/);

      onWordsRecognized(words);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onWordsRecognized, lang]);

  // Управление запуском/остановкой при изменении listening
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening && !isRecognizingRef.current) {
      try {
        recognition.start();
        isRecognizingRef.current = true;
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    } else if (!listening && isRecognizingRef.current) {
      recognition.stop();
      isRecognizingRef.current = false;
    }
  }, [listening]);

  return null;
};
