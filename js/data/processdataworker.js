importScripts("../../lib/d3.v5.min.js", "opList.js", "processdata.js", "../db/databasehandler.js", "../db/tblprocessedfileshandler.js", "../db/tblsequenceshandler.js");
onmessage = function (e) {
    let fileName = e.data;
    //Now read the file
    let msg = "Loading the file: " + fileName;
    postMessage(msg);
    loadData(fileName).then(data => {
        getDb(db => {
            const tblSequence = new TblSequencesHandler(db);
            const n = data.length;
            data.forEach((sequence, i) => {
                sequence.status = 0;//It is not aligned yet
                tblSequence.put(sequence, () => {
                    postMessage({text: `${msg}, added ${i + 1}/${n} sequences`, sequenceId: sequence.sequenceId});
                    //Post 'Done'
                    if(i==n-1){
                        postMessage("Done");
                    }
                });
            });
        });
    });
}