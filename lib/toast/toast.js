function toast(message, timeout = 3000) {
    showMessage(message);
    hideMessage(timeout);
}

function showMessage(htmlMsg) {
    toast.message = htmlMsg;
    // Get the snackbar DIV
    let x = document.getElementById("snackbar");
    x.innerHTML = htmlMsg;
    // Add the "show" class to DIV
    x.className = "show";
}

function hideMessage(timeout=3000) {
    // Get the snackbar DIV
    let x = document.getElementById("snackbar");
    x.className = x.className.replace("show", "hide");
    // After 3 seconds, remove the show class from DIV
    setTimeout(function () {
        x.className = x.className.replace("hide", "");
    }, timeout);
}