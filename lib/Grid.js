class Cell {
    constructor(i, j, isRight) {
        this.i = i; // Horizontal grid coordinate, from left to right
        this.j = j; // Vertical grid coordinate, from top to bottom
        this.isRight = isRight; // Direction of the bottom-to-top in a cell
    }
    get isLeft() { return !this.isRight; }
};

export default class Grid {
    constructor(width = 6, height = 6) {
        this.width = width; // Grid width
        this.height = height; // Grid height
        this.cells = []; // Linear storage of the cells -- Cells need to be access with `get(i, j)`

        if (width === 0 && height === 0) {
            // To ease the debugging
            this.populateTestGrid();
        }
        else {
            // With random distributions
            this.populateGrid();
        }
    }

    populateTestGrid() {
        this.width = 6;
        this.height = 4;
        const patterns = '><><><' + '<><<>>' + '<<>>><' + '><<>><';
        for (let i = 0; i < 24; i += 1) {
            this.cells.push(new Cell(i % 6, parseInt(i / 6), patterns.charAt(i) === '>'));
        }
    }

    populateGrid() {
        const limit = this.width * this.height;
        for (let i = 0; i < limit; i += 1) {
            this.cells.push(new Cell(i % this.width, parseInt(i / this.width), Math.random() < 0.5));
        }
    }

    get(i, j) { // i: from left to right, j: from top to bottom
        if (i < 0 || (this.width - 1 < i) || j < 0 || (this.height - 1 < j)) {
            return null;
        }
        return this.cells[j * this.width + i];
    }

    getClosedPaths() {
        let closedPaths = [];
        for (let i = 0; i < this.height - 1; i += 1) { // No need to parse the last line, closed paths should have started and been discovered before
            for (let j = 0; j < this.width - 1; j += 1) { // No need to parse the last column, closed paths should have started and been discovered before
                if (this.get(j, i).isRight) {
                    closedPaths = Grid.pushIfUnique(closedPaths, this.checkPath([this.get(j, i)], true));
                }
            }
        }
        return closedPaths;
    }

    checkPath(path, progressing) {
        let paths = [],
            lastCell = path[path.length - 1],
            cells, directions, progressings;

        if (lastCell.isRight) {
            directions = [false, true, false];
            if (progressing) {
                //  a  b
                // [/] c
                cells = [this.get(lastCell.i, lastCell.j - 1), this.get(lastCell.i + 1, lastCell.j - 1), this.get(lastCell.i + 1, lastCell.j)];
                progressings = [false, true, true];
            }
            else { // if (!progressing) {
                //  c [/]
                //  b  a
                cells = [this.get(lastCell.i, lastCell.j + 1), this.get(lastCell.i - 1, lastCell.j + 1), this.get(lastCell.i - 1, lastCell.j)];
                progressings = [true, false, false];
            }
        }
        else { // if (!lastCell.isRight) {
            directions = [true, false, true];
            if (progressing) {
                // [\] a
                //  c  b
                cells = [this.get(lastCell.i + 1, lastCell.j), this.get(lastCell.i + 1, lastCell.j + 1), this.get(lastCell.i, lastCell.j + 1)];
                progressings = [true, true, false];
            }
            else { // if (!progressing) {
                //  b  c
                //  a [\]
                cells = [this.get(lastCell.i - 1, lastCell.j), this.get(lastCell.i - 1, lastCell.j - 1), this.get(lastCell.i, lastCell.j - 1)];
                progressings = [false, false, true];
            }
        }

        this.processCell(paths, path, 0, cells, directions, progressings);
        this.processCell(paths, path, 1, cells, directions, progressings);
        this.processCell(paths, path, 2, cells, directions, progressings);

        return paths;
    }

    processCell(paths, path, idx, cells, expectedRights, progressings) {
        // Check if side cells are blocking the progression
        if (Grid.isSideBlocking(path, cells[(idx + 1) % 3], expectedRights[(idx + 1) % 3])) {
            return;
        }
        if (Grid.isSideBlocking(path, cells[(idx + 2) % 3], expectedRights[(idx + 2) % 3])) {
            return;
        }

        // Check if the current cell is correctly oriented (left or right)
        var currentCell = cells[idx];
        if (expectedRights[idx] && (currentCell === null || !currentCell.isRight)) {
            return;
        }
        if (!expectedRights[idx] && (currentCell === null || currentCell.isRight)) {
            return;
        }

        // Stop the progression if current cell is know as the start of the current path
        if (currentCell !== null && path[0] === currentCell) {
            paths.push(path); // This is a closed circuit
            return;
        }

        // Continue the progression if the current cell is still not known in the current path
        if (!Grid.isInPath(path, currentCell)) {
            paths = Grid.pushIfUnique(paths, this.checkPath(path.concat(currentCell), progressings[idx]));
        }
    }

    static isInPath(path, cell) {
        for (let i = 0, limit = path.length; i < limit; i += 1) {
            if (path[i] === cell) {
                return true;
            }
        }
        return false;
    }

    static isSideBlocking(path, cell, isExpectedRight) {
        if (cell === null || cell.isRight !== isExpectedRight) {
            return false;
        }
        return Grid.isInPath(path, cell);
    }

    static pushIfUnique(targetList, candidates) {
        for (let candidateIdx = 0; candidateIdx < candidates.length; candidateIdx += 1) {
            let pathFound = false;
            for (let targetIdx = 0; !pathFound && targetIdx < targetList.length; targetIdx += 1) {
                pathFound = Grid.comparePaths(candidates[candidateIdx], targetList[targetIdx]) === 0;
            }
            if (!pathFound) {
                targetList.push(candidates[candidateIdx]);
            }
        }
        return targetList;
    }

    static comparePaths(a, b) {
        const length = a.length;
        if (length !== b.length) {
            // Different length => not the same
            return 1;
        }

        let firstCell = a[0],
            gap = 0;
        while (gap < length) {
            // Get the gap between the beginning of `b` and the cell with the same value of `a[0]`
            if (b[gap] === firstCell) {
                break;
            }
            gap += 1;
        }
        if (gap == length) {
            // First cell of `a` not found in `b` => not the same
            return -1;
        }

        let sameCellFound = true;
        for (let i = 1; sameCellFound && i < length; i += 1) {
            let cell = a[i];
            sameCellFound = (b[(gap + i) % length] === cell) || (b[(gap - i + length) % length] === cell);
        }

        // One difference => not the same
        return sameCellFound ? 0 : -1;
    }
};
