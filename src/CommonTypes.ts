export type TLanguage = 'en-US'|'ru-RU';

export interface ISubItem {
    lang:TLanguage;
    text:string;
}

export interface IResult{
    lcnt:number;  //whole listening counter
    fsa:number;   //forward (question->answer) succeded answers
    rsa:number;   //reverse (answer->question) succeded answers    
}

export interface IItem {
    q:ISubItem;
    a:ISubItem;
    r:IResult|undefined;
}


export type TPlayerStatus = 'Pause'|'SayQuestion'|'WaitAnswerToBeStarted'|'WaitAnswerInProcess'|'AnswerIsCorrect'|'AnswerIsFailed'|'WaitNextItem';

