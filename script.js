

//Statement types:
//No statement (None)
//Visual Statements (Visual) =This box is C. =S has N words. =S says "?"
// -The gems are in a box with a statement. (When X is None) 
//The gems are in a box with the word "W" on it. (Gems in W stmt, W)
//All statements containing the word "W" are T. (All stmts with W are T, W, T).
//-No statement containing the word "W" is T.
//All other statements containing the word "W" are T. (All other stmts with W are T, W, T).
//-No other statement containing the word "W" is T.l
//This box and X are T. (This and X are T, X, T)
//X is the only T statement. (X is only T, X, T)
//S statement is useless. (S Useless) ALL OTHER STATEMENTS ARE AT LEAST AS FALSE AS THIS STATEMENT.
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

function displayPuzzle(statements) {
    for (let box = 0; box < statements.length; box++) {
        let el = document.getElementById("box" + (box + 1))
        el.innerHTML = statements[box].text;
        if (statements[box].text.length > 65) {
            el.className = "size2"
        }
    }
}

function generate(boxes=3, duplicate=null, gemsInDuplicateBox=false, multi=false) {
    let statements = []
    if (duplicate === null && randInt(10) == 0) {
        duplicate = true
        gemsInDuplicateBox = randInt(2)
    }
    else duplicate = false
    while(true) {
        for (let box = 0; statements.length < boxes; box++) {
            statements.push(getRandomStatement(box))
        }
        let swapPoint = randInt(statements.length)
        console.log(statements)
        for (let trial = 0; trial < 20; trial++) {
            statements[swapPoint] = getRandomStatement(swapPoint)
            if (validPuzzle(statements, duplicate, gemsInDuplicateBox)) {
                return statements
            }
        }
    }
}

function solve(statements) {
    let valid_sol = []
    for (let gems = 0; gems < 3; gems++) {
        for (let truth = 1; truth < 7; truth++) {
            let truthArray = [truth & 1, (truth & 2) >> 1, (truth & 4) >> 2]
            if (isLogicallyValid(statements, truthArray, gems)) {
                valid_sol.push("" + truthArray[0] + truthArray[1] + truthArray[2] + " G" + gems)
                break
            }
        }
    }
    return valid_sol
}

function getAllSolutions(statements) {
    let valid_sol = []
    for (let gems = 0; gems < 3; gems++) {
        for (let truth = 1; truth < 7; truth++) {
            let truthArray = [truth & 1, (truth & 2) >> 1, (truth & 4) >> 2]
            if (isLogicallyValid(statements, truthArray, gems)) {
                valid_sol.push("" + truthArray[0] + truthArray[1] + truthArray[2] + " G" + gems)
            }
        }
    }
    return valid_sol
}

function isLogicallyValid(statements, truth, gems) {
    for (let stmt = 0; stmt < statements.length; stmt++) {
        if (statements[stmt].evaluate(truth, gems) != truth[stmt]) {
            return false
        }
    }
    return true
}

function validPuzzle(statements, duplicate=false, gemsInDuplicateBox=false) {
    if (canMetagame(statements) && randInt(10) != 0) return false
    let solution = solve(statements)
    if (solution.length != 1) return false
    let duplicateStmts = hasDuplicateStatement(statements)
    if (duplicateStmts && duplicate === false || !duplicateStmts && duplicate === true)
        return false
    if (duplicate) {
        let gems = parseInt(solution[0][solution[0].length - 1])
        if (gemsInDuplicateBox != duplicateStmts.includes(gems)) return false
    }
    //let gems = solution[0][solution[0].length - 1]
    //let duplicate = hasDuplicateStatement(statements)
    //if (duplicate && !duplicate.includes(gems) && randInt(1) != 0) return false
    //if (!duplicate) return false
    return true
}

function canMetagame(statements) {
    let boxes = new Set()
    for (const stmt of statements) {
        let box = stmt.boxHasGems
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
    return stmt1.constructor === stmt2.constructor && stmt1.box == stmt2.box &&
    stmt1.truth == stmt2.truth && stmt1.statement == stmt2.statement && stmt1.variant == stmt2.variant
}

function getRandomStatement(currentBox) {
    let choice = randInt(10)
    let variant = randInt(2)
    let box = randInt(3)
    let box2 = randInt(3)
    let truth = randInt(2)
    switch (choice) {
        case 0: return new StmtTrue(truth)
        case 1: return new StmtGemsInX(truth, currentBox, box)
        case 2: return new StmtSIsT(truth, currentBox, box)
        case 3: return new StmtSIsOnlyT(truth, currentBox, box)
        case 4: return new StmtGemsInT(truth)
        case 5: return new StmtGemsInAllT(truth, variant)
        case 6: return new StmtOthersAreT(truth, currentBox, variant)
        case 7: return new StmtTwoT(truth)
        case 8:
            if (box == box2) box2 = (box2 + 1 + randInt(2)) % 3
            return new StmtSImpliesT(currentBox, box, box2, truth)
        case 9:
            if (box == box2) box2 = (box2 + 1 + randInt(2)) % 3
            return new StmtSEqualsT(currentBox, box, box2, truth)
    }
}

COLORS = ["BLUE", "WHITE", "BLACK"]
TRUTH = ["FALSE", "TRUE"]

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
        "THERE IS AT LEAST ONE FALSE STATEMENT.",
        ][randInt(5)]
    }
    else {
        this.text = ["THIS IS NOT A STATEMENT.",
        "THIS STATEMENT IS MEANINGLESS.",
        "THIS IS THE ONLY EMPTY BOX.",
        "ALL STATEMENTS ARE TRUE.", 
        "ALL STATEMENTS ARE FALSE."
        ][randInt(5)]
    }
  }
  evaluate(truthArray, gems) {
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
        else this.text = "EXACTLY ONE OF THE OTHER BOXES IS EMPTY."
    }
  }
  evaluate(truthArray, gems) {
    return this.truth ? gems == this.box : gems != this.box
  }
}

