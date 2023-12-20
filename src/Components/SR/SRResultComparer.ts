import { TLanguage } from "../../CommonTypes";
import { SpeechRecognizer, SRResultAlternative } from "./SpeechRecognizer";
import { ICommandDetector } from "./SRResultCmdDetector";

type TCmpStatus = "Undefined"|"Processing"|"CommandMode"|"Success"|"TimeoutElapsed";

class SRResultComparerClass{
    etalonText:string = "";
    pcLimit:number = 90;
    handleChangeResult:(()=>void)|null = null;
    cmpStatus:TCmpStatus = "Undefined";
    cmpPrevStatus:TCmpStatus = "Undefined";
    currentMaxPercentOfMatches = 0;
    commandDetector:ICommandDetector|null = null;
    wordCmpResult:boolean[] = []; //item[i] === true means that word[i] is matched, were i - word index from etalonText string
    wordCmpPrevResult:boolean[] = [];
    timer:any = undefined;

    constructor(){
        this.processResult = this.processResult.bind(this);
        this.onTimeoutElapsed = this.onTimeoutElapsed.bind(this);
        SpeechRecognizer.subscribeOnResult(this.processResult);
    }

    connectCommandDetector(cmdDetector:ICommandDetector){
        this.commandDetector = cmdDetector;
    }

    setNewCmpStatus(newStatus:TCmpStatus){
        this.cmpPrevStatus = this.cmpStatus;
        this.cmpStatus = newStatus;
    }

    startNewComparison(text:string,lang:TLanguage,timeout:number,onChangeResultHandler:()=>void){
        this.setNewCmpStatus("Processing");
        this.currentMaxPercentOfMatches = 0;
        this.etalonText = text;
        let words = this.etalonText.split(" ");
        this.wordCmpResult = new Array(words.length);
        this.wordCmpPrevResult = [];
        this.handleChangeResult = onChangeResultHandler;
        SpeechRecognizer.start(lang);
        this.timer = setTimeout(this.onTimeoutElapsed,timeout);
    }

    stopComparison(){
        clearTimeout(this.timer);
        this.handleChangeResult = null;
        SpeechRecognizer.stop();
    }

    onTimeoutElapsed(){
        this.setNewCmpStatus("TimeoutElapsed");
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
            if(this.iswrdResultsChanged() || this.cmpStatus != this.cmpPrevStatus){
                //console.log("invoke this.handleChangeResult",this.cmpStatus)
                this.handleChangeResult();
                this.cmpPrevStatus = this.cmpStatus;
            }
            this.wordCmpPrevResult = [...this.wordCmpResult];
        }
        if(this.cmpStatus === "Success"){
            if(this.handleChangeResult){
                this.handleChangeResult();
            }
            this.stopComparison();
        }
    }

    processResult(results:Array<Array<SRResultAlternative>>){
        if(this.cmpStatus === "Success" || this.cmpStatus === "TimeoutElapsed"){
            return;
        }
        results.forEach(r=>{
            r.forEach(rr=>{
                console.log(rr.transcript);
            })
        })                
        
        if(this.commandDetector){
            if(this.cmpStatus !== "CommandMode"){
                if(this.commandDetector.hasCmdActivatorPhrase(results)){
                    this.setNewCmpStatus("CommandMode");
                    SpeechRecognizer.start("en-US");
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
                this.setNewCmpStatus("Success");
                clearTimeout(this.timer);
                return
            }
        }
    }

}

const SRResultComparer = new SRResultComparerClass();
export default SRResultComparer;

