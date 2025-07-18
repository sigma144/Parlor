

//Statement types:

//No statement (None) // The gems are in a box with a statement. (When X is None) 
//This statement is unnecessary.
//Reading this statement is unnecessary.
//S statement must be true/false/could be either
//H. (Hypothetical, H)
//If it were known that S, then H. (If S then H, S, H)
//If X was blank, then H. (If X blank then H, X, H)
//If X was open, then H. (If X open then H, X, H)
//If you couldn't read S, then H. (If S hidden then H, S)
//If the colors of X and Y were swapped, then H. (If colors swapped then H)
//If S and Q were swapped, then H. (If stmts swapped then H)

//Hypotheticals:
// It would be possible that Q. *It is possible that Q. &It would be possible that Q.
// It would be impossible that Q. *It is impossible that Q. &It would still be impossible that Q.
// It would have to be true that Q. *It must be true that Q. &It would still have to be true that Q.
// There would be N valid location(s) for the gems. &There would (still) be N valid location(s) for the gems.

//Box #1: The gems are in another box with a true statement.
//Box #2: This box's statement is the same as Box #3's statement.
//Box #3: If you couldn't read this statement, you could still determine whether or not this box is true.

function displayPuzzle(puzzle) {
    for (let s of puzzle.statements) {
        let box = s.currentBox
        let el = document.getElementById("box" + (box + 1))
        el.innerHTML = s.text;
        if (s.text.length > 58) {
            el.className = "size2"
        }
    }
}

function generate(numBoxes=3, numStatements=null, duplicate=null, gemsInDuplicateBox=false) {
    //if (duplicate === null && randInt(10) == 0) {
    //    duplicate = true
    //    gemsInDuplicateBox = randInt(2)
    //}
    //else duplicate = false
    if (numStatements == null) {
        numStatements = numBoxes
        if (randInt(10) == 0) numStatements -= 1
    }
    while(true) {
        let statements = []
        let locations = []
        while (statements.length < numStatements) {
            let b = randInt(numBoxes)
            if (locations.includes(b)) continue
            statements.push(getRandomStatement(b, numBoxes))
            locations.push(b)
        }
        let swapPoint = numStatements - 1
        let swapBox = statements[swapPoint].currentBox
        console.log(statements)
        for (let trial = 0; trial < 50; trial++) {
            statements[swapPoint] = getRandomStatement(swapBox, numBoxes)
            let puzzle = {"statements": statements, "numBoxes": numBoxes}
            if (isValidPuzzle(puzzle)) {
                return puzzle
            }
        }
    }
}

function solve(puzzle, full=true) {
    let statements = puzzle.statements
    let valid_sol = []
    let boxes = []
    for (let b = 0; b < puzzle.numBoxes; b++) {
        boxes.push(new Array())
    }
    for (let s of statements) {
        boxes[s.currentBox].push(s)
    }
    for (let gems = 0; gems < puzzle.numBoxes; gems++) {
        for (let truth = 1; truth < (1 << statements.length) - 1; truth++) {
            for (let s = 0; s < statements.length; s++) {
                statements[s].value = (truth >> s) & 1
            }
            if (isLogicallyValid(statements, gems, boxes)) {
                let sol = ""
                for (let s of statements) {
                    sol += COLORS[s.currentBox] + s.value + " "
                }
                sol += " G" + COLORS[gems]
                valid_sol.push(sol)
                if (!full) break
            }
        }
    }
    return valid_sol
}

function isLogicallyValid(statements, gems, boxes) {
    for (let s of statements) {
        if (s.evaluate(statements, gems, boxes) != s.value) {
            return false
        }
    }
    return true
}

function isValidPuzzle(puzzle) {
    let statements = puzzle.statements
    if (canMetagame(statements) && randInt(10) != 0) return false
    let solution = solve(puzzle, full=false)
    if (solution.length != 1) return false
    if (hasPluralWord(statements, "BOX", "BOXES") || hasPluralWord(statements, "STATEMENT", "STATEMENTS"))
        return false
    let duplicateStmts = hasDuplicateStatement(statements)
    if (duplicateStmts && puzzle.duplicate === false || !duplicateStmts && puzzle.duplicate === true)
        return false
    if (puzzle.duplicate) {
        let gems = parseInt(solution[0][solution[0].length - 1])
        if (puzzle.gemsInDuplicateBox != duplicateStmts.includes(gems)) return false
    }
    return true
}

