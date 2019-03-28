let dataWorker;
function startDataWorker(fileName, data, onResult){
    if(typeof (Worker) !== 'undefined'){
        if(dataWorker===undefined){
            dataWorker = new Worker(fileName);
            dataWorker.onmessage = function(e){
                onResult(e.data);
            };
        }
        dataWorker.postMessage(data);
    }else{
        throw "The browser doesn't support web worker";
    }
}
