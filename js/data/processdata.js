const opToProtein = {
    "CreateFile": "C",
    "ReadFile": "C",
    "WriteFile": "C",
    "CreateFileMapping": "C",
    "QueryBasicInformationFile": "C",

    "RegCreateKey": "G",
    "RegSetValue": "G",
    "RegSetKeySecurity": "G",
    "RegDeleteValue": "G",
    "RegFlushKey": "G",

    "Load Image": "A",
    "Process Create": "A",
    "Process Start": "A",
    "Thread Create": "A",
    "Process Exit": "A",

    "TCP Connect": "T",
    "TCP Receive": "T",
    "TCP Send": "T",
    "UDP Receive": "T",
    "UDP Send": "T"
};
const charsToRemove = ['.', '*'];
// loadAllData((f1, f2, opList) => {
//     const nucleotides1 = processProcMonData(f1, opList);
//     const nucleotides2 = processProcMonData(f2, opList);
//     // obj2blastfile(nucleotides1, "Bladabindi");
//     // obj2blastfile(nucleotides2, "Cryptowall");
//     debugger
// });


function loadData(filename) {
    return new Promise(resolve => {
        d3.csv(filename).then(data => {
            const nucleotide = processProcMonData(data, opList);
            const name = extractFileName(filename);
            const fastaRecords = obj2FastaRecords(nucleotide, name);
            return resolve(fastaRecords);
        });
    });
}

function processProcMonData(procMonData, opList) {
    const nestedByProcess = d3.nest().key(d => d.Process_Name).entries(procMonData);
    const results = {};
    nestedByProcess.forEach(d => {
        if(d.key!=="Procmon.exe"){
            results[d.key] = "";
            let prevKey = "";
            d.values.forEach(r => {
                const opG = opToProtein[r.Operation];
                //If it is the same key as the previous one, then don't add it.
                if (opG !== undefined && opG !== prevKey) {
                    results[d.key] += opG;
                    prevKey = opG;
                }
            });
        }
    });
    return results;
}
function extractFileName(filePath) {
    let parts = filePath.split("/");
    let fileName = parts[parts.length-1];
    return fileName;
}
function namingSanitizer(name) {
    let temp = name;
    charsToRemove.forEach(c => {
        temp = temp.replace(c, '');
    });
    return temp;
}

function obj2FastaRecords(obj, name) {
    let results = [];
    d3.keys(obj).forEach(key => {
        let record = "";
        //Remove '.', '*' from the name
        //TODO: should change this threshold to a more appropriate number
        if (obj[key].length >= 22) {
            let k = "";
            if (name) {
                k += `>${name}*${key}`;
            } else {
                k += `>${key}`;
            }
            record += `${k}\n${obj[key]}`;
            results.push({sequenceId: k, sequence: record});
        }
    });
    return results;
}

function obj2FastaFile(obj, name) {

}

function downloadFile(obj, name) {
    const output = obj2FastaFile(obj, name);
    let link = document.createElement('a');
    link.download = `${name}.fasta`;
    link.href = window.URL.createObjectURL(new Blob([output], {type: 'text/plain'}));
    link.click();
}