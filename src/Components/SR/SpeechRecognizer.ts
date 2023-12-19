import { type } from "os";
import { TLanguage } from "../../CommonTypes";

//@ts-ignore
const speechRecognition  = webkitSpeechRecognition || SpeechRecognition;

export interface SRResultAlternative{
    confidence:number;
    transcript:string;
}

export type TRecStatus = "Unknown"|"Starting"|"Stopping"|"Stopped"|"Started"|"Idle";
export type TResultHandler = (results:Array<Array<SRResultAlternative>>)=>void;

class SpeechRecognizerClass {
    recEngineInstance:any;
    Status:TRecStatus = "Unknown";
    ResultHandlers:TResultHandler[] = [];
    constructor(){
        this.recEngineInstance = new speechRecognition();
        this.recEngineInstance.continuous = true;
        this.recEngineInstance.interimResults = true;//Обработка промежуточных результатов
        this.recEngineInstance.maxAlternatives = 3;//Максимальное число альтернатив распознанного слова
        this.recEngineInstance.lang = 'en-US';
        this.Status = "Stopped";
        this.handleStart = this.handleStart.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        this.handleResult = this.handleResult.bind(this);
        this.handleError = this.handleError.bind(this);
        this.recEngineInstance.onstart = this.handleStart;
        this.recEngineInstance.onend = this.handleEnd;
        this.recEngineInstance.onresult = this.handleResult;
        this.recEngineInstance.onerror = this.handleError;
    }

    subscribeOnResult(newHandler:TResultHandler){
        this.ResultHandlers.push(newHandler);
    }
    
    handleStart(){
        //console.log('Speech recognition started')
        this.Status = "Started";
    }

    handleEnd(){
        //console.log('handleEnd');
        if(this.Status === "Stopping"){
            this.Status = "Stopped";
            //console.log('Speech recognition stopped')
            return;
        }
        this.recEngineInstance.start();
    } 
    handleResult(e:any){
        let results:Array<Array<SRResultAlternative>> = [];        
        if(e.results && e.results.length>0){
            for(let key in e.results){
                if(key === 'length'){
                    continue;
                }
                let result = e.results[key];
                let resItem:Array<SRResultAlternative> = [];
                for(let rkey in result){
                    let itmValue = result[rkey];
                    if(rkey === 'isFinal' || rkey === 'length' || typeof(itmValue) === 'function'){
                        continue;
                    }
                    let altRes:SRResultAlternative = itmValue;
                    resItem.push(altRes);
                }
                if(resItem.length>0){
                    results.push(resItem);
                }
            }
        }
        try{
            this.ResultHandlers.forEach(hndlr=>hndlr(results));
        } catch(error){
            let s=1;
        }
    }

    handleError(e:any){
        //console.log(e);
    }

    start(lang:TLanguage){
        if(this.Status === 'Idle' || this.Status==='Stopped' || this.Status === 'Unknown'){
            this.recEngineInstance.lang = lang;
            this.Status = "Starting";
            this.recEngineInstance.start();    
        } else {
            setTimeout(() => {
                //this.start(lang);
            }, 1000);
        }
    }

    stop(){
        this.Status = "Stopping";
        this.recEngineInstance.stop();
    }
}

export const SpeechRecognizer = new SpeechRecognizerClass();

