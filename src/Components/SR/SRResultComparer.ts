import { TLanguage } from "../../CommonTypes";
import { SpeechRecognizer, SRResultAlternative } from "./SpeechRecognizer";
import { ICommandDetector } from "./SRResultCmdDetector";

type TCmpStatus = "Undefined"|"Processing"|"CommandMode"|"Success"|"TimeoutElapsed";

class SRResultComparerClass{
    etalonText:string = "";
    pcLimit:number = 90;
    handleChangeResult:(()=>void)|null = null;
    cmpStatus:TCmpStatus = "Undefined";
    currentMaxPercentOfMatches = 0;
    commandDetector:ICommandDetector|null = null;
    wordCmpResult:boolean[] = []; //item[i] === true means that word[i] is matched, were i - word index from etalonText string
    wordCmpPrevResult:boolean[] = [];

    constructor(){
        this.processResult = this.processResult.bind(this);
        this.onTimeoutElapsed = this.onTimeoutElapsed.bind(this);
        SpeechRecognizer.subscribeOnResult(this.processResult);
    }

    connectCommandDetector(cmdDetector:ICommandDetector){
        this.commandDetector = cmdDetector;
    }

    startNewComparison(text:string,lang:TLanguage,timeout:number,onChangeResultHandler:()=>void){
        this.cmpStatus = "Processing";
        this.currentMaxPercentOfMatches = 0;
        this.etalonText = text;
        let words = this.etalonText.split(" ");
        this.wordCmpResult = new Array(words.length);
        this.wordCmpPrevResult = [];
        this.handleChangeResult = onChangeResultHandler;
        SpeechRecognizer.start(lang);
        setTimeout(this.onTimeoutElapsed,timeout);
    }

    stopComparison(){
        this.handleChangeResult = null;
        SpeechRecognizer.stop();
    }

    onTimeoutElapsed(){
        this.cmpStatus = "TimeoutElapsed";
        this.invokeChangeResultHandler();
        this.stopComparison();
    }

    iswrdResultsChanged(){
        let result = false;
        if(this.wordCmpResult.length === this.wordCmpPrevResult.length){
            let hasChanges = this.wordCmpResult.find((itm,index)=>itm != this.wordCmpPrevResult[index]);
            result = hasChanges?true:false;
        } else {
            result = true;
        }
        return result;
    }

    invokeChangeResultHandler(){
        if(this.handleChangeResult){
            if(this.iswrdResultsChanged()){
                this.handleChangeResult();
            }
            this.wordCmpPrevResult = [...this.wordCmpResult];
        }
        if(this.cmpStatus === "Success"){
            this.stopComparison();
        }
    }



    processResult(results:Array<Array<SRResultAlternative>>){
        console.log("***");
        if(this.cmpStatus === "Success" || this.cmpStatus === "TimeoutElapsed"){
            return;
        }
        if(this.commandDetector){
            if(this.cmpStatus !== "CommandMode"){
                if(this.commandDetector.hasCmdActivatorPhrase(results)){
                    this.cmpStatus = "CommandMode";
                }        
            }
            if(this.cmpStatus === "CommandMode"){
                this.commandDetector.detectCommand(results);
                return;
            }
        }
        results.forEach(r=>{
            r.forEach(rr=>{
                let recognizedText:string = rr.transcript;
                this.invokeComparison(recognizedText)
                this.invokeChangeResultHandler();
            })
        })                
    }

    getWrdCmpResult():boolean[]{
        if(this.cmpStatus !== 'Processing' && this.cmpStatus !== "Success"){
            return [];
        }
        return [...this.wordCmpResult];
    }

    invokeComparison(recognizedText:string){
        let etalonWords = this.etalonText.split(" ");
        let words:string[] = recognizedText.split(" ");
        let matchedWrdCounter = 0;
        for(let wrdInd:number = 0;wrdInd<words.length;wrdInd++){
            if(this.cmpStatus === "Success" || this.cmpStatus === "TimeoutElapsed"){
                return;
            }
            if(wrdInd >= etalonWords.length){
                return;
            }
            let etalonWord:string = etalonWords[wrdInd].toLocaleLowerCase();
            let resultWord:string = words[wrdInd].toLowerCase();            
            if(etalonWord === resultWord){
                this.wordCmpResult[wrdInd] = true;
                matchedWrdCounter++;
            }
            let matchedPercent = (matchedWrdCounter/etalonWords.length)*100;
            if(matchedPercent>this.currentMaxPercentOfMatches){
                this.currentMaxPercentOfMatches = matchedPercent;
            }
            if(matchedPercent>=this.pcLimit){
                this.cmpStatus = "Success";
                return
            }
        }
    }

}

const SRResultComparer = new SRResultComparerClass();
export default SRResultComparer;

