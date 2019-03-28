importScripts("accesswebservice.js");
onmessage = function(e){
    const data = e.data;
    const alignmentId = data.alignmentId;
    const asequenceId = data.asequenceId;
    const bsequenceId = data.bsequenceId;
    let alignmentData = data.alignmentData;
    alignmentData.email = 'vung.pham@ttu.edu';
    send(alignmentData, (result)=>{
        postMessage({
            alignmentId: alignmentId,
            asequenceId: asequenceId,
            bsequenceId: bsequenceId,
            alignment: result
        });
    });
}