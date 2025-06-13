import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './InputWord.css';

interface WordChar {
  char: string;
  revealed: boolean;
}


export interface InputWordProps {
  onComplete: () => void;
}

export interface InputWordsMethods{
  loadNewItem:(questionStr:string, answerStr: string)=>void;
  showAnswer:(show:boolean)=>void;
}


const InputWord = forwardRef<InputWordsMethods,InputWordProps>((props, ref) => {

  const [words, setWords] = useState<WordChar[][]>([[{char:'',revealed:false}]]);
  const [currentPosition, setCurrentPosition] = useState({
    wordIndex: 0,
    charIndex: 0
  });
  const [questionStr, setQuestionStr] = useState('');
  const [answerStr, setAnswerStr] = useState('');
  const [message, setMessage] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);


  const hasHiddenChars = words?words.some(word => word.some(char => !char.revealed && !showAnswer)):false;

  const focusInput = () => {
    if (inputRef.current) {
      // Создаем фейковое событие для мобильных устройств
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        const input = inputRef.current;
        input.style.position = 'fixed';
        input.style.top = '0';
        input.style.left = '0';
        input.style.width = '1px';
        input.style.height = '1px';
        input.style.opacity = '0';
        input.focus();
        setTimeout(() => {
          input.style.position = 'absolute';
        }, 1000);
      } else {
        inputRef.current.focus();
      }
    }
  };

  useImperativeHandle(ref, () => ({
    loadNewItem(questionStr: string, answerStr: string) {
      const initialWords = answerStr.split(' ').map(word =>
        word.split('').map(char => ({ char, revealed: false }))
      );
      setQuestionStr(questionStr);
      setAnswerStr(answerStr);
      setWords(initialWords);
    },
    showAnswer(show) {
      setShowAnswer(show);
    },
  })); 

  useEffect(() => {
    // Задержка для корректного открытия клавиатуры на мобильных
    const timer = setTimeout(focusInput, 300);

    // Обработчик для повторного фокуса при тапе
    const handleTap = () => {
      if (hasHiddenChars) {
        focusInput();
      }
    };

    const container = containerRef.current;
    container?.addEventListener('click', handleTap);

    return () => {
      clearTimeout(timer);
      container?.removeEventListener('click', handleTap);
    };
  }, [hasHiddenChars]);

  const handleCharInput = (char: string) => {
    if (!hasHiddenChars) return;

    const { wordIndex, charIndex } = currentPosition;
    if (!words) return;
    if (wordIndex >= words.length || charIndex >= words[wordIndex].length) return;

    const currentWordChar = words[wordIndex][charIndex];
    const pressedKey = char.toLowerCase();

    if (currentWordChar.char.toLowerCase() === pressedKey) {
      const newWords = [...words];
      newWords[wordIndex] = [...words[wordIndex]];
      newWords[wordIndex][charIndex] = { ...currentWordChar, revealed: true };
      setWords(newWords);
      setMessage('');

      let nextWordIndex = wordIndex;
      let nextCharIndex = charIndex + 1;

      if (nextCharIndex >= words[wordIndex].length) {
        nextWordIndex++;
        nextCharIndex = 0;
      }

      if (nextWordIndex < words.length) {
        setCurrentPosition({ wordIndex: nextWordIndex, charIndex: nextCharIndex });
      } else {
        setMessage('Все символы раскрыты!');
        setWords([]);
        setCurrentPosition({ wordIndex: 0, charIndex: 0 });
        props.onComplete();
      }
    } else {
      setMessage('Неверная буква, попробуйте еще раз');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.slice(-1).toLowerCase();
    handleCharInput(char);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key.length === 1) {
      handleCharInput(e.key.toLowerCase());
      e.preventDefault();
    }
  };

  // if (words.length === 0 && initialWords.length > 0) {
  //   setWords(initialWords);
  // }

  let msg = hasHiddenChars ? message : 'Все символы раскрыты!';
  // if (!props.answerString) msg = "";
  
  return (
    <div ref={containerRef} className="input-word" style={{ cursor: 'pointer' }} onClick={focusInput}>
      <h1 className="input-word__question">{questionStr}</h1>
      <div className="input-word__container">
        {words.map((word, wordIndex) => (
          <div key={`word-${wordIndex}`} className="input-word__word">
            {word.map((char, charIndex) => {
              const isActive = wordIndex === currentPosition.wordIndex &&
                charIndex === currentPosition.charIndex &&
                hasHiddenChars;

              return (
                <div
                  key={`cell-${wordIndex}-${charIndex}`}
                  className={`
                    input-word__cell
                    ${isActive ? 'input-word__cell--active' : ''}
                    ${char.revealed || showAnswer ? 'input-word__cell--revealed' : ''}
                  `}
                >
                  {(char.revealed || showAnswer) && (
                    <span className="input-word__char">
                      {char.char}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className={`
        input-word__message
        ${message.includes('Неверная') ? 'input-word__message--error' : ''}
      `}>
        {msg}
      </div>

      <input
        ref={inputRef}
        type="text"
        enterKeyHint="done"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        className="input-word__native-input"

        onChange={handleInputChange}
        onBlur={() => hasHiddenChars && setTimeout(focusInput, 100)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});

export default InputWord;