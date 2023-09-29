//@ts-ignore
const speechRecognition  = webkitSpeechRecognition || SpeechRecognition;

class SpeechRecognizerClass {
    recEngineInstance:any;
    constructor(){
        this.recEngineInstance = new speechRecognition();
        this.recEngineInstance.continuous = true;
        this.recEngineInstance.interimResults = true;
        this.recEngineInstance.maxAlternatives = 3;
        this.recEngineInstance.lang = 'ru-RU';
        this.recEngineInstance.onstart = () => {
             console.log('Распознавание голоса запущено')
        };
        this.recEngineInstance.onerror = ( error:any ) => {
            console.error(error)
        };

        this.recEngineInstance.onresult = (e:any)=>{
            console.log(e);
        };

    }

    start(){
        this.recEngineInstance.start();
    }


}

export const SpeechRecognizer = new SpeechRecognizerClass();

