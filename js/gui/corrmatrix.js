const DEFAULT_CELL_WITH = 20;
const DEFAULT_CELL_HEIGHT = 20;
const DEFAULT_TRANSITION_DURATION = 1000;
const VS_STR = "*vs*";

class CorrelationMatrix {
    constructor(svgGroup, options = {}) {
        options.cellWidth = options.cellWidth ? options.cellWidth : DEFAULT_CELL_WITH;
        options.cellHeight = options.cellHeight ? options.cellHeight : DEFAULT_CELL_HEIGHT;
        options.transitionDuration = options.transitionDuration ? options.transitionDuration : DEFAULT_TRANSITION_DURATION;
        this.options = options;
        this.svgGroup = svgGroup;
    }

    draw(variables) {
        this.variables = variables;
        const self = this;
        const options = self.options;
        const svgGroup = this.svgGroup;
        let rows = svgGroup.selectAll(".row").data(this.variables, d => d);
        const newRows = rows.enter().append("g").attr("class", "row").call(setRowAttributes);
        rows.exit().call(fadeOutThenRemove);
        rows = newRows.merge(rows);
        rows.transition().duration(self.options.transitionDuration).call(setRowAttributes);


        let cells = rows.selectAll(".cell").data((d, i) => self.variables.slice(0, i), function (d) {
            return idSanitizer(combinePair(this.__data__, d, VS_STR));
        });

        const newCells = cells.enter().append("rect").attr("class", "cell").attr("id", function (d) {
            return idSanitizer(combinePair(this.parentElement.__data__, d, VS_STR));
        }).call(setCellAttributes);

        cells.exit().call(fadeOutThenRemove);
        cells = newCells.merge(cells);
        cells.transition().duration(self.options.transitionDuration).call(setCellAttributes);
        cells.on("mouseover", function (d) {
            let thePair = self.getRowCellDataPair(this.id);
            self.highlightLabels(thePair.map(lb => idSanitizer(lb)));
            self.highlightCellsOfPair(thePair);
        });
        cells.on("mouseout", function (d) {
            self.highlightLabels([]);
            self.highlightCellsOfPair([])
        });
        //TODO: This section for on click should be refactored to decouple the related info in this
        cells.on("click", function (d) {
            let thePair = self.getRowCellDataPair(this.id);
            //Either way
            let theAlignment = currentAlignments.filter(alm => ((alm.asequenceId === thePair[0] && alm.bsequenceId === thePair[1]) || (alm.asequenceId === thePair[1] && alm.bsequenceId === thePair[0])));
            let x = d3.event.pageX;
            let y = d3.event.pageY;
            openFloatingBox('controlPanelContainer', x, y, () => {
                if (theAlignment.length > 0) {
                    document.getElementById('alignment').innerHTML = theAlignment[0].alignment;
                }else{
                    document.getElementById('alignment').innerHTML = '';
                }
            });
        });
        let labels = rows.selectAll(".label").data((d, i) => [{
            text: d,
            x: (i) * self.options.cellWidth,
            y: this.options.cellHeight
        }], d => d);
        const newLabels = labels.enter().append("text").attr("class", "label").attr("id", d => idSanitizer(d.text));
        labels.exit().call(fadeOutThenRemove);
        labels = newLabels.merge(labels);
        labels.call(setLabelAttributes);
        labels.on("mouseover", d => {
            self.highlightCellsOfLabel(d.text);
            self.highlightLabels([idSanitizer(d.text)]);
        });
        labels.on("mouseout", d => {
            self.highlightCellsOfLabel();
            self.highlightLabels([]);
        });

        function setLabelAttributes(theLabel) {
            theLabel.text(d => d.text).attr("transform", d => `translate(${d.x + 10}, ${d.y})rotate(-45)`).style("cursor", "pointer");
        }

        function fadeOutThenRemove(theSel) {
            theSel.transition().duration(self.options.transitionDuration).attr("opacity", 10e-6).remove();
        }

        function setRowAttributes(theRow) {
            theRow.attr("transform", (d, i) => `translate(0, ${i * options.cellHeight})`);
        }

        function setCellAttributes(theCell) {
            if (!theCell.empty()) {
                theCell.attr("x", (d, i) => i * options.cellWidth).attr("y", 0).attr("width", options.cellWidth).attr("height", options.cellHeight)
                    .attr("fill", "gray").attr("stroke-width", 0.5).attr("stroke", "black")
            }
        }
    }

    highlightLabels(labels) {
        this.svgGroup.selectAll(".label").attr("stroke", "none").attr("stroke-width", "0");
        labels.forEach(lb => {
            this.svgGroup.select("#" + lb).attr("stroke", "blue").attr("stroke-width", "1");
        });
    }


    highlightCellsOfPair(thePair) {
        const cellIds = [];
        thePair.forEach(p => {
            this.variables.forEach(v => {
                //The id might be either way
                cellIds.push(idSanitizer(combinePair(v, p, VS_STR)));
            });
        });
        this.highlightCells(cellIds);
    }

    highlightCells(cellIds) {
        //reset
        this.svgGroup.selectAll(".cell").attr("stroke", "black").attr("stroke-width", 0.5);
        //highlight
        cellIds.forEach(cId => {
            this.svgGroup.select("#" + cId).attr("stroke", "blue").attr("stroke-width", 2);
        });
    }

    highlightCellsOfLabel(theLabel) {
        if (!theLabel) {
            this.highlightCells([]);
        } else {
            const cellIds = this.variables.map(v => idSanitizer(combinePair(v, theLabel, VS_STR)));
            this.highlightCells(cellIds);
        }
    }

    corrColor(corrValue) {
        return d3.interpolateRdBu(d3.scaleLinear().domain([0, 100]).range([1, 0])(corrValue));
    }


    updateColor(cellId, color) {
        this.svgGroup.select(`#${cellId}`).transition().duration(this.options.transitionDuration).attr("fill", color);
    }

    getRowCellDataPair(cellId) {
        const theCell = this.svgGroup.select("#" + cellId);
        const rowData = theCell.node().parentElement.__data__;
        const cellData = theCell.node().__data__;
        return [rowData, cellData];
    }

}