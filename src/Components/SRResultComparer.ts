import { SpeechRecognizer, SRResultAlternative } from "./SpeechRecognizer";
import { ICommandDetector } from "./SRResultCmdDetector";

type TCmpStatus = "Undefined"|"Processing"|"CommandMode"|"Success"|"TimeoutElapsed";

class SRResultComparerClass{
    etalonText:string = "";
    pcLimit:number = 90;
    handleComplete:((result:boolean)=>void)|null = null;
    cmpStatus:TCmpStatus = "Undefined";
    currentMaxPercentOfMatches = 0;
    commandDetector:ICommandDetector|null = null;

    constructor(){
        this.processResult = this.processResult.bind(this);
        this.onTimeoutElapsed = this.onTimeoutElapsed.bind(this);
        SpeechRecognizer.subscribeOnResult(this.processResult);
    }

    connectCommandDetector(cmdDetector:ICommandDetector){
        this.commandDetector = cmdDetector;
    }

    startNewComparison(text:string,timeout:number,onCompleteHandler:(result:boolean)=>void){
        this.cmpStatus = "Processing";
        this.currentMaxPercentOfMatches = 0;
        this.etalonText = text;
        this.handleComplete = onCompleteHandler;
        SpeechRecognizer.start();
        setTimeout(this.onTimeoutElapsed,timeout);
    }

    stopComparison(){
        this.cmpStatus = "Undefined";
        this.returnResult();
    }

    onTimeoutElapsed(){
        this.cmpStatus = "TimeoutElapsed";
        this.returnResult();
    }

    returnResult(){
        let result = (this.cmpStatus === "Success");
        if(this.handleComplete){
            this.handleComplete(result);
        }
        this.handleComplete = null;
        SpeechRecognizer.stop();
    }


    processResult(results:Array<Array<SRResultAlternative>>){
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
                this.compareResult(recognizedText)
                if(this.cmpStatus === "Success"){
                    this.returnResult();
                }
            })
        })                
        let s=1;
    }

    compareResult(recognizedText:string){
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
            let etalogWord:string = etalonWords[wrdInd].toLocaleLowerCase();
            let resultWord:string = words[wrdInd].toLowerCase();
            if(etalogWord === resultWord){
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

