import { WriteStream } from "fs";
import { LogLevel } from "RFR";

export default class Logger {
    private static outputs: (WriteStream|NodeJS.WriteStream)[] = [process.stdout];
    private static level: LogLevel = LogLevel.FATAL
    private static LEVELSTR: string[] = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"]

    public static init(outputs: (WriteStream|NodeJS.WriteStream)[],
                      level: LogLevel | number) {
        Logger.outputs = outputs
        Logger.level = level
    }

    private static format(toPrint: string, level: LogLevel | number, color?: string): string {
        const NOW = new Date()

        return `${(color)? `${color}`: ''}` +
            `[${this.LEVELSTR[level]}]-(${NOW.getDate()}/${NOW.getMonth()}/${NOW.getFullYear()} ` +
            `${NOW.getHours()}h${NOW.getMinutes()}m${NOW.getSeconds()}s): ${toPrint}` +
            `${(color)? '\x1b[0m\n': '\n'}`
    }

    public static log(toPrint: string, level: LogLevel | number, color?: string) {
        if (level <= Logger.level) {
            Logger.outputs.forEach(strm =>
                (strm === process.stdout || strm === process.stderr) // to avoid writing escape codes and ansi codes into non console
                    ? strm.write(this.format(toPrint, level, color))
                    : strm.write(this.format(toPrint, level))
            )
        }
    }

    // macros
    public static fatal(toPrint: string) {
        this.log(toPrint, LogLevel.FATAL, "\x1b[41m")
    }

    public static error(toPrint: string) {
        this.log(toPrint, LogLevel.ERROR, "\x1b[31m")
    }

    public static warn(toPrint: string) {
        this.log(toPrint, LogLevel.WARN, "\x1b[33m")
    }

    public static info(toPrint: string) {
        this.log(toPrint, LogLevel.INFO, "\x1b[32m")
    }

    public static debug(toPrint: string) {
        this.log(toPrint, LogLevel.DEBUG, "\x1b[34m")
    }

    public static trace(toPrint: string) {
        this.log(toPrint, LogLevel.TRACE)
    }
}