function canMetagame(statements) {
    let boxes = new Set()
    for (const stmt of statements) {
        let box = stmt.boxHasGems
        if (stmt.word) {
            let words = []
            for (let s = 0; s < statements.length; s++) {
                if (statements[s].text.includes(stmt.word))
                    words.push(s)
            }
            if (words.length == 1) box = words[0]
        }
        if (box === undefined) continue
        if (box === -1) return false
        boxes.add(box)
    }
    return boxes.size == 1
}

function hasDuplicateStatement(statements) {
    for (let s1 = 0; s1 < statements.length; s1++) {
        for (let s2 = s1 + 1; s2 < statements.length; s2++) {
            if (s1 == s2) continue
            if (statementsAreIdentical(statements, s1, s2)) {
                return [s1, s2]
            }
        }
    }
    return false
}

function statementsAreIdentical(statements, s1, s2) {
    let stmt1 = statements[s1]
    let stmt2 = statements[s2]
    if (stmt1.text == stmt2.text) return true
    if (stmt1 instanceof StmtSIsT && stmt1.truth == 1 && stmt1.statement == s2) return true
    if (stmt2 instanceof StmtSIsT && stmt2.truth == 1 && stmt2.statement == s1) return true
    return stmt1.constructor === stmt2.constructor && stmt1.box == stmt2.box && stmt1.truth == stmt2.truth &&
    stmt1.statement == stmt2.statement && stmt1.variant == stmt2.variant && stmt1.word == stmt2.word
}

function hasPluralWord(statements, word, plural) {
    for (let s of statements) {
        if (s.word == word) {
            for (let s2 of statements) {
                if (s2.text.includes(plural)) return true
            }
        }
    }
}

