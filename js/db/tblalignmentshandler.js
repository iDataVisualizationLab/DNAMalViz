class TblAlignmentsHandler {
    constructor(theDb) {
        this.theDb = theDb;
    }
    put(alignment, onSuccess) {
        //By default the alignment is undefined
        alignment.alignment = 'UNDEFINED';
        const tx = this.theDb.transaction('tblAlignments', 'readwrite');
        const tbl = tx.objectStore('tblAlignments');
        const updateRequest = tbl.put(alignment);
        updateRequest.onsuccess = onSuccess;
    }
    updateAlignment(alignmentResult, onSuccess){
        //By default the alignment is undefined
        const tx = this.theDb.transaction('tblAlignments', 'readwrite');
        const tbl = tx.objectStore('tblAlignments');
        let request = tbl.get(alignmentResult.alignmentId);
        request.onsuccess = () =>{
            let row = request.result;
            if(row!==undefined){
                row.alignment = alignmentResult.alignment;
                const updateRequest = tbl.put(row);
                updateRequest.onsuccess = onSuccess;
            }
        };
    }
    loadAll(onSuccess) {
        const tx = this.theDb.transaction('tblAlignments', 'readonly');
        const tbl = tx.objectStore("tblAlignments");
        let request = tbl.getAll();
        request.onsuccess = () => {
            let rows = request.result;
            onSuccess(rows);
        }
    }
    getNotAlignedCursor(onSuccess){
        const tx = this.theDb.transaction('tblAlignments', 'readonly');
        const tbl = tx.objectStore("tblAlignments");

        const idx = tbl.index('alignmentIndex');

        idx.openCursor(IDBKeyRange.only('UNDEFINED')).onsuccess = (evt)=>{
            const cursor = evt.target.result;
            onSuccess(cursor);
        }
    }
    getNotAlignedCount(onSuccess){
        this.loadAll(rows=>{
            onSuccess(rows.filter(r=>r.alignment === "UNDEFINED").length);
        });
    }
    getAlignmentCursor(onSuccess){
        const tx = this.theDb.transaction('tblAlignments', 'readonly');
        const tbl = tx.objectStore("tblAlignments");
        tbl.openCursor().onsuccess = (evt)=>{
            const cursor = evt.target.result;
            onSuccess(cursor);
        }
    }
}