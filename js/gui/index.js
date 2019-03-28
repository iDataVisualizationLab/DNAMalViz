let currentSequences = [];
let currentAlignments = [];
const cm = new CorrelationMatrix(d3.select("#cmGroup"));
const ebiBatchSize = 30;
let totalNewAlignments = 0;
//TODO: Should avoid this global value.
let newAlignmentCounter = 0;

function processAlignment() {
    const data = {
        'email': 'vung.pham@ttu.edu',
        'asequence': encodeURIComponent(">../../data/Bladabindi.CSV*System\nLCATATATATATATATANEDNEDNEDANEDNEDNEDNEDNEDNEDATATATANEDNEDANEDANEDATANEDNEDANEDNEDNEDNEDATATATGNEDNEDATATNEDNEDNEDNEDATNEDNEDNEDNEDNEDNEDATATNEDNEDNEDNEDNEDNEDNEDNEDNEDNEDGNEDNEDAGATATAGATATNEDNEDANEDNEDNEDNEDATAGATATATATAGAGAGAT"),
        'bsequence': encodeURIComponent(">../../data/Bladabindi.CSV*csrss.exe\nCSCSCGCGCGCGCSCSCGCGCGCGCSCSCGCGCGCGSCSCGCGCGCGCGCGSCSRCSCTRCTVCSCSCGCGCGCGCGCGCGCGCGCGCGCGCSCSCGCGCGCGCSCSCGCGCGCGSCSCSCSCSCGCGCGCGCSCSCGCGCGCGC")
    };
    startWSWorker('js/ws/alignwebworker.js', data, (result) => {
        console.log(result);
    }, 0);
}

function loadData(dataFiles) {
    getDb(db => {
        const tbl = new TblProcessedFilesHandler(db);
        tbl.loadAll(existingFiles => {
            existingFiles = existingFiles.map(f => f.fileName);
            let newFiles = _.difference(dataFiles, existingFiles);
            processFiles(newFiles);
        });
    });
}

function processFiles(fileNames) {
    if (fileNames && fileNames.length > 0) {
        let i = 0;
        processFile(i);

        function processFile(i) {
            const fileName = fileNames[i];
            //Insert this file in processed db
            getDb(db => {
                const tbl = new TblProcessedFilesHandler(db);
                tbl.put(fileName, () => {
                    startDataWorker('js/data/processdataworker.js', "../../data/" + fileName, (result) => {
                        if (result.sequenceId) {
                            currentSequences.push(result.sequenceId);
                            result = result.text;
                        }

                        showMessage(result);

                        if (result === "Done") {
                            //TODO: May need to check if this place to update the GUI is reasonable.
                            //Redraw the whole sequence with order
                            currentSequences = sortSequences(currentSequences);
                            cm.draw(currentSequences);

                            i++;
                            if (i < fileNames.length) {
                                //Continue to process next file
                                processFile(i);
                            } else {
                                hideMessage();
                                //Now we need to process the alignments
                                const tblSequences = new TblSequencesHandler(db);
                                tblSequences.loadAll(existingSequences => {
                                    const alignedSequences = existingSequences.filter(sq => sq.status == 1);
                                    const newSequences = existingSequences.filter(sq => sq.status == 0);
                                    const m = newSequences.length;
                                    const n = alignedSequences.length;

                                    const tblAlignments = new TblAlignmentsHandler(db);
                                    while (newSequences.length > 0) {
                                        const seq = newSequences.shift();
                                        //Align it with every existing sequence
                                        alignedSequences.forEach(alignedSequence => {
                                            //We sort it since a vs b is the same as b vs a => so we stay with one which is a vs b.
                                            const thePair = [seq.sequenceId, alignedSequence.sequenceId].sort();
                                            const alm = {
                                                alignmentId: combinePair(thePair[0], thePair[1], VS_STR),
                                                asequenceId: thePair[0],
                                                bsequenceId: thePair[1],
                                                alignment: 'UNDEFINED'
                                            };
                                            tblAlignments.put(alm, () => {
                                                //TODO: May need to check if this place to update the GUI is reasonable.
                                                //Update the alignment on cells.
                                                setAlignmentColor(alm);
                                                showMessage("Added " + (++totalNewAlignments) + " alignments.");
                                                if (totalNewAlignments == ((m * n) + ((m - 1) * m) / 2)) {//Done adding alignment

                                                    showMessage("Done");
                                                    hideMessage();
                                                    //Start processing alignments.
                                                    processAlignments();
                                                }
                                            });
                                        });
                                        seq.status = 1;
                                        //Update the sequence status as 1
                                        tblSequences.put(seq);
                                        //Add this sequence to the aligned sequence set
                                        alignedSequences.push(seq);
                                    }
                                });
                            }
                        }
                    });
                });
            });

        }
    }
}

