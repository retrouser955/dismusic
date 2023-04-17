import { default as chalk } from "chalk"

export default class Debugger {
    static debugString = `${chalk.blue('[')} ${chalk.gray("DEBUG")} ${chalk.blue("]")}` as const

    static createObjectLog(object: object, removeQuotes?: boolean) {
        const string = chalk.gray(JSON.stringify(object)).replaceAll("{", chalk.blue("{ ")).replace("}", chalk.blue(" }"))

        if(removeQuotes) return string.replaceAll("\"", "")

        return string
    }

    static createArrayLog(array: Array<any>, removeQuotes?: boolean) {
        const string = chalk.gray(JSON.stringify(array)).replaceAll('[', chalk.blue('[ ')).replace("]", chalk.blue(" ]"))

        if(removeQuotes) return string.replaceAll("\"", "")

        return string
    }

    static log(message: string) {
        // @ts-ignore: Debug mode
        console.log(`${this.debugString} ${message}`)
    }
}