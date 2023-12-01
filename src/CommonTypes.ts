export type TLanguage = 'en-US'|'ru-RU';

export interface ISubItem {
    lang:TLanguage;
    text:string;
}

export interface IItem {
    q:ISubItem;
    a:ISubItem;
}

export type TPlayerStatus = 'Pause'|'SayQuestion'|'WaitAnswer'|'WaitNextItem';