function loadExistingSequences() {
    getDb(db => {
        const tbl = new TblSequencesHandler(db);
        tbl.getSequenceCursor((cursor) => {
            if (cursor) {
                currentSequences.push(cursor.value.sequenceId);
                cm.draw(currentSequences);
                cursor.continue();
            } else {
                //When cursor = null, means it is done, then sort and draw again.
                //Do the sorting here.
                currentSequences = sortSequences(currentSequences);
                cm.draw(currentSequences);
            }
        });
    });
}

function sortSequences(sequences) {
    const items = sequences.map(d => {
        return {
            sequenceId: d,
            processName: extractProcessId(d)
        };
    });
    items.sort((a, b) => {
        if (malwares.indexOf(a.processName) >= 0 && malwares.indexOf(b.processName) < 0) {
            return 1;
        } else if (malwares.indexOf(a.processName) < 0 && malwares.indexOf(b.processName) >= 0) {
            return -1;
        } else {
            return b.processName.localeCompare(a.processName);
        }
    });
    return items.map(d => d.sequenceId);
}

function loadExistingAlignments() {
    getDb(db => {
        const tbl = new TblAlignmentsHandler(db);
        tbl.getAlignmentCursor((cursor) => {
            if (cursor) {
                const alm = cursor.value;
                currentAlignments.push(alm);
                setAlignmentColor(alm);
                //continue next step
                cursor.continue();
            }
        });
    })
}

function setAlignmentColor(alm) {
    //Get the identity value
    const identity = extractIdentity(alm.alignment);
    let color = 'blue';
    if (identity === 'FAILURE') {
        //TODO: color for failure case
        color = 'white';
    } else if (identity === 'UNDEFINED') {
        //TODO: color for undefined case
        color = 'gray';
    } else {
        color = cm.corrColor(identity);
    }
    //The correlation might either be a vs b or b vs a so we check both case
    const id = idSanitizer(combinePair(alm.asequenceId, alm.bsequenceId, VS_STR));

    //Update either one of them
    cm.updateColor(id, color);

}

function processAlignments(onSuccess) {
    let wsBatch = [];

    getDb(db => {
        const tblAlignments = new TblAlignmentsHandler(db);
        tblAlignments.getNotAlignedCursor(cursor => {
            if (cursor) {
                wsBatch.push(cursor.value);
                if (wsBatch.length < ebiBatchSize) {
                    cursor.continue();
                } else {
                    requestAlignments(wsBatch, () => {
                        console.log("Done alignment batch");
                        processAlignments(onSuccess);
                    });
                }
            } else {
                requestAlignments(wsBatch, () => {
                    console.log("Done alignment batch");
                    console.log('Cursor is null');
                    showMessage("Fetches all alignments from web");
                    hideMessage();
                });
            }
        });
    });
}

function requestAlignments(batch, onSuccess) {
    console.log(batch);
    let counter = 0;
    batch.forEach((al, i) => {
        getDb(db => {
            const tblSequences = new TblSequencesHandler(db);
            const tblAlignments = new TblAlignmentsHandler(db);
            if (!al.asequenceId || !al.bsequenceId) {
                debugger;
            }
            tblSequences.get(al.asequenceId, (asequence) => {
                tblSequences.get(al.bsequenceId, (bsequence) => {
                    const data = {
                        alignmentId: al.alignmentId,
                        asequenceId: asequence.sequenceId,
                        bsequenceId: bsequence.sequenceId,
                        alignmentData: {
                            'asequence': asequence.sequence,
                            'bsequence': bsequence.sequence
                        }
                    };

                    startWSWorker('js/ws/alignwebworker.js', data, (result) => {
                        //TODO: May need to check if this place to update the GUI is reasonable.
                        currentAlignments.push(result);
                        setAlignmentColor(result);

                        tblAlignments.updateAlignment(result, () => {
                            newAlignmentCounter++;
                            showMessage(`Fetching ${newAlignmentCounter}/${totalNewAlignments} alignments`);
                            if(newAlignmentCounter === totalNewAlignments){
                                hideMessage();
                            }
                        });
                        counter++;
                        let batchCounter = counter % batch.length;
                        console.log(counter);
                        if (batchCounter === 0) {
                            //TODO: Need to check this
                            resetWorkers();
                            onSuccess();
                        }
                    }, i);
                });
            });
        });

    });
}