import { Lesson1 } from "./App";
import { CrosswordMemorizer } from "./Components/CrosswordMemorizer";
import { PhraseMemorizer } from "./Components/PhraseMemorizer";

export type TLanguage = 'en-US' | 'ru-RU';

export interface ISubItem {
  lang: TLanguage;
  text: string;
}

export interface IResult {
  lcnt: number;  // всего попыток
  // fsa: number;   //forward (question->answer) succeded answers
  // rsa: number;   //reverse (answer->question) succeded answers
  Asf: number;     //Кол-во успешных ответов голосом прямых
  Asr: number;     //Кол-во успешных ответов голосом обратных
  Aef: number;     //Кол-во ошибочтых ответов голосом прямых
  Aer: number;     //Кол-во ошибочных ответов голосом обратных
  Aw: number;      //Кол-во успешных ответов письменных (прямых)
  ts: number;      //last access timestamp     
}

export interface IItem {
  uid:string;
  q: ISubItem;
  a: ISubItem;
  r: IResult | undefined;
}

export interface IAppPage {
  path: string;
  title: string;
  getElement: () => React.ReactNode | null;
}

export const AppPages: IAppPage[] = [
  { path: "/", title: "Voice page", getElement: () => { return <PhraseMemorizer /> }},
  { path: "/SpeechPlayerGD", title: "Voice page", getElement: () => { return <PhraseMemorizer /> } },
  { path: "/CrossWord", title: "Crossword page", getElement: () => { return <CrosswordMemorizer /> } }
];
export function filterUniqueByProperty(arr:any[], property:string) {
  return arr.filter((obj, index, self) =>
    index === self.findIndex(o => o[property] === obj[property])
  );
}

export type TCrosswordPageStatus = "Loading..."|"Stopped"|"Started";

export type TPlayerStatus = 'Loading' | 'Pause' | 'SayQuestion' | 'SayAnswer' | 'WaitAnswerToBeStarted' | 'WaitAnswerInProcess' | 'AnswerIsCorrect' | 'AnswerIsFailed' | 'WaitNextItem';

