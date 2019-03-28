const DEFAULT_MIN_CELL_WITH = 15;
const DEFAULT_MAX_CELL_WITH = 25;
const DEFAULT_MIN_CELL_HEIGHT = 15;
const DEFAULT_MAX_CELL_HEIGHT = 25;
const DEFAULT_TRANSITION_DURATION = 500;
const VS_STR = "*vs*";

class CorrelationMatrix {
    constructor(svgGroup, options = {}) {
        options.minCellWidth = options.minCellWidth ? options.minCellWidth : DEFAULT_MIN_CELL_WITH;
        options.maxCellWidth = options.maxCellWidth ? options.maxCellWidth : DEFAULT_MAX_CELL_WITH;
        options.minCellHeight = options.minCellHeight ? options.minCellHeight : DEFAULT_MIN_CELL_HEIGHT;
        options.maxCellHeight = options.maxCellHeight ? options.maxCellHeight : DEFAULT_MAX_CELL_HEIGHT;
        options.transitionDuration = options.transitionDuration ? options.transitionDuration : DEFAULT_TRANSITION_DURATION;
        this.options = options;
        this.svgGroup = svgGroup;
    }

    draw(variables) {
        this.variables = variables;
        const self = this;
        const svgGroup = this.svgGroup;
        //Calculate the scale.
        const heightScale = d3.scaleLinear().domain(d3.extent(this.variables.map(d => d.sequenceLength))).range([this.options.minCellHeight, this.options.maxCellHeight]);
        const widthScale = d3.scaleLinear().domain(d3.extent(this.variables.map(d => d.sequenceLength))).range([this.options.minCellWidth, this.options.maxCellWidth]);

        let rows = svgGroup.selectAll(".row").data(this.variables, d => idSanitizer(d.sequenceId));
        const newRows = rows.enter().append("g").attr("class", "row").call(setRowAttributes);
        rows.exit().call(fadeOutThenRemove);
        rows = newRows.merge(rows);
        rows.transition().duration(self.options.transitionDuration).call(setRowAttributes);


        let cells = rows.selectAll(".cell").data((d, i) => self.variables.slice(0, i),
            //TODO: Check again this section since we may see duplicated cellId
            function (d) {
                return idSanitizer(combinePair(this.__data__.sequenceId, d.sequenceId, VS_STR));
            });

        const newCells = cells.enter().append("rect").attr("class", "cell").attr("id", function (d) {
            //TODO: Check again this section since we may see duplicated cellId
            return idSanitizer(combinePair(this.parentElement.__data__.sequenceId, d.sequenceId, VS_STR));
        })
            .attr("x", (d, i) => getPosition(i, widthScale)).attr("y", 0)
            .attr("width", (d) => widthScale(d.sequenceLength))
            .attr("height", function () {
                return heightScale(this.parentElement.__data__.sequenceLength);
            })
            .attr("fill", "gray").attr("stroke-width", 0.5).attr("stroke", "black")

        cells.exit().call(fadeOutThenRemove);

        cells = newCells.merge(cells);
        //Update only positions of the cells
        cells.transition().duration(self.options.transitionDuration)
            .attr("x", (d, i) => getPosition(i, widthScale)).attr("y", 0);

        cells.on("mouseover", function (d) {
            let thePair = self.getRowCellDataPair(this.id);
            self.highlightLabels(thePair.map(lb => idSanitizer(lb)));
            self.highlightCellsOfPair(thePair);
        });
        cells.on("mouseout", function (d) {
            self.highlightLabels([]);
            self.highlightCellsOfPair([])
        });
        let labels = rows.selectAll(".label").data((d, i) => [{
            text: d.sequenceId,
            x: getPosition(i, widthScale),
            y: heightScale(d.sequenceLength)/2
        }], d => idSanitizer(d.text));
        const newLabels = labels.enter().append("text").attr("class", "label").attr("id", d => idSanitizer(d.text)).attr('alignment-baseline', 'middle');
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
            theRow.attr("transform", (d, i) => {
                return `translate(0, ${getPosition(i, heightScale)})`;
            });
        }


        function getPosition(theIndex, sizeScale) {
            let position = 0;
            let curr = null;
            for (let i = 0; i < theIndex; i++) {
                curr = sizeScale(self.variables[i].sequenceLength);
                position += curr;
            }
            return position;
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
                cellIds.push(idSanitizer(combinePair(v.sequenceId, p, VS_STR)));
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
            const cellIds = this.variables.map(v => idSanitizer(combinePair(v.sequenceId, theLabel, VS_STR)));
            this.highlightCells(cellIds);
        }
    }

    corrColor(corrValue) {
        return d3.interpolateRdBu(d3.scaleLinear().domain([0, 100]).range([1, 0])(corrValue));
    }


    updateColor(cellId, color) {
        let self = this;
        const cell = this.svgGroup.select(`#${cellId}`);
        cell.transition().duration(this.options.transitionDuration).attr("fill", color);
        //Update the on click (since changing color means changing alignment too).
        cell.on("click", function (d) {
            let thePair = self.getRowCellDataPair(this.id);
            //Either way
            let theAlignment = currentAlignments.filter(alm => ((alm.asequenceId === thePair[0] && alm.bsequenceId === thePair[1]) || (alm.asequenceId === thePair[1] && alm.bsequenceId === thePair[0])));
            let x = d3.event.pageX;
            let y = d3.event.pageY;
            openFloatingBox('controlPanelContainer', x, y, () => {
                if (theAlignment.length > 0) {
                    document.getElementById('alignment').innerHTML = theAlignment[0].alignment;
                } else {
                    document.getElementById('alignment').innerHTML = '';
                }
            });
        });
    }

    getRowCellDataPair(cellId) {
        const theCell = this.svgGroup.select("#" + cellId);
        const rowData = theCell.node().parentElement.__data__;
        const cellData = theCell.node().__data__;
        return [rowData.sequenceId, cellData.sequenceId];
    }

}