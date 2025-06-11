import { Lesson1 } from "./App";
import { PhraseMemorizer } from "./Components/PhraseMemorizer";

export type TLanguage = 'en-US' | 'ru-RU';

export interface ISubItem {
  lang: TLanguage;
  text: string;
}

export interface IResult {
  lcnt: number;  //whole listening counter
  fsa: number;   //forward (question->answer) succeded answers
  rsa: number;   //reverse (answer->question) succeded answers 
  ts: number;      //last access timestamp     
}

export interface IItem {
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
  { path: "/SpeechPlayerGD/Lesson1", title: "Lesson1", getElement: () => { return <Lesson1 /> } }
];
export function filterUniqueByProperty(arr:any[], property:string) {
  return arr.filter((obj, index, self) =>
    index === self.findIndex(o => o[property] === obj[property])
  );
}
  

export type TPlayerStatus = 'Loading' | 'Pause' | 'SayQuestion' | 'SayAnswer' | 'WaitAnswerToBeStarted' | 'WaitAnswerInProcess' | 'AnswerIsCorrect' | 'AnswerIsFailed' | 'WaitNextItem';

