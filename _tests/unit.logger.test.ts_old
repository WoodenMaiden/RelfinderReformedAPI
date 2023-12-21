import { createWriteStream } from 'fs';

import Logger from '../src/utils/logger';

describe('Logs', () => {
    let writeSpy: any
    const toLog = "some log we're trying to write"
    const stream = createWriteStream('/dev/null', {flags: 'a'})

    Logger.init([stream], 4)

    beforeEach(() => {
        jest.clearAllMocks()
        writeSpy = jest.spyOn(stream, "write")
    })

    it('should log something with the same log level', () => {
        Logger.log(toLog, 4)
        expect(writeSpy.mock.calls[0][0]).toContain(toLog)
    })

    it('should log something with a lower log level', () => {
        Logger.log(toLog, 0)
        expect(writeSpy.mock.calls[0][0]).toContain(toLog)
    })

    it("shouldn't log something with a higher log level", () => {
        Logger.log(toLog, 5)
        expect(writeSpy).not.toHaveBeenCalled()
    })

    afterAll(() => {
        stream.destroy()
    })
})