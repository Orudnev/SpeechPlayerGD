import React from 'react';
import { ISubItem } from '../CommonTypes';

class SayTextClass {
    enVoices: SpeechSynthesisVoice[] = [];
    ruVoices: SpeechSynthesisVoice[] = [];
    selectedEnVoice: SpeechSynthesisVoice | undefined = undefined;
    selectedRuVoice: SpeechSynthesisVoice | undefined = undefined;
    initCompleted = false;
    // Each new request supersedes every earlier utterance and its callbacks.
    // SpeechSynthesis can dispatch `error`/`end` after cancel(), so those
    // callbacks must not be allowed to start or complete an obsolete request.
    private requestVersion = 0;
  
    constructor() {
      this.init();
    }
  
    async init() {
      try {
        const allVoices = await this.getAllVoices();
        this.enVoices = allVoices.filter(v => v.lang === 'en-US' || v.lang === 'en_US');
        this.ruVoices = allVoices.filter(v => v.lang === 'ru-RU' || v.lang === 'ru_RU');
  
        // Prefer local (offline) voices for reliability, then by preferred names.
        this.selectedEnVoice = this.enVoices.find(v => v.localService) || 
          this.enVoices.find(v => v.name.includes('Google US English')) || this.enVoices[0];
        // this.selectedRuVoice = this.ruVoices.find(v => v.localService && (
        //   v.name === 'Microsoft Pavel - Russian (Russia)' || 
        //   v.name === 'Microsoft Irina - Russian (Russia)' || 
        //   v.name === 'Russian Russia'
        // )) || this.ruVoices.find(v => v.name === 'Google русский') || this.ruVoices[0];

        this.selectedRuVoice = this.ruVoices.find(v => v.name === 'Google русский') || this.ruVoices[0];    
        console.log('Selected EN voice:', this.selectedEnVoice?.name, '(local:', this.selectedEnVoice?.localService, ')');
        console.log('Selected RU voice:', this.selectedRuVoice?.name, '(local:', this.selectedRuVoice?.localService, ')');
  
        if (!this.selectedEnVoice) console.warn('No English voice found.');
        if (!this.selectedRuVoice) console.warn('No Russian voice found.');
  
        this.initCompleted = true;
      } catch (error) {
        console.error('Init failed:', error);
      }
    }
  
    getAllVoices() {
      return new Promise<SpeechSynthesisVoice[]>((resolve) => {
        const synth = window.speechSynthesis;
        let voices = synth.getVoices();
        if (voices.length > 0) return resolve(voices);
  
        const onVoicesChanged = () => {
          voices = synth.getVoices();
          if (voices.length > 0) {
            synth.removeEventListener('voiceschanged', onVoicesChanged);
            resolve(voices);
          }
        };
        synth.addEventListener('voiceschanged', onVoicesChanged);
        // Timeout fallback if event never fires (rare bug).
        setTimeout(() => resolve([]), 5000);
      });
    }
  
    addMessages(mrange: ISubItem[]) {
      mrange.forEach(m => this.addMessage(m));
    }
  
    addMessage(msg: ISubItem, completeHandler?: (evt: any) => void) {
      const requestVersion = ++this.requestVersion;
      if (!this.initCompleted) {
        setTimeout(() => {
          if (requestVersion === this.requestVersion) {
            this.addMessageImpl(msg, completeHandler, requestVersion);
          }
        }, 500);
        return;
      }
      this.addMessageImpl(msg, completeHandler, requestVersion);
    }
  
    addMessageImpl(msg: ISubItem, completeHandler: ((evt: any) => void) | undefined, requestVersion: number, isRetry = false) {
      if (requestVersion !== this.requestVersion) return;
      const speachMsg = new SpeechSynthesisUtterance(msg.text);
      let selectedVoice: SpeechSynthesisVoice | undefined;
  
      if (msg.lang === 'en-US') {
        selectedVoice = this.selectedEnVoice;
      } else {
        selectedVoice = this.selectedRuVoice;
      }
  
      if (selectedVoice) {
        speachMsg.voice = selectedVoice;
        speachMsg.lang = selectedVoice.lang;
      } else {
        speachMsg.lang = msg.lang; // Fallback lang.
        console.warn(`No voice for ${msg.lang}; using default.`);
      }
  
      // Error listener: Log issues (key for diagnosing Russian failures).
      speachMsg.addEventListener('error', (evt) => {
        if (requestVersion !== this.requestVersion) return;
        console.error('Speech error for', msg.lang, ':', (evt as SpeechSynthesisErrorEvent).error);
        const error = (evt as SpeechSynthesisErrorEvent).error;
        // `cancel()` intentionally reports these outcomes in some browsers.
        // They are not voice failures and must never resurrect an old phrase.
        const wasCancelled = error === 'interrupted' || error === 'canceled';
        if (!isRetry && !wasCancelled && msg.lang === 'ru-RU') {
          // Retry once with forced lang fallback (no voice set).
          console.log('Retrying Russian without specific voice...');
          const retryMsg = { ...msg };
          this.addMessageImpl(retryMsg, completeHandler, requestVersion, true);
        }
      });
  
      if (completeHandler) {
        const hndlr = (evt: any) => {
          speachMsg.removeEventListener('end', hndlr);
          if (requestVersion === this.requestVersion) {
            completeHandler(evt);
          }
        };
        speachMsg.addEventListener('end', hndlr);
      }
  
      // Keep-alive: Silent utterance to wake API (fixes idle bugs in Chrome).
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  
      window.speechSynthesis.speak(speachMsg);
    }
  
    cancelAllMessages() {
      this.requestVersion++;
      window.speechSynthesis.cancel();
    }
  
    speaking(): boolean {
      return window.speechSynthesis.speaking;
    }
  }
  
export const SayText = new SayTextClass();
