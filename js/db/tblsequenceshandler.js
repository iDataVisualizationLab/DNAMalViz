class TblSequencesHandler {
    constructor(theDb) {
        this.theDb = theDb;
    }
    put(sequence, onSuccess) {
        const tx = this.theDb.transaction('tblSequences', 'readwrite');
        const tbl = tx.objectStore('tblSequences');
        const updateRequest = tbl.put(sequence);
        updateRequest.onsuccess = onSuccess;
    }
    loadAll(onSuccess) {
        const tx = this.theDb.transaction('tblSequences', 'readonly');
        const tbl = tx.objectStore("tblSequences");
        let request = tbl.getAll();
        request.onsuccess = () => {
            let rows = request.result;
            onSuccess(rows);
        }
    }
    getSequenceCursor(onSuccess){
        const tx = this.theDb.transaction('tblSequences', 'readonly');
        const tbl = tx.objectStore("tblSequences");
        tbl.openCursor().onsuccess = (evt)=>{
            const cursor = evt.target.result;
            onSuccess(cursor);
        }
    }

    get(sequenceId, onSuccess){
        const tx = this.theDb.transaction('tblSequences', 'readonly');
        const tbl = tx.objectStore('tblSequences');
        if(!sequenceId){
            debugger
        }
        const request = tbl.get(sequenceId);
        request.onsuccess = ()=>{
            const sequence = request.result;
            onSuccess(sequence);
        }
    }

}