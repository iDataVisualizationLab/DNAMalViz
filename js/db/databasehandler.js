function getDb(onsuccess){
    let db;
    let tblProcessedFiles;
    let tblSequences;
    let tblAlignments;

    const dbrequest = indexedDB.open("ebidb");
    dbrequest.onupgradeneeded = function(){
        db = dbrequest.result;
        if (!db.objectStoreNames.contains('tblProcessedFiles')){
            tblProcessedFiles = db.createObjectStore('tblProcessedFiles', {keyPath: 'fileName'});
        }
        if (!db.objectStoreNames.contains('tblSequences')){
            tblSequences = db.createObjectStore('tblSequences', {keyPath: 'sequenceId'});
        }
        if (!db.objectStoreNames.contains('tblAlignments')) {
            tblAlignments = db.createObjectStore('tblAlignments', {keyPath: 'alignmentId'});
            tblAlignments.createIndex('alignmentIndex', 'alignment');
        }
    };
    dbrequest.onsuccess = function () {
        db = dbrequest.result;
        onsuccess(db);
    }
}
