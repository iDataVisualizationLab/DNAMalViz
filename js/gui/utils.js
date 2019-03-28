function extractIdentity(alignmentResult) {
    if (alignmentResult === "FAILURE" || alignmentResult === "UNDEFINED") {
        return alignmentResult;//Can't extract failure or undefined alignments
    }
    const re = /# Identity:.*\(.*\)/;
    const matches = re.exec(alignmentResult);
    const match = matches[0];
    let parts = match.split('(');
    if (parts.length >= 2) {
        parts = parts[1].split('%');
        if (parts.length >= 2) {
            return +parts[0];
        }
    }
    return -1;//error extracting the identity
}
//This util is needed since a vs b is the same as b vs a => so we will switch the order becomes avsb for all keys
function combinePair(a, b, joinStr){
    //We order then join.
    return [a, b].sort().join(joinStr);
}

function extractProcessId(sequenceId) {
    let parts = sequenceId.split('*');
    if (parts.length > 1) {
        return parts[parts.length - 1];
    } else {
        throw 'Wrong sequenceId format';
    }

}

function idSanitizer(theId) {
    let result = theId.slice();
    result = result.replace(/[>,\*,\.]/g, '');
    return result;
}