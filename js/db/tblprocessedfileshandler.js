class TblProcessedFilesHandler{
    constructor(theDb){
        this.theDb = theDb;
    }
    put(fileName, onSuccess) {
        const tx = this.theDb.transaction('tblProcessedFiles', 'readwrite');
        const tblProcessedFiles = tx.objectStore('tblProcessedFiles');
        let request = tblProcessedFiles.get(fileName);
        request.onsuccess = () =>{
            let row = request.result;
            if(row!==undefined){
                row.fileName = fileName;
            }else{
                row = {
                    'fileName': fileName
                };
            }
            const updateRequest = tblProcessedFiles.put(row);
            updateRequest.onsuccess = onSuccess;
        };
    }
    loadAll(onSuccess){
        const tx = this.theDb.transaction('tblProcessedFiles', 'readonly');
        const tbl = tx.objectStore("tblProcessedFiles");
        let request = tbl.getAll();
        request.onsuccess = ()=>{
            let rows = request.result;
            onSuccess(rows);
        }
    }
}