class StmtSIsT {
    constructor(truth, currentBox, statement) {
        this.truth = truth
        this.statement = statement
        this.text = getStmtStr(currentBox, statement) + " IS " + TRUTH[truth] + "."
        if (currentBox == statement && randInt(2) == 0) {
            this.text = "ALL OTHER STATEMENTS ARE AT LEAST AS FALSE AS THIS STATEMENT."
        }
  }
  evaluate(truthArray, gems) {
    return this.truth == truthArray[this.statement]
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
  evaluate(truthArray, gems) {
        for (let t = 0; t < truthArray.length; t++) {
            if (t == this.statement && truthArray[t] != this.truth ||
                t != this.statement && truthArray[t] == this.truth)
                return false
        }
        return true
  }
}

class StmtGemsInT {
    constructor(truth) {
        this.truth = truth
        this.boxHasGems = -1
        this.text = ["THE GEMS ARE IN A BOX WITH A " + TRUTH[truth] + " STATEMENT.",
        "ALL BOXES WITH A " + TRUTH[1 - truth] + " STATEMENT ARE EMPTY.",
        "NONE OF THE BOXES WITH A " + TRUTH[1 - truth] + " STATEMENT CONTAIN GEMS.",
        ][randInt(2)]
  }
  evaluate(truthArray, gems) {
    return this.truth == truthArray[gems]
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
  evaluate(truthArray, gems) {
        for (let t = 0; t < truthArray.length; t++) {
            if (truthArray[t] == this.truth && t != gems) return this.variant
        }
        return !this.variant
  }
}

class StmtOthersAreT {
    constructor(truth, currentBox, variant) {
        this.box = currentBox; this.truth = truth; this.variant = variant
        if (variant)
            this.text = "EXACTLY ONE OF THE OTHER STATEMENTS IS " + TRUTH[truth] + "."
        else
            this.text = ["AT LEAST ONE OF THE OTHER STATEMENTS IS " + TRUTH[truth] + ".",
            "NOT ALL OF THE OTHER STATEMENTS ARE " + TRUTH[1 - truth] + "."
            ][randInt(2)]
    }
    evaluate(truthArray, gems) {
        let count = 0
        for (let t = 0; t < truthArray.length; t++) {
            if (t == this.box) continue
            if (truthArray[t] == this.truth) count++
        }
        return this.variant ? count == 1 : count >= 1
    }
}

class StmtTwoT {
    constructor(truth) {
        this.truth = truth
        this.text = ["THERE ARE TWO " + TRUTH[truth] + " STATEMENTS.",
        "THERE IS ONLY ONE " + TRUTH[1 - truth] + " STATEMENT.",
        ][randInt(2)]
    }
    evaluate(truthArray, gems) {
        let count = 0
        for (let t = 0; t < truthArray.length; t++) {
            if (truthArray[t] == this.truth) count++
        }
        return count == 2
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
    evaluate(truthArray, gems) {
        return truthArray[this.box] == !this.truth || truthArray[this.statement] == this.truth
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
  evaluate(truthArray, gems) {
    return (truthArray[this.box] == truthArray[this.statement]) == this.truth
  }
}

class StmtOthersEqualT {
    constructor(currentBox, truth, variant) {
        this.box = currentBox
        this.truth = truth
        this.variant = variant
        if (variant) {
            this.text = "EXACTLY ONE OTHER STATEMENT IS AS " + TRUTH[truth] + " AS THIS STATEMENT."
        }
        else {
            this.text = "AT LEAST ONE OTHER STATEMENT IS AS " + TRUTH[truth] + " AS THIS STATEMENT."
        }
    }
    evaluate(truthArray, gems) {
        return truthArray[this.box] == !this.truth || truthArray[this.statement] == this.truth
    }
}

//puzzle = [new StmtTwoT(1), new StmtTrue(0), new StmtGemsInAllT(1, 1)]

puzzle = generate()
displayPuzzle(puzzle)

console.log(puzzle)
solution = getAllSolutions(puzzle)
console.table(solution)
solution = solution[0]
gemLoc = parseInt(solution[solution.length - 1])
duplicated = hasDuplicateStatement(puzzle)
if (duplicated) {
    console.log("Duplicate Statements!", duplicated)
    console.log("Gems in Unique Box? ", !duplicated.includes(gemLoc))
}
if (canMetagame(puzzle))
    console.log("Puzzle can be metagamed!")