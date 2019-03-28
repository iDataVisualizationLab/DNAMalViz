const baseURL = 'http://www.ebi.ac.uk/Tools/services/rest/emboss_water/';
const runCommand = 'run';
const statusCommand = 'status';
const resultCommand = 'result';
const rendererType = 'out';

function send(data, processAlignmentResult) {
    const url = baseURL + runCommand;
    //build string
    let postContent = "";
    let objKeys = Object.keys(data);
    //First parameter
    postContent+= `${objKeys[0]}=${data[objKeys[0]]}`;
    //Other parameters
    for (let i = 1; i < objKeys.length; i++) {
        let theKey = objKeys[i];
        postContent += `&${theKey}=${data[theKey]}`
    }
    postResource(url, postContent, (jobId)=>{
        checkStatus(jobId, processAlignmentResult);//Carry the processResult to the end result to process it.
    });
}

function checkStatus(jobId, processAlignmentResult){
    const url = baseURL + statusCommand + "/" + jobId;
    const processStatus = (status)=>{
        if(status==='FINISHED'){
            //If it is finished then we take the result.
            getResult(jobId, processAlignmentResult);
        }else if(status === "FAILURE"){
            //TODO: what to do if failed.
            processAlignmentResult(status);
        }
        else{
            setTimeout(()=>{
                checkStatus(jobId, processAlignmentResult);
            }, 1000);
        }
    };
    getResource(url, processStatus);
}

function getResult(jobId, processAlignmentResult){
    const url = baseURL + resultCommand + "/" + jobId + "/" + rendererType;
    getResource(url, processAlignmentResult);
}

//<editor-fold desc="get and set resources on the restful web service">
function getResource(url, processResult) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState != 4){
            return;
        }
        if (this.status == 200) {
            const result = this.responseText;
            processResult(result);
        }
    };
    xhr.open("GET", url, true);
    xhr.send();
}
function postResource(url, postContent, processResult){
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;
        if (this.status == 200) {
            const result = this.responseText;
            processResult(result);
        }
    };
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    xhr.send(postContent);
}
//</editor-fold>