function findStatement(self, statements, statement, multiple=false) {
    results = []
    for (let s of statements) {
        if (s.currentBox == statement) {
            results.push(s)
        }
    }
    if (multiple) return results
    if (statement == self.currentBox) return self
    if (results.length != 1) return null
    return results[0]
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getRandomStatement(currentBox, numBoxes) {
    let stmt = _getRandomStatement(currentBox, numBoxes)
    stmt.currentBox = currentBox
    return stmt
}
function _getRandomStatement(currentBox, numBoxes) {
    let choice = randInt(13)
    let variant = randInt(2)
    let variant3 = randInt(3)
    let variant4 = randInt(4)
    let box = randInt(numBoxes)
    let box2 = randInt(numBoxes)
    let truth = randInt(2)
    let word = ["GEMS", "STATEMENT", "TRUE", "FALSE", "BOX", "EMPTY"][randInt(6)]
    switch (choice) {
        case 0: return new StmtTrue(truth)
        case 1: return new StmtGemsInX(truth, currentBox, box)
        case 2: return new StmtSIsT(truth, currentBox, box)
        case 3: return new StmtSIsOnlyT(truth, currentBox, box)
        case 4: return new StmtGemsInT(truth, variant)
        case 5: return new StmtGemsInAllT(truth, variant)
        case 6: return new StmtOthersAreT(truth, currentBox, variant)
        case 7: return new StmtTwoT(truth)
        case 8:
            if (box == box2) box2 = (box2 + 1 + randInt(2)) % 3
            return new StmtSImpliesT(currentBox, box, box2, truth)
        case 9:
            if (box == box2) box2 = (box2 + 1 + randInt(2)) % 3
            return new StmtSEqualsT(currentBox, box, box2, truth)
        case 10: return new StmtGemsInW(truth, word)
        case 11: return new StmtWIsT(truth, word, variant3)
        case 12: return new StmtTIsW(truth, word ,variant4)
    }
}

COLORS = ["BLUE", "WHITE", "BLACK", "RED"]
TRUTH = ["FALSE", "TRUE"]
NUMBERS = ["ZERO", "ONE", "TWO", "THREE"]

function getBoxStr(currentBox, targetBox) {
    if (currentBox == targetBox) return "THIS BOX"
    return "THE " + COLORS[targetBox] + " BOX"
}

function getStmtStr(currentBox, targetBox) {
    if (currentBox == targetBox) return "THIS STATEMENT"
    return "THE STATEMENT ON THE " + COLORS[targetBox] + " BOX"
}

function randInt(stop) {
  return Math.floor(Math.random() * stop);
}

class StmtTrue {
  constructor(truth) {
    this.truth = truth
    if (truth) {
        this.text = ["THIS BOX HAS A STATEMENT.",
        "AT LEAST ONE OF THE OTHER BOXES IS EMPTY.",
        "THERE ARE TWO EMPTY BOXES.",
        "THERE IS AT LEAST ONE TRUE STATEMENT.", 
        "AT LEAST ONE OTHER STATEMENT IS OPPOSITELY AS TRUE AS THIS STATEMENT.",
        ][randInt(5)]
    }
    else {
        this.text = ["THIS IS NOT A STATEMENT.",
        "THIS STATEMENT IS MEANINGLESS.",
        "THIS IS THE ONLY EMPTY BOX.",
        "ALL OF THE OTHER STATEMENTS ARE EXACTLY AS TRUE AS THIS ONE.", 
        "NONE OF THE OTHER STATEMENTS ARE OPPOSITELY AS TRUE AS THIS STATEMENT."
        ][randInt(5)]
    }
  }
  evaluate() {
    return this.truth
  }
}

class StmtGemsInX {
    constructor(truth, currentBox, targetBox) {
        this.truth = truth
        this.box = targetBox
        this.boxHasGems = targetBox
    if (truth) {
        this.text = [getBoxStr(currentBox, targetBox) + " CONTAINS THE GEMS.",
        "THE GEMS ARE IN " + getBoxStr(currentBox, targetBox) + ".",
        ][randInt(2)]
    }
    else {
        this.text = [getBoxStr(currentBox, targetBox) + " IS EMPTY.",
        "THE GEMS ARE NOT IN " + getBoxStr(currentBox, targetBox) + ".",
        ][randInt(2)]
    }
    if (currentBox == targetBox && randInt(2) == 0) {
        if (truth) this.text = "ALL OF THE OTHER BOXES ARE EMPTY."
        else this.text = "EXACTLY ONE OF THE OTHER BOXES IS EMPTY." //TODO: Fix for larger numbers
    }
  }
  evaluate(statements, gems) {
    return (gems == this.box) == this.truth
  }
}

class StmtGemsInT {
    constructor(truth, variant) {
        this.truth = truth
        this.variant = variant
        this.boxHasGems = -1
        if (variant)
            this.text = ["ALL BOXES WITH A " + TRUTH[1 - truth] + " STATEMENT ARE EMPTY.",
            "NONE OF THE BOXES WITH A " + TRUTH[1 - truth] + " STATEMENT CONTAIN GEMS.",
            ][randInt(2)]
        else
            this.text = "THE GEMS ARE IN A BOX WITH A " + TRUTH[truth] + " STATEMENT."
  }
  evaluate(statements, gems) {
    for (let s of statements) {
        if (!this.variant && gems == s.currentBox && s.value == this.truth)
            return true
        if (this.variant && gems == s.currentBox && s.value != this.truth)
            return false
    }
    return this.variant
  }
}

class StmtGemsInAllT {
    constructor(truth, variant) {
        this.truth = truth
        this.variant = variant
        this.boxHasGems = -1
        if (variant)
            this.text = ["AT LEAST ONE BOX WITH A " + TRUTH[truth] + " STATEMENT IS EMPTY.",
            "AT LEAST ONE EMPTY BOX HAS A " + TRUTH[truth] + " STATEMENT.",
            //"NOT ALL BOXES WITH A " + TRUTH[truth] + " STATEMENT CONTAIN GEMS.",
            //"NOT ALL EMPTY BOXES HAVE " + TRUTH[1 - truth] + " STATEMENTS.",
            ][randInt(2)]
        else
            this.text = ["ALL BOXES WITH A " + TRUTH[truth] + " STATEMENT CONTAIN GEMS.",
            "ALL EMPTY BOXES HAVE " + TRUTH[1 - truth] + " STATEMENTS.",
            "NONE OF THE BOXES WITH A " + TRUTH[truth] + " STATEMENT ARE EMPTY.",
            "NONE OF THE EMPTY BOXES HAVE A " + TRUTH[truth] + " STATEMENT.",
            ][randInt(4)]
  }
  evaluate(statements, gems, boxes) {
    for (let s of statements) {
        if (s.value == this.truth && gems != s.currentBox)
            return this.variant
    }
    if (this.text == "ALL EMPTY BOXES HAVE " + TRUTH[1 - this.truth] + " STATEMENTS.") { 
        for (let b of boxes) { 
            if (b.length > 1) return !this.value //Phrase is ambiguous when multiple statements are involved
        }
        for (let b of boxes) { 
            if (b.length == 0) return false //Must be false when there is a blank box
        }
    }
    return !this.variant
  }
}

class StmtSIsT { 
    constructor(truth, currentBox, statement) {
        this.truth = truth
        this.statement = statement
        this.text = getStmtStr(currentBox, statement) + " IS " + TRUTH[truth] + "."
        if (currentBox == statement && randInt(2) == 0) {
            this.text = "ALL OF THE OTHER STATEMENTS ARE AT LEAST AS FALSE AS THIS STATEMENT."
        }
  }
  evaluate(statements) {
    let s = findStatement(this, statements, this.statement)
    if (!s) return !this.value //TODO: Allow multiple?
    return s.value == this.truth
  }
}

class StmtSIsOnlyT {
    constructor(truth, currentBox, statement) {
        this.truth = truth
        this.statement = statement
        this.text = getStmtStr(currentBox, statement) + " IS THE ONLY " + TRUTH[truth] + " STATEMENT."
        if (currentBox == statement) {
            this.text = ["ALL OF THE OTHER STATEMENTS ARE " + TRUTH[1 - truth] + ".",
            "NONE OF THE OTHER STATEMENTS ARE " + TRUTH[truth] + ".",
            "THIS IS THE ONLY " + TRUTH[truth] + " STATEMENT.",
            ][randInt(2)]
        }
  }
  evaluate(statements) {
    let s = findStatement(this, statements, this.statement)
    if (this.currentBox == this.statement) s = this
    if (!s) return !this.value //TODO: Allow multiple?
    for (let s2 of statements) {
        if (s2 === s && s2.value != this.truth ||
            s2 !== s && s2.value == this.truth)
            return false
    }
    return true
  }
}

class StmtOthersAreT {
    constructor(truth, currentBox, variant) {
        this.box = currentBox; this.truth = truth; this.variant = variant
        if (variant)
            this.text = ["EXACTLY ONE OF THE OTHER STATEMENTS IS " + TRUTH[truth] + ".",
            "AT LEAST ONE OTHER STATEMENT IS EXACTLY AS TRUE AS THIS STATEMENT.",
            ][randInt(2)]
        else
            this.text = "AT LEAST ONE OF THE OTHER STATEMENTS IS " + TRUTH[truth] + "."
    }
    evaluate(statements) {
        let count = 0
        for (let s of statements) {
            if (s === this) continue
            if (s.value == this.truth) count++
        }
        return this.variant ? count == 1 : count >= 1
    }
}

class StmtTwoT { //TODO: Fix for larger numbers
    constructor(truth, variant) {
        this.truth = truth
        if (variant) this.text = "THERE ARE TWO " + TRUTH[truth] + " STATEMENTS."
        else this.text = "THERE IS ONLY ONE " + TRUTH[truth] + " STATEMENT."
    }
    evaluate(statements) {
        let count = 0
        for (let s of statements) {
            if (s.value == this.truth) count++
        }
        return this.variant ? count == 2 : count == 1
    }
}

class StmtSImpliesT {
    constructor(currentBox, s1, s2, truth) {
        this.box = s1
        this.statement = s2
        this.truth = truth
        this.text = [getStmtStr(currentBox, s2) + " IS AT LEAST AS " + TRUTH[truth] + " AS " + getStmtStr(currentBox, s1) + ".",
            getStmtStr(currentBox, s2) + " IS NO MORE " + TRUTH[1 - truth] + " THAN " + getStmtStr(currentBox, s1) + ".",
            //"IF " + getStmtStr(currentBox, s1) + " IS  " + TRUTH[truth] + ", THEN " + getStmtStr(currentBox, s2) + " IS ALSO " + TRUTH[truth] + ".",
        ][randInt(2)]
    }
    evaluate(statements) {
        let s1 = findStatement(this, statements, this.box)
        let s2 = findStatement(this, statements, this.statement)
        if (!s1 || !s2) return !this.value //TODO: Allow multiple?
        return s1.value == !this.truth || s2.value == this.truth
    }
}

class StmtSEqualsT {
    constructor(currentBox, s1, s2, truth) {
        this.box = s1
        this.statement = s2
        this.truth = truth
        if (truth)
            this.text = getStmtStr(currentBox, s1) + " IS EXACTLY AS TRUE AS " + getStmtStr(currentBox, s2) + "."
        else
            this.text = getStmtStr(currentBox, s1) + " IS OPPOSITELY AS TRUE AS " + getStmtStr(currentBox, s2) + "."
  }
  evaluate(statements) {
        let s1 = findStatement(this, statements, this.box)
        let s2 = findStatement(this, statements, this.statement)
        if (!s1 || !s2) return !this.value //TODO: Allow multiple?
        return (s1.value == s2.value) == this.truth
  }
}

class StmtGemsInW {
    constructor(truth, word) {
        this.truth = truth
        this.word = word
        this.boxHasGems = -1
    if (truth) {
        this.text = ["A BOX WITH THE WORD \"" + word + "\" CONTAINS THE GEMS.",
        "THE GEMS ARE IN A BOX WITH THE WORD  \"" + word + "\".",
        ][randInt(2)]
    }
    else {
        this.text = ["ALL BOXES WITH THE WORD \"" + word + "\" ARE EMPTY.",
        "THE GEMS ARE NOT IN A BOX WITH THE WORD  \"" + word + "\".",
        "THE GEMS ARE IN A BOX WITHOUT THE WORD  \"" + word + "\".",
        ][randInt(3)]
    }
  }
  evaluate(statements, gems) {
    for (let s of statements) {
        if (s.currentBox == gems && s.text.includes(this.word)) return this.truth
    }
    return !this.truth
  }
}

class StmtWIsT {
    constructor(truth, word, variant3) {
        this.truth = truth; this.word = word; this.variant = variant3
        if (variant3 == 0)
            this.text = "EXACTLY ONE STATEMENT WITH THE WORD \"" + word + "\" IS " + TRUTH[truth] + "."
        else if (variant3 == 1)
            this.text = "AT LEAST ONE STATEMENT WITH THE WORD \"" + word + "\" IS " + TRUTH[truth] + "."
        else
            this.text = ["ALL STATEMENTS WITH THE WORD \"" + word + "\" ARE " + TRUTH[truth] + ".",
                "NO STATEMENT WITH THE WORD \"" + word + "\" IS " + TRUTH[1 - truth] + ".",
            ][randInt(2)]
    }
    evaluate(statements) {
        let count = 0
        for (let s of statements) {
            if (!s.text.includes(this.word)) continue
            if (this.variant == 2 && s.value != this.truth) return false
            if (s.value == this.truth) count++
        }
        return this.variant ? count >= 1 : count == 1
    }
}

class StmtTIsW {
    constructor(truth, word, variant4) {
        this.truth = truth; this.word = word; this.variant = variant4
        if (variant4 == 0)
            this.text = "EXACTLY ONE " + TRUTH[truth] + " STATEMENT HAS THE WORD \"" + word + "\"."
        else if (variant4 == 1)
            this.text = "AT LEAST ONE " + TRUTH[truth] + " STATEMENT HAS THE WORD \"" + word + "\"."
        else if (variant4 == 2)
            this.text = "ALL " + TRUTH[truth] + " STATEMENTS HAVE THE WORD \"" + word + "\"."
        else
            this.text = "NO " + TRUTH[truth] + " STATEMENT HAS THE WORD \"" + word + "\"."

    }
    evaluate(statements) {
        let count = 0
        for (let s of statements) {
            if (s.value != this.truth) continue
            if (this.variant == 2 && !s.text.includes(this.word)) return false
            if (this.variant == 3 && s.text.includes(this.word)) return false
            if (s.text.includes(this.word)) count++
        }
        return this.variant ? count >= 1 : count == 1
    }
}



//puzzle = {"statements": [new StmtGemsInX(0, 2, 2), new StmtGemsInT(0)], "numBoxes": 3}
//puzzle.statements[0].currentBox = 2
//puzzle.statements[1].currentBox = 1

puzzle = generate()
displayPuzzle(puzzle)

console.log(puzzle)
solution = solve(puzzle)
console.table(solution)
solution = solution[0]
gemLoc = parseInt(solution[solution.length - 1])
duplicated = hasDuplicateStatement(puzzle)
if (duplicated) {
    console.log("Duplicate Statements!", duplicated)
    console.log("Gems in Unique Box? ", !duplicated.includes(gemLoc))
}
if (canMetagame(puzzle.statements))
    console.log("Puzzle can be metagamed!")