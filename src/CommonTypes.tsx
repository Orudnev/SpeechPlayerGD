import { CrosswordMemorizer } from "./Components/CrosswordMemorizer";

export type TLanguage = 'en-US' | 'ru-RU';

export interface ISubItem {
  lang: TLanguage;
  text: string;
}

export interface IResult {
  lcnt: number;  // всего попыток
  Asf: number;     //Кол-во успешных ответов прямых 
  Asr: number;     //Кол-во успешных ответов обратных
  Aef: number;     //Кол-во ошибочтых ответов прямых
  Aer: number;     //Кол-во ошибочных ответов обратных
  ts: number;      //Unix timestamp - время последнего изменения результата
  // fsa: number;   //forward (question->answer) succeded answers
  // rsa: number;   //reverse (answer->question) succeded answers
  Aw: number;      //Кол-во успешных ответов письменных (прямых)
}

export interface IItem {  
  SheetName: string;  //имя набора слов/фраз
  uid:string;         //уникальный идентификатор записи
  q: ISubItem;        //вопрос
  a: ISubItem;        //ответ
  // если q.lang == 'ru-RU' то экземпляр Item считается "прямым"
  // если q.lang == 'en-US' то экземпляр Item считается "обратным"
  r: IResult | undefined; //рейтинг 
}

export interface IAppPage {
  path: string;
  title: string;
  getElement: () => React.ReactNode | null;
}

export const AppPages: IAppPage[] = [
  { path: "/", title: "Crossword Page", getElement: () => { return <CrosswordMemorizer /> }},
  { path: "/SpeechPlayerGD", title: "Crossword Page", getElement: () => { return <CrosswordMemorizer /> }}
];
export function filterUniqueByProperty(arr:any[], property:string) {
  return arr.filter((obj, index, self) =>
    index === self.findIndex(o => o[property] === obj[property])
  );
}


export type TCrosswordPageStatus = "Loading..."|"Stopped"|"Started"|"ShowAnswer"|"LoadNewItem";

export type TPlayerStatus = 'Loading' | 'Pause' | 'SayQuestion' | 'SayAnswer' | 'WaitAnswerToBeStarted' | 'WaitAnswerInProcess' | 'AnswerIsCorrect' | 'AnswerIsFailed' | 'WaitNextItem';

