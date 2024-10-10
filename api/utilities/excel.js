const xl = require('excel4node');
const fs = require("fs")
const template = require("../routes/template");
const { POST } = require('./request');
const logger = require("../logger");
const cacheImport = require("../utilities/cache")
const { http } = require('winston');
const { generate, parse, transform, stringify } = require('csv/sync');
const Excel = require('exceljs');
const currentPath = process.cwd();
const cache = new cacheImport.cacheClass()
class style{
    constructor() { }
    font = {
        name: undefined,
        family: undefined,
        color: undefined,
        size: undefined,
        bold: undefined,
        charset: undefined,
        condense: undefined,
        extend: undefined,
        italics: undefined,
        outline: undefined,
        scheme: undefined,
        shadow: undefined,
        strike: undefined,
        size: undefined,
        underline: undefined,
        vertAlign: undefined
    }
    border = { // §18.8.4 border (Border)
        left: {
            style: undefined, //§18.18.3 ST_BorderStyle (Border Line Styles) ['none', 'thin', 'medium', 'dashed', 'dotted', 'thick', 'double', 'hair', 'mediumDashed', 'dashDot', 'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot']
            color: undefined // HTML style hex value
        },
        right: {
            style: undefined,
            color: undefined
        },
        top: {
            style: undefined,
            color: undefined
        },
        bottom: {
            style: undefined,
            color: undefined
        },
        diagonal: {
            style: undefined,
            color: undefined
        },
        diagonalDown: undefined,
        diagonalUp: undefined,
        outline: undefined
    }
    fill = { // §18.8.20 fill (Fill)
        type: undefined, // Currently only 'pattern' is implemented. Non-implemented option is 'gradient'
        patternType: undefined, //§18.18.55 ST_PatternType (Pattern Type)
        bgColor: undefined, // HTML style hex value. defaults to black
        fgColor: undefined, // HTML style hex value. defaults to black.
    }
    numberFormat = undefined // §18.8.30 numFmt (Number Format)
}
class excelSheet{
    constructor(name) {
        this.name = name
        this.cellValues = {}
    }
    setCell(posX, posY, type, value, style) {
        this.cellValues[posX + "-" + posY] = {
            value: value,
            type: type, // number, string, formula, bool
            style: style,
        }
    }
    recordsFromTable(req) {// we assume the cells are in a table where the headers are on the first row
        //cache.write("recordFromTableTest", this.cellValues, req)
        let listOfRows = this.toListOfRows(req)
        //cache.write("listOfRowsTest", listOfRows, req)
        let headers = listOfRows[0]
        let firstTime = true
        let result = []
        for (let row of listOfRows) {
            if (firstTime) {// skip the headers row
                firstTime = false
            } else {
                if (row.length != 0) { // skip empty
                    let tempRes = {}
                    let index = 0
                    for (let header of headers) {
                        tempRes[header] = row[index]
                        index += 1
                    }
                    result.push(tempRes)
                }
            }
        }
        //cache.write("recordFromTableTestResult", result, req)
        return result
    }
    toListOfRows(req) {
        let rows = {}
        for (let cellKey of Object.keys(this.cellValues)) {// loop through cells to make a map of each row and the contents of them
            let cellX = cellKey.split("-")[0]
            let cellY = cellKey.split("-")[1]
            if (rows[cellY] == undefined) {
                rows[cellY] = {}
                rows[cellY][cellX] = this.cellValues[cellKey]
            } else {
                rows[cellY][cellX] = this.cellValues[cellKey]
            }
        }
        //cache.write("pulaInMata2", rows, req)
        let loopRun = true
        let index = 1
        let result = []
        function largestInList(array) {
            let max = 0
            for (let item of array) {
                if (Number(item) > max) {
                    max = item
                }
            }
            return max
        }
        while (loopRun) {// loop through the rows in a while loop not a for loop because if there are empty rows we should be able to skip them
            //https://csv.js.org/stringify/api/sync/
            if (rows[index] != undefined) {
                let sLoopRun = true
                let sIndx = 1
                let sResult = []
                while (sLoopRun) {
                    if (rows[index][sIndx] != undefined) {
                        let cell = rows[index][sIndx]
                        sResult.push(cell.value)
                    } else {
                        //console.log(index + " " + sIndx + " " + rows[index][sIndx])
                        sResult.push(undefined)
                    }
                    
                    sLoopRun = largestInList(Object.keys(rows[index])) > sIndx
                    sIndx += 1
                    if (sIndx > 100000) {
                        logger.warn("100.000 repetitions of csv save row second loop")
                    }
                }
                result.push(sResult)
            } else {
                result.push([])
            }
            loopRun = largestInList(Object.keys(rows)) > index
            if (!loopRun) {
                //console.log(Object.keys(rows).length)
            }
            index += 1;
            if (index > 100000) {
                logger.warn("100.000 repetitions of csv save row first loop")
            }
        }
        return result
    }
}
class excelWorkbook {
    constructor(name) {
        this.sheets = []
        this.name = name
    }
    addSheet(sheet) {
        this.sheets.push(sheet)
    }
    removeSheet(sheetName) {
        let index = 0
        for (let sheet of this.sheets) {
            if (sheet.name == sheetName) {
                this.sheets.splice(index, 1)
            }
            index += 1
        }
    }
    getSheet(sheetName) {
        let index = 0
        for (let sheet of this.sheets) {
            if (sheet.name == sheetName) {
                return sheet
            }
            index += 1
        }
    }
} 

