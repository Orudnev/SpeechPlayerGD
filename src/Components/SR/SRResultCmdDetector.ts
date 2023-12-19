import { SRResultAlternative } from "./SpeechRecognizer";
import SRResultComparer from "./SRResultComparer";

export interface ICommandDetector {
    hasCmdActivatorPhrase:(results:Array<Array<SRResultAlternative>>)=>boolean;
    detectCommand:(results:Array<Array<SRResultAlternative>>)=>void;
}

export type TVoiceCommand = "CmdModeActivation" | "MarkItemAsPassed" | "GoNextItem"; 

interface IVoiceCommand{
    id:TVoiceCommand;
    phrases:string[];
}

const voiceCommands:IVoiceCommand[] = [
    {id:"CmdModeActivation",phrases:["google","coco","go go"]},
    {id:"MarkItemAsPassed",phrases:["yeah", "yes"]},
    {id:"GoNextItem",phrases:["next"]}
];


class SRResultCmdDetectorClass implements ICommandDetector{
    commandModeActivationPhrases = ["google","coco","go go"];
    commandExecutionHandler:((cmd:TVoiceCommand)=>void)|undefined;

    constructor(){
        SRResultComparer.connectCommandDetector(this);
    }

    registerHandler(handler:(cmd:TVoiceCommand)=>void){
        this.commandExecutionHandler = handler;
    }

    hasVoiceCommand(sourceText:string, cmdId:TVoiceCommand):boolean{
        sourceText = sourceText.toLocaleLowerCase();
        let cmd = voiceCommands.find(c=>c.id === cmdId);
        if(cmd){
            let foundResult = cmd.phrases.find(ph=>sourceText.includes(ph));
            if(foundResult){
                return true;
            }
        }
        return false;
    }

    hasCmdActivatorPhrase(results:Array<Array<SRResultAlternative>>){
        for(let i=0;i<results.length;i++){
            let r = results[i];
            for(let j=0;j<r.length;j++){
                let rr = r[j];
                let recognizedText:string = rr.transcript;
                if(this.hasVoiceCommand(recognizedText,"CmdModeActivation")){
                    //console.log("Start command phrase detected");
                    return true;
                }
            }
        }
        return false;
    }

    getCommand(results:Array<Array<SRResultAlternative>>):TVoiceCommand|undefined{
        let startPhraseFound = false;
        for(let i=0;i<results.length;i++){
            let r = results[i];
            for(let j=0;j<r.length;j++){
                let rr = r[j];
                let recognizedText:string = rr.transcript;
                if(!startPhraseFound){
                    if(this.hasVoiceCommand(recognizedText,"CmdModeActivation")){
                        startPhraseFound = true;
                    }    
                }
                if(startPhraseFound){
                    for(let k=0;k<voiceCommands.length;k++){
                        let cmd = voiceCommands[k];
                        if(cmd.id === "CmdModeActivation"){
                            continue;
                        }
                        if(this.hasVoiceCommand(recognizedText,cmd.id)){
                            return cmd.id;
                        }
                    }
                }
            }
        }
    }

    detectCommand(results:Array<Array<SRResultAlternative>>){
        let cmd = this.getCommand(results);
        if(cmd){
            SRResultComparer.stopComparison();
            if(this.commandExecutionHandler){
                this.commandExecutionHandler(cmd);
                //console.log(`command ${cmd} has been detected`);
            }
        }
    }
}

const SRResultCmdDetector = new SRResultCmdDetectorClass();
export default SRResultCmdDetector;