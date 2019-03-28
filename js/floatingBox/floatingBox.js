function openFloatingBox(theBox, x, y, onSuccess) {
    $("#" + theBox).animate({
        opacity: '1.0',
        display: 'block',
        'z-index': 9,
    });
    x = x ? x : 0;
    y = y ? y : 0;

    $("#"+theBox).css("left", x + "px");
    $("#"+theBox).css("top", y + "px");
    $("#"+theBox).css('visibility', 'visible');
    if (onSuccess) {
        onSuccess(theBox);//Can do something like: $("#" + theButton).fadeTo(1000, 1.0);
    }
}

function closeFloatingBox(theBox, onSuccess) {
    $("#" + theBox).animate({
        opacity: '0.0',
        display: 'none',
        'z-index': 0
    });
    $("#"+theBox).css("visibility", "hidden");
    if (onSuccess) {
        onSuccess(theBox);//Can do somehting like $("#" + theButton).fadeTo(1000, 1.0);
    }
}

let xOffset = 0;
let yOffset = 0;

function boxDragStarted() {
    let obj = d3.select(this);
    xOffset = d3.event.x - obj.node().getBoundingClientRect().x;
    yOffset = d3.event.y - obj.node().getBoundingClientRect().y;

}

function boxDragged() {
    d3.event.sourceEvent.stopPropagation();
    let obj = d3.select(this);
    let xCoord = d3.event.x - xOffset;
    let yCoord = d3.event.y - yOffset;
    obj.style("left", xCoord + "px");
    obj.style("top", yCoord + "px");

}

function boxDragEnded() {
    d3.event.sourceEvent.stopPropagation();
}

$(document).ready(() => {
    d3.selectAll(".floatingBox").call(d3.drag().on("start", boxDragStarted).on("drag", boxDragged).on("end", boxDragEnded));
    $(document).keyup(function (e) {
        if (e.keyCode == 27) {

        }
    });
});