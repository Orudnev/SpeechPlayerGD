import React from 'react';
import { ISubItem } from '../CommonTypes';

class SayTextClass{
    // 'Microsoft Pavel - Russian (Russia)' - pc
    // 'Microsoft Irina - Russian (Russia)' - pc
    // 'Google русский' - pc
    // 'Russian Russia' = mobile
    enVoices:SpeechSynthesisVoice[]=[];
    ruVoices:SpeechSynthesisVoice[]=[];
    selectedEnVoice: SpeechSynthesisVoice|undefined = undefined;
    selectedRuVoice: SpeechSynthesisVoice|undefined = undefined;
    initCompleted = false;
    constructor(){
        this.init();
    }
    
    init(){
        this.getAllVoices()
        .then((allVoices:any)=>{
            this.enVoices = allVoices.filter((v:SpeechSynthesisVoice)=>v.lang === 'en-US' || v.lang === 'en_US');
            this.ruVoices = allVoices.filter((v:SpeechSynthesisVoice)=>v.lang === 'ru-RU' || v.lang === 'ru_RU');
            this.selectedEnVoice = this.enVoices[0];
            this.selectedRuVoice = this.ruVoices[0];
            this.initCompleted = true;
        });
    }

    
    getAllVoices() {
        return new Promise(
            (resolve, reject) => {
                let synth = window.speechSynthesis;
                let id = setInterval(() => {
                    if (synth.getVoices().length !== 0) {
                        resolve(synth.getVoices());
                        clearInterval(id);
                    }
                }, 10);
            }
        )
    }


    addMessages(mrange:ISubItem[]){
        mrange.forEach(m=>this.addMessage(m));
    }

    addMessage(msg:ISubItem,completeHandler?:(evt:any)=>void){
        if(!this.initCompleted){
            setTimeout(() => {
                this.addMessageImpl(msg,completeHandler);
            }, 200);
        } else {
            this.addMessageImpl(msg,completeHandler);
        }
    }

    addMessageImpl(msg:ISubItem,completeHandler?:(evt:any)=>void){
        let speachMsg = new SpeechSynthesisUtterance();
        speachMsg.text = msg.text;
        if(msg.lang === 'en-US'){
            if(this.selectedEnVoice){
                speachMsg.voice = this.selectedEnVoice; 
                speachMsg.lang = this.selectedEnVoice.lang;    
            }
        } else {
            if(this.selectedRuVoice){
                speachMsg.voice = this.selectedRuVoice;
                speachMsg.lang = this.selectedRuVoice.lang;    
            }
        }        
        if(completeHandler){
            const hndlr = (evt:any)=>{
                speachMsg.removeEventListener("end",hndlr);
                completeHandler(evt);
            };
            speachMsg.addEventListener("end",hndlr);            
        }
        if(speachMsg.voice){
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(speachMsg);
        }
    }

    cancelAllMessages(){
        window.speechSynthesis.cancel();
        
    }

    speaking():boolean{
        return window.speechSynthesis.speaking;
    }
}

export const SayText = new SayTextClass();