function checkPathEndSlash(path) {
    return (path[path.length - 1] == "/") ? path : path + "/" 
}

module.exports = {
    excelUtil: class extends template.Utillity {
        constructor() {
            super("excel")
        }
        excelSheet = excelSheet
        excelWorkbook = excelWorkbook
        excelStyle = style

        async test(req) {
            let newWorkbook = new excelWorkbook("testWb")
            let newSheet = new excelSheet("testSheet")
            newSheet.setCell(1, 1, "string", "Name(A1)")
            newSheet.setCell(2, 1, "string", "Phone(B1)")
            newSheet.setCell(3, 1, "string", "Age(C1)")
            newSheet.setCell(1, 2, "string", "Cezar(A2)")
            newSheet.setCell(3, 2, "string", "15(C2)")
            newSheet.setCell(1, 5, "string", "John(A5)")
            newSheet.setCell(3, 5, "string", "32(C5)")
            newSheet.setCell(1, 6, "string", "James(A6)")
            newSheet.setCell(2, 6, "string", "112(B6)")
            newSheet.setCell(3, 6, "string", "21(C6)")
            newWorkbook.addSheet(newSheet)
            await this.saveWorkbook(newWorkbook, currentPath, "csv", undefined)
            await this.saveWorkbook(newWorkbook, currentPath, "xlsx", undefined)
            console.log(await this.loadWorkbook(currentPath, "testWb-testSheet", "csv"))
            console.log(await this.loadWorkbook(currentPath, "testWb", "xlsx"))
            console.log((await this.loadWorkbook(currentPath, "testWb-testSheet", "csv")).getSheet("Sheet 1").recordsFromTable())
        }

        //httpResponseWithFile: you can pass the res object so that it directly sends it to a client
        async saveWorkbook(workbook, filePath, fileFormat, httpResponseWithFile, req) { 
            const wbName = workbook.name
            switch (fileFormat) {
                case "xlsx":
                    
                    var wb = new xl.Workbook({
                        opts: {
                            logger: {
                                warn: function (msg) {
                                    logger.warn(msg, req)
                                },
                                error: function (msg) {
                                    logger.announceError(msg, req)
                                }
                            }
                        }
                    });
                    for (let sheet of workbook.sheets) {
                        let newSheet = wb.addWorksheet(sheet.name)
                        for (let cellKey of Object.keys(sheet.cellValues)) {
                            let cellValue = sheet.cellValues[cellKey].value
                            let cellStyle = (sheet.cellValues[cellKey].style == undefined) ? {} : sheet.cellValues[cellKey].style
                            let cellType = sheet.cellValues[cellKey].type
                            // formula, number, string, bool
                            if (cellType == "formula" || cellType == "number" || cellType == "string" || cellType == "bool") {
                                newSheet.cell(cellKey.split("-")[1], cellKey.split("-")[0])[cellType](cellValue).style(wb.createStyle({font: cellStyle.font, border: cellStyle.border, fill: cellType.fill, numberFormat: cellType.numberFormat}))// finnish with cell types https://www.npmjs.com/package/excel4node?activeTab=readme
                            } else {
                                logger.announceError("Invalid cell type passed to saveWorkbook - check complete logs", undefined, {
                                    workbook: workbook,
                                    filePath: filePath,
                                    fileFormat: fileFormat,
                                    cellValue: cellValue,
                                    cellStyle: cellStyle,
                                    cellType: cellType,
                                })
                            }
                        }
                    }
                    if (httpResponseWithFile) {
                        wb.write(wbName + '.xlsx');
                    } else {
                        wb.write(checkPathEndSlash(filePath) + wbName + '.xlsx');
                    }
                    
                    break;
                case "xls":
                    break;
                case "xlt":
                    break;
                case "xlm":
                    break;
                case "xlsm":
                    break;
                case "xlsb":
                    break;
                case "xlt":
                    break;
                case "prn":
                    break;
                case "xlw":
                    break;
                case "txt":
                    break;
                case "csv":
                    logger.warn("Each sheet of the workbook will be saved as a seperate file(.csv)")
                    for (let sheet of workbook.sheets) {
                        let result = sheet.toListOfRows()
                        console.log(result)
                        const output = stringify(result)
                        fs.writeFileSync(checkPathEndSlash(filePath) + wbName + "-" + sheet.name + ".csv", output)
                    }
                    break;
                case "dif":
                    break;
                case "slk":
                    break;
                case "ods":
                    break;
            }
            
        }
        async loadWorkbook(workbookPath, fileName, fileFormat, columns, req) {
            // columns: when parsing a file with values defined by headers, automatically convert it to a map
            switch (fileFormat) {
                case "xlsx": // FINNISH THIS
                    let workbook = new Excel.Workbook();
                    await workbook.xlsx.readFile(checkPathEndSlash(workbookPath) + fileName + "." + "xlsx");
                    let resWb = new excelWorkbook(fileName)
                    break;
                case "xls":
                    break;
                case "xlt":
                    break;
                case "xlm":
                    break;
                case "xlsm":
                    break;
                case "xlsb":
                    break;
                case "xlt":
                    break;
                case "prn":
                    break;
                case "xlw":
                    break;
                case "txt":
                    break;
                case "csv":
                    const input = fs.readFileSync(checkPathEndSlash(workbookPath) + fileName + "." + fileFormat)
                    const parsed = parse(input, { columns: columns, relax_column_count: true })// skip empty lines true otherwise it throws an error on them :/
                    let newWb = new excelWorkbook(fileName)
                    let newSheet = new excelSheet("Sheet 1")
                    let posY = 1
                    for (let row of parsed) {
                        let posX = 1
                        for (let cell of row) {
                            if (cell != "" && cell != undefined) {
                                newSheet.setCell(posX, posY, (cell[0] == "=") ? "formula" : "string", cell, undefined)
                            }
                            posX += 1;
                        }
                        posY += 1;
                    }
                    newWb.addSheet(newSheet)
                    return newWb  
                    break;
                case "dif":
                    break;
                case "slk":
                    break;
                case "ods":
                    break;
            }
        }
    }
}