import { WriteStream } from "fs";
import { LogLevel } from "RFR";

export default class Logger {
    private static outputs: (WriteStream|NodeJS.WriteStream)[] = [process.stdout];
    private static level: LogLevel = LogLevel.FATAL

    public static log(toPrint: string, level: LogLevel | number) {
        const LEVELSTR = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"]
        const NOW = new Date()
        if (level <= Logger.level) {
            Logger.outputs.forEach(strm => strm.write(
                `[${LEVELSTR[level]}]-(${NOW.getDate()}/${NOW.getMonth()}/${NOW.getFullYear()} ` +
                `${NOW.getHours()}h${NOW.getMinutes()}m${NOW.getSeconds()}s): ${toPrint}\n`
            ))
        }
    }

    public static init(outputs: (WriteStream|NodeJS.WriteStream)[],
                      level: LogLevel | number) {
        Logger.outputs = outputs
        Logger.level = level
    }
}